import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Medal, Trophy, Flame, TrendingUp } from "lucide-react";

export function Leaderboard() {
  const { toast } = useToast();
  const [limit, setLimit] = useState(10);
  
  const { data: leaderboard, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/leaderboard", limit],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?limit=${limit}`);
      if (!res.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      return res.json();
    }
  });
  
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load leaderboard. Please try again later.",
      variant: "destructive",
    });
  }
  
  // Get medal for top 3 places
  const getMedal = (index: number) => {
    switch (index) {
      case 0:
        return <Medal className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard?.map((user, index) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20">
                <div className="flex items-center justify-center w-8">
                  {getMedal(index) || <span className="text-muted-foreground">{index + 1}</span>}
                </div>
                
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  {user.photoUrl ? (
                    <AvatarImage src={user.photoUrl} alt={user.displayName || user.username} />
                  ) : (
                    <AvatarFallback>{(user.displayName || user.username)?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1">
                  <div className="font-medium">{user.displayName || user.username}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" />
                    Highest streak: {user.highestStreak || 0}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    {user.highestScore || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            ))}
            
            {(leaderboard?.length || 0) === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No scores yet. Start practicing to climb the leaderboard!
              </div>
            )}
            
            {(leaderboard?.length || 0) >= limit && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setLimit(prev => prev + 10)}
              >
                Show more
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}