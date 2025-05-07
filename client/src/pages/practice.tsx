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
  
  const [stats, setStats] = useState<Stats>({
    completed: 0,
    accuracy: "0%",
    avgTime: "0s",
    masteryPercent: 0,
    masteredWords: 0,
    totalWords: 0
  });
  
  const { speak, isPlaying } = useTextToSpeech();
  const { playCorrectSound, playIncorrectSound } = useSoundEffects();

  // Fetch vocabulary words
  const { data: vocabularyWords, isLoading: isLoadingVocabulary } = useQuery({
    queryKey: ['/api/vocabulary'],
    refetchOnWindowFocus: false,
  });

  // Get toast hook for notifications
  const { toast } = useToast();
  
  // Function to get a new sentence, with duplicate prevention
  const fetchNewSentence = async (maxAttempts = 3): Promise<any> => {
    // Always get the most recent difficulty setting
    const difficulty = localStorage.getItem('difficulty') || 'beginner';
    
    console.log(`Generating sentence with difficulty: ${difficulty}`);
    
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

  // Check if vocabulary is empty and redirect if needed
  useEffect(() => {
    if (!isLoadingVocabulary && (!vocabularyWords || !Array.isArray(vocabularyWords) || vocabularyWords.length === 0)) {
      navigate("/word-list");
    }
  }, [vocabularyWords, isLoadingVocabulary, navigate]);

  // Generate first sentence when component mounts and update totalWords count
  useEffect(() => {
    if (!isLoadingVocabulary && vocabularyWords && Array.isArray(vocabularyWords) && vocabularyWords.length > 0) {
      generateSentenceMutation.mutate();
      
      // Update the total words count when vocabulary is loaded
      setStats(prev => ({
        ...prev,
        totalWords: vocabularyWords.length
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

    // Additional checks for critical temporal words that can't be mixed up
    const userLower = input.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase().trim();
    
    // Special checks for temporal words that shouldn't be confused
    const temporalWordsConflict = (
      (userLower.includes("today") && correctLower.includes("tomorrow")) ||
      (userLower.includes("tomorrow") && correctLower.includes("today")) ||
      (userLower.includes("yesterday") && correctLower.includes("today")) ||
      (userLower.includes("today") && correctLower.includes("yesterday"))
    );
    
    // Threshold adjustments with special case handling:
    if (similarity >= 0.7 && !temporalWordsConflict) {
      setFeedbackStatus("correct");
      calculateScore(similarity);
      
      // Play correct answer sound
      playCorrectSound();
      
      // Trigger confetti animation for correct answer
      setShowConfetti(true);
      
      // Reset confetti after a delay to prevent it from showing continuously
      setTimeout(() => {
        setShowConfetti(false);
      }, 1500);
      
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
    } else if (similarity >= 0.25) {
      setFeedbackStatus("partial");
      // Play incorrect sound for partial matches too
      playIncorrectSound();
    } else {
      setFeedbackStatus("incorrect");
      // Play incorrect answer sound
      playIncorrectSound();
      
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
      const completed = prev.completed + 1;
      const newMasteredWords = prev.masteredWords + (similarity > 0.9 ? 1 : 0);
      
      // Calculate accuracy based on correct answers / total attempts
      const accuracy = `${Math.round((completed > 0 ? 100 * newMasteredWords / completed : 0))}%`;
      
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
        totalWords: prev.totalWords
      };
    });
  };

  // Move to next sentence
  const nextSentence = () => {
    generateSentenceMutation.mutate();
  };

  if (isLoadingVocabulary) {
    return <div className="text-center py-10">Loading vocabulary...</div>;
  }

  if (!vocabularyWords || !Array.isArray(vocabularyWords) || vocabularyWords.length === 0) {
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

  return (
    <div className="practice-section">
      {/* Confetti animation when answer is correct */}
      <SuccessConfetti active={showConfetti} duration={1500} />
      
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