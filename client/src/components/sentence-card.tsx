import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, SkipForward, ChevronDown, Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { compareWordByWord } from "@/lib/string-similarity";
import InteractiveChineseText from "./interactive-chinese-text";
import CharacterHoverView from "./character-hover-view";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface HighlightedComparisonProps {
  correctSentence: string;
  userSentence: string;
}

function HighlightedComparison({ correctSentence, userSentence }: HighlightedComparisonProps) {
  // Use compareWordByWord to determine which words match
  const comparison = compareWordByWord(correctSentence, userSentence);
  
  // Simplify the correct translation by handling alternative definitions
  // This removes comma-separated alternative definitions like "fine, good, nice, OK" 
  // and displays only the first option
  const simplifiedCorrectSentence = correctSentence
    .split(' ')
    .map(word => {
      // If word contains comma-separated alternatives like "fine, good, nice, OK"
      // Only keep the first option
      if (word.includes(',')) {
        return word.split(',')[0];
      }
      // Handle "or" alternatives like "must or have to"
      if (word.includes(' or ')) {
        return word.split(' or ')[0];
      }
      return word;
    })
    .join(' ');
  
  // Create new comparison with simplified sentence
  const simplifiedComparison = compareWordByWord(simplifiedCorrectSentence, userSentence);

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-md bg-accent/20 border border-border">
        <p className="text-base leading-relaxed">
          {simplifiedComparison.correctWordElements.map((element, index) => (
            <span 
              key={`correct-${index}`}
              className={element.matched 
                ? "text-green-600 dark:text-green-400 font-medium" 
                : "text-primary font-medium"
              }
            >
              {element.word}{index < simplifiedComparison.correctWordElements.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2 text-foreground">Your translation:</p>
        <div className="p-3 rounded-md bg-background border border-border">
          <p className="text-base leading-relaxed">
            {simplifiedComparison.userWordElements.map((element, index) => (
              <span 
                key={`user-${index}`}
                className={element.matched 
                  ? "text-green-600 dark:text-green-400 font-medium" 
                  : "text-primary font-medium"
                }
              >
                {element.word}{index < simplifiedComparison.userWordElements.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        </div>
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
  onCheckAnswer?: () => void;
  onChangeDifficulty?: (difficulty: string) => void;
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
  onKeyPress,
  onCheckAnswer,
  onChangeDifficulty
}: SentenceCardProps) {
  // Get user data for streak display
  const { user } = useAuth();
  
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
      <div className="card-custom h-full flex flex-col relative" style={{ overflow: 'visible' }}>
        <div className="flex justify-between items-center bg-primary text-white p-4 rounded-t-lg">
          <h2 className="font-bold text-white text-lg">Current Sentence</h2>
          <div className="flex items-center space-x-3">
            <button
              className="bg-white h-10 w-10 rounded-md flex items-center justify-center text-primary hover:bg-gray-100 disabled:opacity-50"
              onClick={onPlayAudio}
              disabled={isLoading || !sentence}
            >
              <Play className={isPlaying ? "animate-pulse" : ""} />
            </button>
            {onChangeDifficulty ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-sm bg-red-800 px-2 py-1 rounded-md border border-red-700 text-white h-auto hover:bg-red-700 hover:text-white">
                    <span className="font-medium mr-1">{sentence?.difficulty || "Loading..."}</span>
                    <span>Difficulty</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onChangeDifficulty("beginner")} 
                    className={sentence?.difficulty === "beginner" ? "bg-primary/20" : ""}>
                    Beginner
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onChangeDifficulty("intermediate")}
                    className={sentence?.difficulty === "intermediate" ? "bg-primary/20" : ""}>
                    Intermediate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onChangeDifficulty("advanced")}
                    className={sentence?.difficulty === "advanced" ? "bg-primary/20" : ""}>
                    Advanced
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="text-sm bg-red-800 px-2 py-1 rounded-md border border-red-700">
                <span className="font-medium">{sentence?.difficulty || "Loading..."}</span> 
                <span className="text-white"> Difficulty</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 flex-grow" style={{ overflow: 'visible' }}>
          {/* Streak display in top-right corner */}
          <div className="absolute top-6 right-6 flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-md">
            <Flame className="h-4 w-4 text-yellow-200" />
            <span className="font-bold">
              {user?.backendUser?.currentStreak || 0}
            </span>
          </div>
          
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
                <div className="mb-8 mt-2" style={{ overflow: 'visible' }}>
                  <div className="border border-red-200 dark:border-red-900 rounded-md p-4 bg-background" style={{ overflow: 'visible' }}>
                    <div className="relative" style={{ overflow: 'visible' }}>
                      <div className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
                        {feedbackStatus ? "Chinese Text - Interactive" : "Chinese Text"}
                      </div>
                      <div className="text-3xl font-['Noto_Sans_SC',sans-serif] leading-relaxed font-bold overflow-visible">
                        <CharacterHoverView 
                          chinese={sentence.chinese}
                          isInteractive={feedbackStatus !== null}
                          vocabularyWords={vocabularyWords}
                          feedbackStatus={feedbackStatus}
                        />
                      </div>
                      
                      {/* Only show hover instructions after feedback */}
                      {feedbackStatus && (
                        <div className="mt-2 text-xs text-gray-700 dark:text-white flex items-center font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-primary">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                          Hover over any character to see details and manage words
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Pinyin */}
              {showPinyin && sentence?.pinyin && (
                <div className="mb-6 -mt-4">
                  <div className="border-x border-b border-red-200 dark:border-red-900 rounded-b-md p-3 bg-accent/10">
                    <div className="text-xs text-primary font-medium uppercase tracking-wider mb-2">
                      Pinyin Pronunciation
                    </div>
                    <p className="text-xl text-foreground font-medium tracking-wide italic">
                      {sentence.pinyin}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Answer Section */}
              <div>
                <label htmlFor="translation-input" className="block text-sm font-medium text-primary mb-2">
                  Type the English translation:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Input
                      id="translation-input"
                      type="text"
                      value={userTranslation}
                      onChange={onUpdateTranslation}
                      onKeyDown={onKeyPress}
                      placeholder="Type your answer here... (Press Enter to check or go to next)"
                      className="w-full px-4 py-6 text-base border-border bg-background focus:border-primary"
                      disabled={isLoading || !sentence}
                      autoComplete="off" // Disable browser autocomplete suggestions
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other" // Additional attribute to help prevent autocomplete
                      data-confetti-source="true" // Mark this element as the confetti source
                    />
                    <div className="absolute right-3 top-3 text-primary/60">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <button 
                    onClick={onCheckAnswer}
                    disabled={isLoading || !sentence}
                    className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-md font-medium"
                  >
                    {feedbackStatus === null ? 'Check' : 'Next'}
                  </button>
                </div>
                
                {/* Feedback display */}
                <div className="mt-3 min-h-[24px]">
                  {renderFeedback()}
                </div>

                {/* When feedback exists, show the correct answer with visual highlighting */}
                {feedbackStatus && sentence?.english && (
                  <div className="mt-4 p-4 border border-red-200 dark:border-red-900 rounded-md bg-accent/10">
                    <p className="text-sm font-medium mb-2 text-primary">
                      Correct translation:
                    </p>
                    <HighlightedComparison 
                      correctSentence={sentence.english} 
                      userSentence={userTranslation} 
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="py-4 px-6 bg-primary/10 border-t border-red-200 dark:border-red-800 flex justify-between items-center">
          {sentence && (
            <p className="text-sm bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900">
              {sentence.chinese.length > 0 ? (
                <span className="font-medium text-primary">{sentence.chinese.length}</span>
              ) : ''}
              <span className="mx-1 text-foreground">characters</span>
              <span className="mx-1">•</span>
              {feedbackStatus && (
                <span className="text-gray-700 dark:text-gray-200 font-medium">
                  Hover over characters to see details and manage vocabulary
                </span>
              )}
            </p>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onNextSentence}
                  disabled={isLoading}
                  className="btn-red"
                >
                  Next Sentence <SkipForward className="ml-1 h-4 w-4 inline" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-gray-800 dark:text-white font-medium">Continue to next sentence after managing words</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}