import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, SkipForward } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { compareWordByWord } from "@/lib/string-similarity";
import InteractiveChineseText from "./interactive-chinese-text";

interface HighlightedComparisonProps {
  correctSentence: string;
  userSentence: string;
}

function HighlightedComparison({ correctSentence, userSentence }: HighlightedComparisonProps) {
  // Use compareWordByWord to determine which words match
  const comparison = compareWordByWord(correctSentence, userSentence);

  return (
    <div className="space-y-3">
      <div className="p-2 rounded">
        <p className="text-base leading-relaxed">
          {comparison.correctWordElements.map((element, index) => (
            <span 
              key={`correct-${index}`}
              className={element.matched ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}
            >
              {element.word}{index < comparison.correctWordElements.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>

      <p className="text-sm font-medium mt-3 mb-1">Your translation:</p>
      <div className="p-2 rounded">
        <p className="text-base leading-relaxed">
          {comparison.userWordElements.map((element, index) => (
            <span 
              key={`user-${index}`}
              className={element.matched ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}
            >
              {element.word}{index < comparison.userWordElements.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

interface SentenceCardProps {
  sentence?: {
    id: string;
    chinese: string;
    pinyin: string;
    english: string;
    difficulty: string;
  } | null;
  showChinese: boolean;
  showPinyin: boolean;
  userTranslation: string;
  feedbackStatus: "correct" | "partial" | "incorrect" | null;
  isLoading: boolean;
  isPlaying: boolean;
  vocabularyWords?: Array<{
    id: number;
    chinese: string;
    pinyin: string;
    english: string;
    active: string;
  }>;
  onUpdateTranslation: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlayAudio: () => void;
  onNextSentence: () => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function SentenceCard({
  sentence,
  showChinese,
  showPinyin,
  userTranslation,
  feedbackStatus,
  isLoading,
  isPlaying,
  vocabularyWords = [],
  onUpdateTranslation,
  onPlayAudio,
  onNextSentence,
  onKeyPress
}: SentenceCardProps) {
  
  const renderFeedback = () => {
    if (!feedbackStatus) return null;
    
    const feedbackStyles = {
      correct: "text-green-600 dark:text-green-400",
      partial: "text-amber-600 dark:text-amber-400",
      incorrect: "text-red-600 dark:text-red-400"
    };
    
    const feedbackIcons = {
      correct: (
        <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      partial: (
        <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      incorrect: (
        <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    
    const feedbackMessages = {
      correct: "Correct! Great job. Press Enter for next sentence.",
      partial: "Close! Try again or press Enter for next sentence.",
      incorrect: "Not quite right. Try again or press Enter to move on."
    };
    
    return (
      <div className={`${feedbackStyles[feedbackStatus]} font-medium flex items-center`}>
        {feedbackIcons[feedbackStatus]} {feedbackMessages[feedbackStatus]}
      </div>
    );
  };

  return (
    <div className="md:col-span-2">
      <Card className="h-full flex flex-col">
        <CardHeader className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex-row justify-between items-center py-4">
          <h2 className="font-semibold">Current Sentence</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-primary text-white hover:bg-blue-600 transition"
              onClick={onPlayAudio}
              disabled={isLoading || !sentence}
            >
              <Play className={isPlaying ? "animate-pulse" : ""} />
            </Button>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <span>{sentence?.difficulty || "Loading..."}</span> Difficulty
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-grow">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-10 w-full mt-6" />
            </div>
          ) : (
            <>
              {/* Chinese Text with Interactive Hover */}
              {showChinese && sentence?.chinese && (
                <div className="mb-6">
                  {/* After checking an answer, show the interactive component with hover info */}
                  {feedbackStatus ? (
                    <div className="relative">
                      <InteractiveChineseText 
                        chinese={sentence.chinese}
                        vocabularyWords={vocabularyWords}
                        feedbackStatus={feedbackStatus}
                      />
                      {feedbackStatus && (
                        <div className="mt-1 text-xs text-gray-500">
                          Hover over any character to see details and manage words
                        </div>
                      )}
                    </div>
                  ) : (
                    // Normal display when no feedback yet
                    <p className="text-2xl font-['Noto_Sans_SC',sans-serif] leading-relaxed">
                      {sentence.chinese}
                    </p>
                  )}
                </div>
              )}
              
              {/* Pinyin */}
              {showPinyin && sentence?.pinyin && (
                <div className="mb-6">
                  <p className="text-lg text-gray-600 dark:text-gray-400 italic">
                    {sentence.pinyin}
                  </p>
                </div>
              )}
              
              {/* Answer Section */}
              <div>
                <label htmlFor="translation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type the English translation:
                </label>
                <div className="relative">
                  <Input
                    id="translation"
                    type="text"
                    value={userTranslation}
                    onChange={onUpdateTranslation}
                    onKeyDown={onKeyPress}
                    placeholder="Type your answer here... (Press Enter to check or to go to next)"
                    className="w-full px-4 py-6 text-base"
                    disabled={isLoading || !sentence}
                    autoComplete="off" // Disable browser autocomplete suggestions
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other" // Additional attribute to help prevent autocomplete
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                {/* Feedback display */}
                <div className="mt-2 min-h-[24px]">
                  {renderFeedback()}
                </div>

                {/* When feedback exists, show the correct answer with visual highlighting */}
                {feedbackStatus && sentence?.english && (
                  <div className="mt-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm font-medium mb-1">Correct translation:</p>
                    <HighlightedComparison 
                      correctSentence={sentence.english} 
                      userSentence={userTranslation} 
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 justify-between">
          {feedbackStatus && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {sentence && sentence.chinese.length > 0 ? `${sentence.chinese.length} characters` : ''}
              <span className="mx-1">•</span>
              Hover over words to manage vocabulary
            </p>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-secondary hover:bg-violet-600 transition"
                onClick={onNextSentence}
                disabled={isLoading}
              >
                Next Sentence <SkipForward className="ml-1 h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Continue to next sentence after managing words</p>
            </TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>
    </div>
  );
}
