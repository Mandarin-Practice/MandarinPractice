import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, SkipForward } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
  onUpdateTranslation: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlayAudio: () => void;
  onNextSentence: () => void;
}

export default function SentenceCard({
  sentence,
  showChinese,
  showPinyin,
  userTranslation,
  feedbackStatus,
  isLoading,
  isPlaying,
  onUpdateTranslation,
  onPlayAudio,
  onNextSentence
}: SentenceCardProps) {
  
  const renderFeedback = () => {
    if (!feedbackStatus) return null;
    
    const feedbackStyles = {
      correct: "text-success",
      partial: "text-warning",
      incorrect: "text-error"
    };
    
    const feedbackIcons = {
      correct: "fa-check-circle",
      partial: "fa-exclamation-circle",
      incorrect: "fa-times-circle"
    };
    
    const feedbackMessages = {
      correct: "Correct! Great job.",
      partial: "Close! Keep trying.",
      incorrect: "Not quite right. Try again."
    };
    
    return (
      <div className={feedbackStyles[feedbackStatus]}>
        <i className={`fas ${feedbackIcons[feedbackStatus]} mr-1`}></i> {feedbackMessages[feedbackStatus]}
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
              {/* Chinese Text */}
              {showChinese && sentence?.chinese && (
                <div className="mb-6">
                  <p className="text-2xl font-['Noto_Sans_SC',sans-serif] leading-relaxed">
                    {sentence.chinese}
                  </p>
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
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-6 text-base"
                    disabled={isLoading || !sentence}
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    <i className="fas fa-keyboard"></i>
                  </div>
                </div>
                
                {/* Feedback display */}
                <div className="mt-2 min-h-[24px]">
                  {renderFeedback()}
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 justify-end">
          <Button
            className="bg-secondary hover:bg-violet-600 transition"
            onClick={onNextSentence}
            disabled={isLoading}
          >
            Next Sentence <SkipForward className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
