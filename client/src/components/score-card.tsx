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
          <div className="text-4xl font-bold text-primary mb-2">{score}</div>
          <p className="text-foreground/70">Current Score</p>
        </div>
        
        {/* Stats */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-foreground/80">Sentences Completed</span>
            <span className="font-semibold text-primary">{stats.completed}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-foreground/80">Accuracy Rate</span>
            <span className="font-semibold text-primary">{stats.accuracy}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-foreground/80">Avg. Response Time</span>
            <span className="font-semibold text-primary">{stats.avgTime}</span>
          </div>
        </div>
        
        {/* Mastery Level */}
        <div className="mt-8">
          <p className="text-sm text-foreground/70 mb-2 font-medium">Vocabulary Mastery</p>
          <Progress value={stats.masteryPercent} className="h-2.5" />
          <p className="text-xs text-right mt-1 text-foreground/60">
            <span className="font-medium text-primary">{stats.masteredWords}</span>/{stats.totalWords} words
          </p>
        </div>
      </CardContent>
      
      {/* Display Controls */}
      <div className="px-6 py-4 bg-accent/30 border-t border-border">
        <p className="text-sm text-foreground/80 font-medium mb-3">Display Options</p>
        
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
