import { Leaderboard } from "@/components/leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Learners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">
            See who's leading the way in Mandarin mastery! The leaderboard shows the highest scores and streaks of all learners.
          </p>
          <Leaderboard />
        </CardContent>
      </Card>
    </div>
  );
}