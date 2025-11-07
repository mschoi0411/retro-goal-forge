import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Star, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface RankingEntry {
  user_id: string;
  total_exp: number;
  rank: number;
  reward_garu: number;
  display_name?: string;
  daily_exp?: number[]; // Last 7 days EXP
}

const RANKING_REWARDS: Record<number, number> = {
  1: 500,
  2: 400,
  3: 400,
  4: 300,
  5: 300,
  6: 150,
  7: 150,
  8: 150,
  9: 150,
  10: 150,
};

export default function Ranking() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadRankings();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "로그인이 필요합니다",
        description: "로그인 후 이용해주세요.",
        variant: "destructive",
      });
      navigate("/auth");
    } else {
      setCurrentUserId(session.user.id);
    }
  };

  const loadRankings = async () => {
    setLoading(true);

    // Get current week's Monday 00:00
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Calculate total EXP for each user from pet_clicks and post_like_exp
    // This is a simplified version - in production, you'd want to use a server-side function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // Get all users' EXP data from the last 7 days
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      // Aggregate pet click EXP
      const { data: petClickData } = await supabase
        .from("pet_clicks")
        .select("pet_id, clicked_by_user_id, click_date")
        .gte("click_date", sevenDaysAgoStr);

      // Aggregate post like EXP
      const { data: postLikeData } = await supabase
        .from("post_like_exp")
        .select("user_id, exp_gained, exp_date")
        .gte("exp_date", sevenDaysAgoStr);

      // Calculate total EXP per user
      const userExpMap = new Map<string, number>();
      const userDailyExpMap = new Map<string, number[]>();

      // Add pet click EXP (need to get pet owners)
      if (petClickData) {
        const petIds = [...new Set(petClickData.map(c => c.pet_id))];
        const { data: petsData } = await supabase
          .from("pets")
          .select("id, user_id")
          .in("id", petIds);

        const petOwnerMap = new Map(petsData?.map(p => [p.id, p.user_id]) || []);

        // Group by date and user
        const dailyExpByUser = new Map<string, Map<string, number>>();
        
        petClickData.forEach((click) => {
          const ownerId = petOwnerMap.get(click.pet_id);
          if (ownerId) {
            userExpMap.set(ownerId, (userExpMap.get(ownerId) || 0) + 5);
            
            // Track daily EXP
            if (!dailyExpByUser.has(ownerId)) {
              dailyExpByUser.set(ownerId, new Map());
            }
            const userDailyMap = dailyExpByUser.get(ownerId)!;
            userDailyMap.set(click.click_date, (userDailyMap.get(click.click_date) || 0) + 5);
          }
        });

        // Convert to array for last 7 days
        dailyExpByUser.forEach((dailyMap, userId) => {
          const dailyArray: number[] = [];
          for (let i = 6; i >= 0; i--) {
            const checkDate = new Date(now);
            checkDate.setDate(now.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            dailyArray.push(dailyMap.get(dateStr) || 0);
          }
          userDailyExpMap.set(userId, dailyArray);
        });
      }

      // Add post like EXP
      if (postLikeData) {
        postLikeData.forEach((like) => {
          userExpMap.set(like.user_id, (userExpMap.get(like.user_id) || 0) + like.exp_gained);
          
          // Track daily EXP
          if (!userDailyExpMap.has(like.user_id)) {
            userDailyExpMap.set(like.user_id, new Array(7).fill(0));
          }
          
          const dateIndex = Math.floor((now.getTime() - new Date(like.exp_date).getTime()) / (1000 * 60 * 60 * 24));
          if (dateIndex >= 0 && dateIndex < 7) {
            const dailyArray = userDailyExpMap.get(like.user_id)!;
            dailyArray[6 - dateIndex] += like.exp_gained;
          }
        });
      }

      // Convert to array and sort
      const sortedUsers = Array.from(userExpMap.entries())
        .map(([user_id, total_exp]) => ({ user_id, total_exp }))
        .sort((a, b) => b.total_exp - a.total_exp)
        .slice(0, 10); // Top 10 only

      // Get user profiles
      const userIds = sortedUsers.map(u => u.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.display_name]) || []);

      // Create ranking entries
      const rankingEntries: RankingEntry[] = sortedUsers.map((user, index) => ({
        user_id: user.user_id,
        total_exp: user.total_exp,
        rank: index + 1,
        reward_garu: RANKING_REWARDS[index + 1] || 0,
        display_name: profileMap.get(user.user_id) || "알 수 없음",
        daily_exp: userDailyExpMap.get(user.user_id) || new Array(7).fill(0),
      }));

      setRankings(rankingEntries);
    } catch (error) {
      console.error("Error loading rankings:", error);
      toast({
        title: "랭킹 로드 실패",
        description: "랭킹 정보를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-warning animate-pulse-glow" />;
    if (rank === 2) return <Award className="w-6 h-6 text-muted-foreground" />;
    if (rank === 3) return <Award className="w-6 h-6 text-accent" />;
    return <Star className="w-5 h-5 text-muted-foreground" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-warning text-warning-foreground";
    if (rank === 2) return "bg-muted-foreground text-white";
    if (rank === 3) return "bg-accent text-accent-foreground";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 animate-slide-up">
          <h1 className="font-pixel text-2xl sm:text-3xl mb-2 text-foreground">주간 랭킹</h1>
          <p className="font-korean text-sm text-muted-foreground">
            최근 7일간의 활동으로 집계됩니다. 매주 월요일 00:00 보상 지급!
          </p>
        </div>

        <Card className="bg-gradient-secondary border-2 border-secondary shadow-neon mb-6 animate-slide-up">
          <CardHeader>
            <CardTitle className="font-pixel text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary-foreground" />
              <span className="text-secondary-foreground">보상 안내</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="text-center">
                <div className="font-pixel text-warning text-xl mb-1">1위</div>
                <div className="font-korean text-xs text-secondary-foreground">500 가루</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-muted-foreground text-lg mb-1">2-3위</div>
                <div className="font-korean text-xs text-secondary-foreground">400 가루</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-accent text-lg mb-1">4-5위</div>
                <div className="font-korean text-xs text-secondary-foreground">300 가루</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-muted text-lg mb-1">6-10위</div>
                <div className="font-korean text-xs text-secondary-foreground">150 가루</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <Card className="p-8">
              <div className="text-center font-korean text-muted-foreground">
                로딩 중...
              </div>
            </Card>
          ) : rankings.length === 0 ? (
            <Card className="p-8">
              <div className="text-center font-korean text-muted-foreground">
                아직 랭킹 데이터가 없습니다.
              </div>
            </Card>
          ) : (
            rankings.map((entry, index) => (
              <Card
                key={entry.user_id}
                className={cn(
                  "border-2 transition-all shadow-card hover:shadow-neon animate-slide-up",
                  entry.user_id === currentUserId && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  entry.rank === 1 && "border-warning",
                  entry.rank === 2 && "border-muted-foreground",
                  entry.rank === 3 && "border-accent"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center", getRankBadgeColor(entry.rank))}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-pixel text-sm">
                            {entry.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-korean font-bold text-foreground">
                            {entry.display_name}
                            {entry.user_id === currentUserId && (
                              <span className="ml-2 text-xs text-primary">(나)</span>
                            )}
                          </div>
                          <div className="font-korean text-xs text-muted-foreground">
                            {entry.total_exp} EXP
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Sparkline Graph */}
                      {entry.daily_exp && entry.daily_exp.length > 0 && (
                        <div className="w-24 h-12">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={entry.daily_exp.map((exp, i) => ({ exp, day: i }))}>
                              <Line 
                                type="monotone" 
                                dataKey="exp" 
                                stroke={entry.user_id === currentUserId ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} 
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          <div className="text-center mt-1">
                            <span className="font-korean text-xs text-muted-foreground">
                              오늘: <span className={cn("font-bold", entry.user_id === currentUserId && "text-primary")}>
                                {entry.daily_exp[6]}
                              </span>
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="text-right">
                        <div className="font-pixel text-lg text-warning">
                          +{entry.reward_garu}
                        </div>
                        <div className="font-korean text-xs text-muted-foreground">
                          가루
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
