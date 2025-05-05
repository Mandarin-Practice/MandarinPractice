import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, SkipForward } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    <div className="space-y-4">
      <div className="p-3 rounded-md bg-accent/20 border border-border">
        <p className="text-base leading-relaxed">
          {comparison.correctWordElements.map((element, index) => (
            <span 
              key={`correct-${index}`}
              className={element.matched 
                ? "text-green-600 dark:text-green-400 font-medium" 
                : "text-primary font-medium"
              }
            >
              {element.word}{index < comparison.correctWordElements.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2 text-foreground">Your translation:</p>
        <div className="p-3 rounded-md bg-background border border-border">
          <p className="text-base leading-relaxed">
            {comparison.userWordElements.map((element, index) => (
              <span 
                key={`user-${index}`}
                className={element.matched 
                  ? "text-green-600 dark:text-green-400 font-medium" 
                  : "text-primary font-medium"
                }
              >
                {element.word}{index < comparison.userWordElements.length - 1 ? ' ' : ''}
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
        <CardHeader className="bg-accent/20 border-b border-border flex-row justify-between items-center py-4">
          <h2 className="font-bold text-primary text-lg">Current Sentence</h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="chinese"
              size="icon"
              className="h-10 w-10 rounded-md"
              onClick={onPlayAudio}
              disabled={isLoading || !sentence}
            >
              <Play className={isPlaying ? "animate-pulse" : ""} />
            </Button>
            <div className="text-sm bg-background px-2 py-1 rounded-md border border-border">
              <span className="font-medium">{sentence?.difficulty || "Loading..."}</span> 
              <span className="text-foreground/70"> Difficulty</span>
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
                <div className="mb-8 mt-2">
                  <div className="border border-border rounded-md p-4 bg-background">
                    {/* After checking an answer, show the interactive component with hover info */}
                    {feedbackStatus ? (
                      <div className="relative">
                        <div className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
                          Chinese Text - Interactive
                        </div>
                        <InteractiveChineseText 
                          chinese={sentence.chinese}
                          vocabularyWords={vocabularyWords}
                          feedbackStatus={feedbackStatus}
                        />
                        <div className="mt-2 text-xs text-foreground/70 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-primary">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                          Hover over any character to see details and manage words
                        </div>
                      </div>
                    ) : (
                      // Normal display when no feedback yet
                      <div>
                        <div className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
                          Chinese Text
                        </div>
                        <p className="text-3xl chinese-text leading-relaxed">
                          {sentence.chinese}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Pinyin */}
              {showPinyin && sentence?.pinyin && (
                <div className="mb-6 -mt-4">
                  <div className="border-x border-b border-border rounded-b-md p-3 bg-accent/10">
                    <div className="text-xs text-primary font-medium uppercase tracking-wider mb-1">
                      Pinyin Pronunciation
                    </div>
                    <p className="text-lg text-foreground/80 italic">
                      {sentence.pinyin}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Answer Section */}
              <div>
                <label htmlFor="translation" className="block text-sm font-medium text-primary mb-2">
                  Type the English translation:
                </label>
                <div className="relative">
                  <Input
                    id="translation"
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
                  />
                  <div className="absolute right-3 top-3 text-primary/60">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                {/* Feedback display */}
                <div className="mt-3 min-h-[24px]">
                  {renderFeedback()}
                </div>

                {/* When feedback exists, show the correct answer with visual highlighting */}
                {feedbackStatus && sentence?.english && (
                  <div className="mt-4 p-4 border border-border rounded-md bg-accent/10">
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
        </CardContent>
        
        <CardFooter className="py-4 bg-accent/20 border-t border-border justify-between">
          {feedbackStatus && (
            <p className="text-sm bg-background px-3 py-1.5 rounded-md border border-border">
              {sentence && sentence.chinese.length > 0 ? (
                <span className="font-medium text-primary">{sentence.chinese.length}</span>
              ) : ''}
              <span className="mx-1 text-foreground">characters</span>
              <span className="mx-1">•</span>
              <span className="text-foreground/70">Hover over words to manage vocabulary</span>
            </p>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  onClick={onNextSentence}
                  disabled={isLoading}
                  className="border-primary font-medium"
                >
                  Next Sentence <SkipForward className="ml-1 h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Continue to next sentence after managing words</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardFooter>
      </Card>
    </div>
  );
}
