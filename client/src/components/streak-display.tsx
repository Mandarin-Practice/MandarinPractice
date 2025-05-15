import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Star, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface StreakDisplayProps {
  className?: string;
}

export function StreakDisplay({ className = "" }: StreakDisplayProps) {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Get current streak level based on number
  const getStreakLevel = (streak: number) => {
    if (streak >= 50) return "Legendary";
    if (streak >= 30) return "Master";
    if (streak >= 20) return "Expert";
    if (streak >= 10) return "Advanced";
    if (streak >= 5) return "Intermediate";
    if (streak >= 1) return "Beginner";
    return "Novice";
  };
  
  // Get next milestone based on current streak
  const getNextMilestone = (streak: number) => {
    if (streak >= 50) return 100;
    if (streak >= 30) return 50;
    if (streak >= 20) return 30;
    if (streak >= 10) return 20;
    if (streak >= 5) return 10;
    if (streak >= 1) return 5;
    return 1;
  };
  
  const currentStreak = user.currentStreak || 0;
  const highestStreak = user.highestStreak || 0;
  const currentScore = user.currentScore || 0;
  const highestScore = user.highestScore || 0;
  
  const nextMilestone = getNextMilestone(currentStreak);
  const streakProgress = (currentStreak / nextMilestone) * 100;
  const streakLevel = getStreakLevel(currentStreak);
  
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-orange-500" />
          Your Learning Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            {user.photoUrl ? (
              <AvatarImage src={user.photoUrl} alt={user.displayName || user.username} />
            ) : (
              <AvatarFallback>{(user.displayName || user.username)?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            )}
          </Avatar>
          
          <div className="flex-1">
            <div className="font-medium text-lg">{user.displayName || user.username}</div>
            <div className="text-sm text-muted-foreground">{streakLevel} Learner</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-secondary/30 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <Flame className="h-5 w-5 text-orange-500" />
              {currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">Current Streak</div>
          </div>
          
          <div className="bg-secondary/30 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {highestStreak}
            </div>
            <div className="text-xs text-muted-foreground">Best Streak</div>
          </div>
          
          <div className="bg-secondary/30 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <Star className="h-5 w-5 text-blue-500" />
              {currentScore}
            </div>
            <div className="text-xs text-muted-foreground">Current Score</div>
          </div>
          
          <div className="bg-secondary/30 p-3 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold">
              <Award className="h-5 w-5 text-green-500" />
              {highestScore}
            </div>
            <div className="text-xs text-muted-foreground">Highest Score</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Next milestone: {nextMilestone}</span>
            <span className="text-muted-foreground">{currentStreak}/{nextMilestone}</span>
          </div>
          <Progress value={streakProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}