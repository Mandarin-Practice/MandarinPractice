import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SentenceCard from "@/components/sentence-card";
import ScoreCard from "@/components/score-card";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
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
  const [stats, setStats] = useState<Stats>({
    completed: 0,
    accuracy: "0%",
    avgTime: "0s",
    masteryPercent: 0,
    masteredWords: 0,
    totalWords: 0
  });
  
  const { speak, isPlaying } = useTextToSpeech();

  // Fetch vocabulary words
  const { data: vocabularyWords, isLoading: isLoadingVocabulary } = useQuery({
    queryKey: ['/api/vocabulary'],
    refetchOnWindowFocus: false,
  });

  // Generate sentence mutation
  const generateSentenceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sentence/generate', {
        difficulty: localStorage.getItem('difficulty') || 'beginner'
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Reset states for new sentence
      setUserTranslation("");
      setFeedbackStatus(null);
      setStartTime(Date.now());
      
      // Play the audio for the new sentence
      if (data?.chinese) {
        speak(data.chinese);
      }
    }
  });

  // Check if vocabulary is empty and redirect if needed
  useEffect(() => {
    if (!isLoadingVocabulary && (!vocabularyWords || vocabularyWords.length === 0)) {
      navigate("/word-list");
    }
  }, [vocabularyWords, isLoadingVocabulary, navigate]);

  // Generate first sentence when component mounts
  useEffect(() => {
    if (!isLoadingVocabulary && vocabularyWords && vocabularyWords.length > 0) {
      generateSentenceMutation.mutate();
    }
  }, [isLoadingVocabulary, vocabularyWords]);

  // Play audio for current sentence
  const playAudio = () => {
    if (generateSentenceMutation.data?.chinese) {
      speak(generateSentenceMutation.data.chinese);
    }
  };

  // Update translation and check answer
  const updateTranslation = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserTranslation(e.target.value);
    checkAnswer(e.target.value);
  };

  // Check answer similarity with correct translation
  const checkAnswer = (input: string) => {
    if (!generateSentenceMutation.data || !input.trim()) {
      setFeedbackStatus(null);
      return;
    }

    const correctAnswer = generateSentenceMutation.data.english;
    const similarity = checkSimilarity(input, correctAnswer);

    if (similarity >= 0.8) {
      setFeedbackStatus("correct");
      calculateScore(similarity);
    } else if (similarity >= 0.4) {
      setFeedbackStatus("partial");
    } else {
      setFeedbackStatus("incorrect");
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
      const accuracy = `${Math.round((prev.masteredWords + (similarity > 0.9 ? 1 : 0)) / prev.totalWords * 100)}%`;
      const avgTime = `${Math.round((parseFloat(prev.avgTime) * (completed - 1) + timeTaken) / completed * 10) / 10}s`;
      const newMasteredWords = prev.masteredWords + (similarity > 0.9 ? 1 : 0);
      
      return {
        completed,
        accuracy,
        avgTime,
        masteryPercent: (newMasteredWords / prev.totalWords) * 100,
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

  if (!vocabularyWords || vocabularyWords.length === 0) {
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
          isLoading={generateSentenceMutation.isPending}
          isPlaying={isPlaying}
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
