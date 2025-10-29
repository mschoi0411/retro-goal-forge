import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trophy, UserPlus, Heart, MessageCircle, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Community() {
  const [activeTab, setActiveTab] = useState("challenges");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinChallenge = async (challengeTitle: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      toast({
        title: "로그인이 필요합니다",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Create or get chat room for this challenge
    const { data: existingRoom } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("challenge_id", challengeTitle)
      .single();

    let roomId = existingRoom?.id;

    if (!roomId) {
      const { data: newRoom, error } = await supabase
        .from("chat_rooms")
        .insert({
          challenge_id: challengeTitle,
          name: challengeTitle,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating room:", error);
        toast({
          title: "채팅방 생성 실패",
          variant: "destructive",
        });
        return;
      }

      roomId = newRoom.id;
    }

    navigate(`/chat/${roomId}`);
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 animate-slide-up">
          <h1 className="font-pixel text-2xl sm:text-3xl mb-4 text-foreground">커뮤니티</h1>
          <p className="font-korean text-muted-foreground">
            함께 목표를 달성하고 동기부여를 받아보세요
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto bg-card/50 p-1 border-2 border-border">
            <TabsTrigger value="challenges" className="font-korean data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              도전방
            </TabsTrigger>
            <TabsTrigger value="feed" className="font-korean data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              피드
            </TabsTrigger>
            <TabsTrigger value="ranking" className="font-korean data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              랭킹
            </TabsTrigger>
            <TabsTrigger value="friends" className="font-korean data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              친구
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-6">
            <Card className="bg-gradient-primary border-2 border-primary shadow-neon">
              <CardContent className="p-6">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <Users className="w-5 h-5" />
                  도전방 만들기
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "30일 운동 챌린지", category: "운동", members: 24, days: 15 },
                { title: "매일 독서 1시간", category: "독서", members: 18, days: 7 },
                { title: "코딩 테스트 정복", category: "공부", members: 32, days: 30 },
                { title: "아침 루틴 만들기", category: "습관", members: 45, days: 21 },
              ].map((challenge, i) => (
                <Card
                  key={i}
                  className="bg-card border-2 border-border hover:border-primary transition-all shadow-card hover:shadow-neon cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-korean text-lg mb-2">{challenge.title}</CardTitle>
                        <div className="inline-block px-2 py-1 bg-primary/20 rounded-sm border border-primary">
                          <span className="font-korean text-xs text-primary">{challenge.category}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm font-korean text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{challenge.members}명 참가중</span>
                      </div>
                      <div>D-{challenge.days}</div>
                    </div>
                    <Button 
                      variant="neon" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => handleJoinChallenge(challenge.title)}
                    >
                      참가하기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feed" className="space-y-6">
            {[
              { user: "모험가123", rank: "Gold", content: "오늘도 목표 달성! 🎉", likes: 42, comments: 8 },
              { user: "목표왕", rank: "Platinum", content: "30일 운동 챌린지 완료했습니다!", likes: 156, comments: 23 },
              { user: "펫마스터", rank: "Diamond", content: "레전더리 펫 획득! 너무 기쁘네요 ✨", likes: 89, comments: 15 },
            ].map((post, i) => (
              <Card
                key={i}
                className="bg-card border-2 border-border shadow-card animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-pixel text-sm">
                        {post.user[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-korean font-bold">{post.user}</span>
                        <span className="px-2 py-0.5 bg-warning/20 rounded-sm border border-warning">
                          <span className="font-pixel text-xs text-warning">{post.rank}</span>
                        </span>
                      </div>
                      <p className="font-korean text-sm text-muted-foreground">2시간 전</p>
                    </div>
                  </div>
                  <p className="font-korean mb-4">{post.content}</p>
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Heart className="w-4 h-4" />
                      <span className="font-korean text-sm">{post.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-korean text-sm">{post.comments}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="font-korean text-sm">칭찬하기</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ranking" className="space-y-6">
            <Card className="bg-card border-2 border-border shadow-card">
              <CardHeader>
                <CardTitle className="font-pixel text-xl flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-warning" />
                  주간 랭킹
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { rank: 1, user: "목표왕", score: 2450, badge: "🥇" },
                  { rank: 2, user: "펫마스터", score: 2230, badge: "🥈" },
                  { rank: 3, user: "챌린저", score: 2100, badge: "🥉" },
                  { rank: 4, user: "모험가123", score: 1890, badge: "" },
                  { rank: 5, user: "열정맨", score: 1750, badge: "" },
                ].map((entry, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-sm border-2 transition-all",
                      entry.rank <= 3
                        ? "bg-gradient-primary border-primary shadow-neon"
                        : "bg-card border-border hover:border-primary"
                    )}
                  >
                    <div className="font-pixel text-2xl w-12 text-center">
                      {entry.badge || entry.rank}
                    </div>
                    <Avatar className="w-10 h-10 border-2 border-primary">
                      <AvatarFallback className="bg-gradient-secondary text-secondary-foreground font-pixel text-sm">
                        {entry.user[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-korean font-bold">{entry.user}</div>
                      <div className="font-korean text-sm text-muted-foreground">
                        {entry.score} 점
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="friends" className="space-y-6">
            <Card className="bg-gradient-secondary border-2 border-secondary shadow-neon">
              <CardContent className="p-6">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  <UserPlus className="w-5 h-5" />
                  친구 추가
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { name: "모험가123", level: 15, pets: 5, goals: 12 },
                { name: "목표왕", level: 22, pets: 8, goals: 24 },
                { name: "펫마스터", level: 18, pets: 12, goals: 18 },
              ].map((friend, i) => (
                <Card
                  key={i}
                  className="bg-card border-2 border-border hover:border-primary transition-all shadow-card animate-slide-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-16 h-16 border-2 border-primary">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-pixel text-lg">
                          {friend.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-korean font-bold text-lg mb-1">{friend.name}</h3>
                        <div className="font-pixel text-sm text-primary">Lv.{friend.level}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded-sm border border-border">
                        <div className="font-pixel text-xl text-accent">{friend.pets}</div>
                        <div className="font-korean text-xs text-muted-foreground">펫</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-sm border border-border">
                        <div className="font-pixel text-xl text-success">{friend.goals}</div>
                        <div className="font-korean text-xs text-muted-foreground">목표</div>
                      </div>
                    </div>
                    <Button variant="neon" size="sm" className="w-full">
                      프로필 보기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
