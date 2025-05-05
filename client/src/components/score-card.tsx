import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ToggleSwitch } from "@/components/ui/toggle";
import { Progress } from "@/components/ui/progress";

interface ScoreCardProps {
  score: number;
  stats: {
    completed: number;
    accuracy: string;
    avgTime: string;
    masteryPercent: number;
    masteredWords: number;
    totalWords: number;
  };
  showChinese: boolean;
  showPinyin: boolean;
  onToggleShowChinese: () => void;
  onToggleShowPinyin: () => void;
}

export default function ScoreCard({
  score,
  stats,
  showChinese,
  showPinyin,
  onToggleShowChinese,
  onToggleShowPinyin
}: ScoreCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-accent/30 border-b border-border py-4">
        <h2 className="font-bold text-primary text-lg">Your Progress</h2>
      </CardHeader>
      
      <CardContent className="p-6 flex-grow">
        {/* Current Score */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-primary dark:text-blue-400 mb-2">{score}</div>
          <p className="text-gray-600 dark:text-gray-400">Current Score</p>
        </div>
        
        {/* Stats */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Sentences Completed</span>
            <span className="font-semibold">{stats.completed}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Accuracy Rate</span>
            <span className="font-semibold">{stats.accuracy}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-gray-300">Avg. Response Time</span>
            <span className="font-semibold">{stats.avgTime}</span>
          </div>
        </div>
        
        {/* Mastery Level */}
        <div className="mt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Vocabulary Mastery</p>
          <Progress value={stats.masteryPercent} className="h-2.5" />
          <p className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
            {stats.masteredWords}/{stats.totalWords} words
          </p>
        </div>
      </CardContent>
      
      {/* Display Controls */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Display Options</p>
        
        <ToggleSwitch
          label="Show Chinese Characters"
          pressed={showChinese}
          onPressedChange={onToggleShowChinese}
          data-state={showChinese ? "on" : "off"}
        />
        
        <ToggleSwitch
          label="Show Pinyin"
          pressed={showPinyin}
          onPressedChange={onToggleShowPinyin}
          data-state={showPinyin ? "on" : "off"}
          className="mb-0"
        />
      </div>
    </Card>
  );
}
