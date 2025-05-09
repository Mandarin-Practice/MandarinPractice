import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SentenceCard from "@/components/sentence-card";
import ScoreCard from "@/components/score-card";
import SuccessConfetti from "@/components/success-confetti";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { useToast } from "@/hooks/use-toast";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useUserWordList } from "@/hooks/use-user-word-list";
import { checkSimilarity } from "@/lib/string-similarity";

interface Sentence {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface Stats {
  completed: number;
  accuracy: string;
  avgTime: string;
  masteryPercent: number;
  masteredWords: number;
  totalWords: number;
  correctAnswers: number; // Track separate from masteredWords
}

export default function Practice() {
  const [, navigate] = useLocation();
  const [userTranslation, setUserTranslation] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"correct" | "partial" | "incorrect" | null>(null);
  const [showChinese, setShowChinese] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  // Track recently seen sentences to avoid repetition
  const [recentSentences, setRecentSentences] = useState<string[]>([]);
  // Track recently used sentence patterns to improve variety
  const [recentPatterns, setRecentPatterns] = useState<Set<string>>(new Set());
  // Track the current difficulty setting
  const [currentDifficulty, setCurrentDifficulty] = useState<string>(localStorage.getItem('difficulty') || 'beginner');
  
  // Handler to change the difficulty level
  const handleChangeDifficulty = (difficulty: string) => {
    // Update local state
    setCurrentDifficulty(difficulty);
    // Store in localStorage for persistence
    localStorage.setItem('difficulty', difficulty);
    // Regenerate a sentence with the new difficulty
    generateSentenceMutation.mutate();
    // Clear old translation when changing difficulty
    setUserTranslation("");
    setFeedbackStatus(null);
    
    // Show a toast notification
    toast({
      title: `Difficulty changed to ${difficulty}`,
      description: "The next sentence will use the new difficulty level.",
      variant: "default",
    });
  };
  
  const [stats, setStats] = useState<Stats>({
    completed: 0,
    accuracy: "0%",
    avgTime: "0s",
    masteryPercent: 0,
    masteredWords: 0,
    totalWords: 0,
    correctAnswers: 0
  });
  
  const { speak, isPlaying } = useTextToSpeech();
  const { playCorrectSound, playIncorrectSound } = useSoundEffects();

  // Fetch vocabulary words from user's word list with additional stability flags
  const { 
    wordList: vocabularyWords, 
    isLoading: isLoadingVocabulary,
    isError: isVocabularyError,
    hasWords 
  } = useUserWordList();
  
  // Set a local flag to prevent showing "no vocabulary" message too early
  const [fullyLoaded, setFullyLoaded] = useState(false);

  // Get toast hook for notifications
  const { toast } = useToast();
  
  // Local queue for pre-fetched sentences
  const [preloadedSentences, setPreloadedSentences] = useState<{[key: string]: any[]}>({
    beginner: [],
    intermediate: [],
    advanced: []
  });
  
  // Function to get a new sentence, with duplicate prevention and pre-fetching
  const fetchNewSentence = async (maxAttempts = 3): Promise<any> => {
    // Always get the most recent difficulty setting
    const difficulty = localStorage.getItem('difficulty') || 'beginner';
    const typedDifficulty = difficulty as 'beginner' | 'intermediate' | 'advanced';
    
    console.log(`Generating sentence with difficulty: ${difficulty}`);
    
    // Try to use a pre-fetched sentence first (much faster)
    if (preloadedSentences[typedDifficulty] && preloadedSentences[typedDifficulty].length > 0) {
      // Get and remove the first sentence from the queue
      const preloadedSentence = preloadedSentences[typedDifficulty][0];
      
      // Update the preloaded sentences array (remove the one we just used)
      setPreloadedSentences(prev => ({
        ...prev,
        [typedDifficulty]: prev[typedDifficulty].slice(1)
      }));
      
      // Start fetching a replacement sentence in the background
      setTimeout(() => {
        prefetchSentence(typedDifficulty);
      }, 100);
      
      // If the sentence is a duplicate, try again, otherwise return it
      if (preloadedSentence.chinese && recentSentences.includes(preloadedSentence.chinese)) {
        console.log(`Preloaded sentence was recently used, trying again...`);
      } else {
        return preloadedSentence;
      }
    }
    
    // No usable preloaded sentences, fetch directly
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await apiRequest('POST', '/api/sentence/generate', { difficulty });
      const data = await response.json();
      
      // Check if this sentence has been seen recently
      if (data.chinese && recentSentences.includes(data.chinese)) {
        console.log(`Sentence "${data.chinese}" was recently used, trying again... (attempt ${attempt + 1}/${maxAttempts})`);
      } else {
        // New sentence found, return it
        return data;
      }
    }
    
    // If we've tried max attempts and still got duplicates, just use the last generated sentence
    console.log("Max attempts reached, accepting any sentence");
    const response = await apiRequest('POST', '/api/sentence/generate', { difficulty });
    return response.json();
  };
  
  // Helper function to prefetch sentences in the background
  const prefetchSentence = async (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    try {
      const response = await apiRequest('POST', '/api/sentence/generate', { difficulty });
      const data = await response.json();
      
      // Add to the preloaded sentences queue (up to 3 per difficulty)
      setPreloadedSentences(prev => {
        // Only add if we don't already have 3 sentences for this difficulty
        if (prev[difficulty].length < 3) {
          return {
            ...prev,
            [difficulty]: [...prev[difficulty], data]
          };
        }
        return prev;
      });
    } catch (error) {
      console.error("Error prefetching sentence:", error);
    }
  };

  // Generate sentence mutation with loading state handling
  const generateSentenceMutation = useMutation<any, unknown, void>({
    mutationFn: () => {
      // Set a timeout to show a message if sentence generation takes too long
      const timeoutId = setTimeout(() => {
        toast({
          title: "Generating sentence...",
          description: "This might take a moment. Please wait...",
          duration: 5000,
        });
      }, 2000);

      // Return the fetch promise and clear the timeout when done
      return fetchNewSentence()
        .finally(() => clearTimeout(timeoutId));
    },
    onSuccess: (data) => {
      // Reset states for new sentence
      setUserTranslation("");
      setFeedbackStatus(null);
      setStartTime(Date.now());
      
      // Play the audio for the new sentence
      if (data?.chinese) {
        // Add to recent sentences
        setRecentSentences(prev => {
          const updated = [data.chinese, ...prev.slice(0, 4)]; // Keep last 5 sentences
          return updated;
        });
        
        speak(data.chinese);
      }
    },
    onError: () => {
      // Show an error toast when sentence generation fails
      toast({
        title: "Sentence generation failed",
        description: "Using a built-in sentence instead. You can continue practicing.",
        variant: "destructive",
        duration: 3000,
      });
    }
  });
  
  // Helper function to track incorrect answers for stats
  const trackIncorrectAnswer = () => {
    if (startTime === null) return;
    
    const timeTaken = (Date.now() - startTime) / 1000; // in seconds
    
    // Update stats for incorrect answers
    setStats(prev => {
      const completed = prev.completed + 1;
      // Calculate accuracy based on correct answers / total attempts
      const accuracy = `${Math.round((completed > 0 ? 100 * prev.correctAnswers / completed : 0))}%`;
      
      // Debug accuracy calculation
      console.log('Incorrect answer tracking:', {
        correctAnswers: prev.correctAnswers,
        completed,
        accuracyPercentage: Math.round((completed > 0 ? 100 * prev.correctAnswers / completed : 0))
      });
      
      // Update average time
      const prevAvgTime = parseFloat(prev.avgTime) || 0;
      const avgTime = `${Math.round((prevAvgTime * (completed - 1) + timeTaken) / completed * 10) / 10}s`;
      
      return {
        completed,
        accuracy,
        avgTime,
        masteryPercent: prev.masteryPercent,
        masteredWords: prev.masteredWords,
        totalWords: prev.totalWords,
        correctAnswers: prev.correctAnswers // Keep the same count, don't increment
      };
    });
  };
  
  // Check for difficulty changes from localStorage
  useEffect(() => {
    // Set up an interval to check if difficulty has changed in localStorage
    const checkDifficultyInterval = setInterval(() => {
      const storedDifficulty = localStorage.getItem('difficulty') || 'beginner';
      if (storedDifficulty !== currentDifficulty) {
        console.log(`Difficulty changed from ${currentDifficulty} to ${storedDifficulty}`);
        setCurrentDifficulty(storedDifficulty);
        // Generate a new sentence with the updated difficulty
        generateSentenceMutation.mutate();
      }
    }, 1000); // Check every second
    
    return () => clearInterval(checkDifficultyInterval);
  }, [currentDifficulty]);

  // More robust approach to check if vocabulary is empty and handle redirects
  useEffect(() => {
    // Never check or redirect while vocabulary is still loading
    if (isLoadingVocabulary) {
      return;
    }
    
    // Flag to track redirect checks
    let checkCount = 0;
    let maxChecks = 5;
    
    // Check local storage for initialization flag
    const hasInitialized = sessionStorage.getItem('practice_initialized');
    if (!hasInitialized) {
      // First time visiting the page in this session
      sessionStorage.setItem('practice_initialized', 'true');
      
      // Setup periodic checks with exponential backoff
      const checkInterval = setInterval(() => {
        checkCount++;
        console.log(`Checking redirect result (attempt ${checkCount})...`);
        
        // Only redirect if vocabulary is definitely not loading AND is empty
        if (!isLoadingVocabulary) {
          // Use the hasWords helper from useUserWordList to reliably check
          const hasAnyWords = hasWords();
          
          if (hasAnyWords) {
            // Words exist, mark as fully loaded and clear interval
            console.log(`Vocabulary loaded successfully: ${vocabularyWords?.length || 0} words available`);
            setFullyLoaded(true);
            clearInterval(checkInterval);
          } else if (checkCount >= maxChecks) {
            // Max attempts reached, must be empty - redirect and clean up
            console.log("Max redirect checks reached, giving up");
            if (!isVocabularyError) {
              // Only redirect if there's no error - could just be a temporary network issue
              navigate("/word-list");
            }
            clearInterval(checkInterval);
          }
        }
        
        // Stop checking after max attempts regardless
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
        }
      }, 1000); // Check every second
      
      return () => clearInterval(checkInterval);
    } else {
      // Not first visit, we can set fully loaded immediately if we have data
      if (hasWords()) {
        setFullyLoaded(true);
      }
    }
  }, [vocabularyWords, isLoadingVocabulary, isVocabularyError, navigate, hasWords]);

  // Generate first sentence when component mounts and update totalWords count
  // Also start prefetching sentences for each difficulty level
  useEffect(() => {
    // Always generate a sentence immediately when the component mounts
    // so users don't have to click "Next Sentence" for the first sentence
    generateSentenceMutation.mutate();
    
    // Start prefetching sentences for each difficulty level to ensure quick loading
    setTimeout(() => {
      prefetchSentence('beginner');
      setTimeout(() => prefetchSentence('intermediate'), 200);
      setTimeout(() => prefetchSentence('advanced'), 400);
    }, 2000);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this only runs once on mount
  
  // Handle vocabulary loading and update stats
  useEffect(() => {
    if (!isLoadingVocabulary && vocabularyWords && Array.isArray(vocabularyWords) && vocabularyWords.length > 0) {
      // Update the total words count when vocabulary is loaded
      setStats(prev => ({
        ...prev,
        totalWords: vocabularyWords.length,
        correctAnswers: prev.correctAnswers
      }));
    }
  }, [isLoadingVocabulary, vocabularyWords]);

  // Play audio for current sentence
  const playAudio = () => {
    if (generateSentenceMutation.data?.chinese) {
      // Get stored speech rate
      const storedSpeechRate = localStorage.getItem('speechRate');
      const speechRate = storedSpeechRate ? parseFloat(storedSpeechRate) : 1.0;
      
      speak(generateSentenceMutation.data.chinese, { rate: speechRate });
    }
  };

  // Update translation without checking answer immediately
  const updateTranslation = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserTranslation(e.target.value);
    // Don't check answer while typing
    setFeedbackStatus(null);
  };

  // Handle key press in the input field (for Enter key)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (feedbackStatus === null) {
        // If no feedback yet, check the answer first
        checkAnswer(userTranslation);
      } else {
        // If we already have feedback (correct, partial, or incorrect),
        // pressing Enter will move to the next sentence
        nextSentence();
        // Reset user translation for the new sentence
        setUserTranslation("");
        // Reset feedback status
        setFeedbackStatus(null);
      }
    }
  };
  
  // For direct button click to check answer or move to next (ensure sounds work with user interaction)
  const handleCheckAnswer = () => {
    if (feedbackStatus === null) {
      checkAnswer(userTranslation);
    } else {
      nextSentence();
      setUserTranslation("");
      setFeedbackStatus(null);
    }
  };

  // Update word proficiency in the backend
  const updateWordProficiency = useMutation<any, unknown, { wordId: number, isCorrect: boolean }>({
    mutationFn: async (params: { wordId: number, isCorrect: boolean }) => {
      const response = await apiRequest('POST', `/api/word-proficiency/${params.wordId}`, {
        isCorrect: params.isCorrect
      });
      return response.json();
    }
  });

  // Calculate score based on accuracy and speed
  const calculateScore = (similarity: number) => {
    if (startTime === null) return;
    
    const timeWeight = Number(localStorage.getItem('timeWeight') || 3);
    const timeTaken = (Date.now() - startTime) / 1000; // in seconds
    const timeScore = Math.max(1, 10 - Math.floor(timeTaken / 3) * (timeWeight / 3));
    const accuracyScore = Math.round(similarity * 90);
    
    const newPoints = accuracyScore + timeScore;
    setScore(prev => prev + newPoints);
    
    // Update stats
    setStats(prev => {
      // Always increment completed when calculating score
      const completed = prev.completed + 1;
      
      // Track mastered words (very good answers)
      const newMasteredWords = prev.masteredWords + (similarity > 0.9 ? 1 : 0);
      
      // Track correct answers separately from mastered
      // Only increment for answers that meet our correctness threshold (>=0.7 similarity)
      const correctAnswers = prev.correctAnswers + 1; // We know it's correct because we're only calling calculateScore on correct answers
      
      // Calculate accuracy based on correct answers / total attempts
      const accuracy = `${Math.round((completed > 0 ? 100 * correctAnswers / completed : 0))}%`;
      
      // Debug accuracy calculation
      console.log('Accuracy calculation:', {
        correctAnswers,
        completed,
        accuracyPercentage: Math.round((completed > 0 ? 100 * correctAnswers / completed : 0)) 
      });
      
      // Handle first completion
      const prevAvgTime = parseFloat(prev.avgTime) || 0;
      const avgTime = `${Math.round((prevAvgTime * (completed - 1) + timeTaken) / completed * 10) / 10}s`;
      
      // Calculate mastery percentage based on total words
      const totalWords = prev.totalWords || 1;
      const masteryPercent = Math.min(100, Math.round((newMasteredWords / totalWords) * 100));
      
      return {
        completed,
        accuracy,
        avgTime,
        masteryPercent,
        masteredWords: newMasteredWords,
        totalWords: prev.totalWords,
        correctAnswers
      };
    });
  };

  // Check answer similarity with correct translation
  const checkAnswer = (input: string) => {
    if (!generateSentenceMutation.data || !input.trim()) {
      setFeedbackStatus(null);
      return;
    }

    const correctAnswer = generateSentenceMutation.data.english;
    // Always use lenient matching by default to maximize flexibility
    const matchStrictness = localStorage.getItem('matchStrictness') || 'lenient';
    // Use the improved semantic similarity check with the configured strictness level
    const similarity = checkSimilarity(input, correctAnswer, matchStrictness as 'lenient' | 'moderate' | 'strict');

    // Console log for debugging
    console.log('Answer comparison:', { 
      user: input,
      correct: correctAnswer,
      similarity,
      matchStrictness
    });
    
    // Additional checks for critical words that can't be mixed up
    const userLower = input.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();
    
    // Extra debug info for imperative phrases
    if (correctAnswer.toLowerCase().includes("come in") || 
        correctAnswer.toLowerCase().includes("please")) {
      console.log('Imperative check - extra details:', {
        userStartsWithI: userLower.startsWith("i "),
        userIncludes: userLower.includes("please"),
        correctStartsWithPlease: correctLower.startsWith("please"),
        hasComeInConflict: userLower.includes("i come") && 
                          (correctLower.includes("come in") || 
                           correctLower.includes("please come"))
      });
    }
    
    // Special checks for temporal words that shouldn't be confused
    const temporalWordsConflict = (
      // Day conflicts
      (userLower.includes("today") && correctLower.includes("tomorrow")) ||
      (userLower.includes("tomorrow") && correctLower.includes("today")) ||
      (userLower.includes("yesterday") && correctLower.includes("today")) ||
      (userLower.includes("today") && correctLower.includes("yesterday")) ||
      
      // Specific vs general time conflicts
      (userLower.includes("this morning") && correctLower.includes("in the morning") && !correctLower.includes("this morning")) ||
      (userLower.includes("this afternoon") && correctLower.includes("in the afternoon") && !correctLower.includes("this afternoon")) ||
      (userLower.includes("this evening") && correctLower.includes("in the evening") && !correctLower.includes("this evening")) ||
      (userLower.includes("this night") && correctLower.includes("at night") && !correctLower.includes("this night")) ||
      
      // Tense conflicts with specific time indications
      (userLower.includes("this morning") && userLower.includes("showered") && correctLower.includes("shower") && !correctLower.includes("showered"))
    );
    
    // Check for food and beverage conflicts
    const beverageConflict = (
      (userLower.includes("tea") && correctLower.includes("coffee")) ||
      (userLower.includes("coffee") && correctLower.includes("tea")) ||
      (userLower.includes("water") && (correctLower.includes("tea") || correctLower.includes("coffee"))) ||
      ((userLower.includes("tea") || userLower.includes("coffee")) && correctLower.includes("water"))
    );
    
    // Check for food conflicts
    const foodConflict = (
      (userLower.includes("rice") && correctLower.includes("noodles")) ||
      (userLower.includes("noodles") && correctLower.includes("rice")) ||
      (userLower.includes("dumpling") && !correctLower.includes("dumpling")) ||
      (!userLower.includes("dumpling") && correctLower.includes("dumpling"))
    );
    
    // Check for verb tense conflicts
    const verbTenseConflict = (
      // Common past vs present tense confusions
      (userLower.includes(" took ") && correctLower.includes(" take ") && !correctLower.includes(" took ")) ||
      (userLower.includes(" went ") && correctLower.includes(" go ") && !correctLower.includes(" went ")) ||
      (userLower.includes(" ate ") && correctLower.includes(" eat ") && !correctLower.includes(" ate ")) ||
      (userLower.includes(" drank ") && correctLower.includes(" drink ") && !correctLower.includes(" drank ")) ||
      (userLower.includes(" bought ") && correctLower.includes(" buy ") && !correctLower.includes(" bought ")) ||
      (userLower.includes(" saw ") && correctLower.includes(" see ") && !correctLower.includes(" saw ")) ||
      
      // Present tense vs past tense - common verbs with -ed ending
      (userLower.includes("showered") && correctLower.includes("shower") && !correctLower.includes("showered")) ||
      (userLower.includes("played") && correctLower.includes("play") && !correctLower.includes("played")) ||
      (userLower.includes("watched") && correctLower.includes("watch") && !correctLower.includes("watched")) ||
      (userLower.includes("liked") && correctLower.includes("like") && !correctLower.includes("liked")) ||
      (userLower.includes("wanted") && correctLower.includes("want") && !correctLower.includes("wanted")) ||
      (userLower.includes("needed") && correctLower.includes("need") && !correctLower.includes("needed")) ||
      
      // Present tense vs past tense - reverse direction
      (correctLower.includes("showered") && userLower.includes("shower") && !userLower.includes("showered")) ||
      (correctLower.includes("played") && userLower.includes("play") && !userLower.includes("played")) ||
      (correctLower.includes("watched") && userLower.includes("watch") && !userLower.includes("watched")) ||
      (correctLower.includes("liked") && userLower.includes("like") && !userLower.includes("liked")) ||
      (correctLower.includes("wanted") && userLower.includes("want") && !userLower.includes("wanted")) ||
      (correctLower.includes("needed") && userLower.includes("need") && !userLower.includes("needed"))
    );
    
    // Check for imperative phrases and command conflicts
    const imperativeConflict = (
      // "Please come in" vs. "I come" conflict
      (correctLower.includes("please come in") && userLower.includes("i come")) ||
      (correctLower.includes("come in") && userLower.includes("i come")) ||
      
      // Direction conflicts (come vs go)
      (userLower.includes("come") && correctLower.includes("go") && !correctLower.includes("come")) ||
      (userLower.includes("go") && correctLower.includes("come") && !correctLower.includes("go")) ||
      
      // Imperative vs declarative sentence structure conflicts
      (correctLower.startsWith("please") && !userLower.includes("please") && similarity < 0.85) ||
      
      // "I" vs "you" perspective conflicts
      (userLower.startsWith("i ") && correctLower.startsWith("you ")) ||
      (userLower.startsWith("you ") && correctLower.startsWith("i "))
    );
    
    // Check for location references that differ significantly
    const locationConflict = 
      // Check for different country/city references
      (userLower.includes("england") && correctLower.includes("uk") && !correctLower.includes("england")) ||
      (userLower.includes("uk") && correctLower.includes("england") && !correctLower.includes("uk")) ||
      (userLower.includes("britain") && correctLower.includes("england") && !correctLower.includes("britain")) ||
      (userLower.includes("england") && correctLower.includes("britain") && !correctLower.includes("england")) ||
      (userLower.includes("china") && correctLower.includes("beijing") && !correctLower.includes("china")) ||
      (userLower.includes("beijing") && correctLower.includes("china") && !correctLower.includes("beijing"));
    
    // Check for "each other" vs simple verb missing reciprocal meaning
    const reciprocalConflict = 
      (correctLower.includes("each other") && !userLower.includes("each other")) ||
      (userLower.includes("each other") && !correctLower.includes("each other"));
    
    // Check for future tense markers like "will" that are critical to meaning
    const futureMarkerConflict = 
      (correctLower.includes(" will ") && !userLower.includes(" will ") && !userLower.includes("'ll ")) ||
      (userLower.includes(" will ") && !correctLower.includes(" will ") && !correctLower.includes("'ll "));
      
    // Debug log for conflict detection - just log the original conflicts for now
    console.log('Conflict detection:', {
      temporalWordsConflict,
      beverageConflict,
      foodConflict,
      verbTenseConflict,
      imperativeConflict
    });
    
    // Log new conflict types separately
    console.log('Additional conflict checks:', {
      locationConflict,
      reciprocalConflict,
      futureMarkerConflict
    });

    // Threshold adjustments with enhanced special case handling:
    // Increase required similarity to 0.8 for "correct" answers
    if (similarity >= 0.8 && 
        !temporalWordsConflict && 
        !imperativeConflict && 
        !beverageConflict && 
        !foodConflict && 
        !verbTenseConflict && 
        !locationConflict && 
        !reciprocalConflict && 
        !futureMarkerConflict) {
      setFeedbackStatus("correct");
      calculateScore(similarity);
      
      // Play correct answer sound
      playCorrectSound();
      
      // Trigger confetti animation for correct answer
      setShowConfetti(true);
      
      // Reset confetti after a short delay to prevent it from showing continuously
      setTimeout(() => {
        setShowConfetti(false);
      }, 600);
      
      // If we have vocabulary data and this is a correct answer,
      // update proficiency for each word in the sentence
      if (vocabularyWords && Array.isArray(vocabularyWords)) {
        // Extract all Chinese characters from the sentence
        const sentence = generateSentenceMutation.data.chinese;
        
        // For each word in our vocabulary, check if it's in the sentence
        vocabularyWords.forEach(word => {
          if (sentence.includes(word.chinese)) {
            // Update proficiency for this word (it was correct)
            updateWordProficiency.mutate({ 
              wordId: word.id, 
              isCorrect: true 
            });
          }
        });
      }
    // Make the partial correct threshold between 0.4 and 0.8 (was 0.25 to 0.7)
    } else if (similarity >= 0.4) {
      setFeedbackStatus("partial");
      // Play incorrect sound for partial matches too
      playIncorrectSound();
      // Track this as incorrect for stats
      trackIncorrectAnswer();
    } else {
      setFeedbackStatus("incorrect");
      // Play incorrect answer sound
      playIncorrectSound();
      // Track this as incorrect for stats
      trackIncorrectAnswer();
      
      // If answer is incorrect, update proficiency for words in the sentence
      if (vocabularyWords && Array.isArray(vocabularyWords)) {
        const sentence = generateSentenceMutation.data.chinese;
        
        vocabularyWords.forEach(word => {
          if (sentence.includes(word.chinese)) {
            // Update proficiency for this word (it was incorrect)
            updateWordProficiency.mutate({ 
              wordId: word.id, 
              isCorrect: false 
            });
          }
        });
      }
    }
  };

  // Move to next sentence
  const nextSentence = () => {
    generateSentenceMutation.mutate();
  };

  // Use a more nuanced approach to showing loading states
  const justLoaded = !sessionStorage.getItem('practice_initialized');
  
  // Loading state: Show when definitely loading
  if (isLoadingVocabulary || (!fullyLoaded && justLoaded)) {
    // Show a more detailed loading message to set expectations
    return (
      <div className="text-center py-10">
        <div className="animate-pulse">
          <div className="h-10 w-10 mx-auto mb-4 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-6 w-48 mx-auto mb-2 rounded bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-4 w-64 mx-auto rounded bg-gray-200 dark:bg-gray-800"></div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading vocabulary and preparing your practice session...
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          This might take a moment on first load.
        </p>
      </div>
    );
  }

  // No vocabulary state: Only show if we've completely finished loading AND verified there are no words
  // We use both vocabulary list checks and the explicit hasWords() helper to verify
  if (fullyLoaded && !hasWords()) {
    return (
      <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
        <div className="text-5xl mb-4 text-gray-400 dark:text-gray-500">
          <i className="fas fa-book-open"></i>
        </div>
        <h3 className="text-xl font-semibold mb-2">No Vocabulary Words Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You need to add some Mandarin vocabulary words before you can practice.
        </p>
        <Button asChild>
          <Link href="/word-list">Add Words Now</Link>
        </Button>
      </div>
    );
  }
  
  // Error state: Show when there's a specific error loading vocabulary
  if (isVocabularyError) {
    return (
      <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
        <div className="text-5xl mb-4 text-red-500">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3 className="text-xl font-semibold mb-2">Error Loading Words</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          There was a problem loading your vocabulary. Please try again or check your connection.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    );
  }

  return (
    <div className="practice-section">
      {/* Confetti animation when answer is correct */}
      <SuccessConfetti active={showConfetti} duration={600} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SentenceCard
          sentence={generateSentenceMutation.data}
          showChinese={showChinese}
          showPinyin={showPinyin}
          userTranslation={userTranslation}
          feedbackStatus={feedbackStatus}
          onUpdateTranslation={updateTranslation}
          onPlayAudio={playAudio}
          onNextSentence={nextSentence}
          onKeyPress={handleKeyPress}
          onCheckAnswer={handleCheckAnswer}
          onChangeDifficulty={handleChangeDifficulty}
          isLoading={generateSentenceMutation.isPending}
          isPlaying={isPlaying}
          vocabularyWords={vocabularyWords}
        />
        
        <ScoreCard
          score={score}
          stats={stats}
          showChinese={showChinese}
          showPinyin={showPinyin}
          onToggleShowChinese={() => setShowChinese(prev => !prev)}
          onToggleShowPinyin={() => setShowPinyin(prev => !prev)}
        />
      </div>
    </div>
  );
}