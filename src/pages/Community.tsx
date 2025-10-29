import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Trophy, Heart, MessageCircle, Image as ImageIcon, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Community() {
  const [activeTab, setActiveTab] = useState("challenges");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Challenge creation state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    category: "",
    deadline: "",
  });
  
  // Post creation state
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isPostLoading, setIsPostLoading] = useState(false);
  
  // Ranking state
  const [rankings, setRankings] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
    loadRankings();
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setChallenges(data);
    }
  };

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (display_name)
      `)
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setPosts(data);
    }
  };

  const loadRankings = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");
    
    if (!profiles) return;

    const rankingsData = await Promise.all(
      profiles.map(async (profile) => {
        const { count: goalsCount } = await supabase
          .from("goals")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.user_id)
          .eq("completed", true);

        const { data: powder } = await supabase
          .from("user_powder")
          .select("amount")
          .eq("user_id", profile.user_id)
          .single();

        return {
          user: profile.display_name || "모험가",
          goalsCompleted: goalsCount || 0,
          powder: powder?.amount || 0,
          score: (goalsCount || 0) * 100 + (powder?.amount || 0),
        };
      })
    );

    const sorted = rankingsData
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    setRankings(sorted);
  };

  const handleCreateChallenge = async () => {
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

    if (!challengeForm.title || !challengeForm.category) {
      toast({
        title: "모든 필드를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const { data: newRoom, error } = await supabase
      .from("chat_rooms")
      .insert({
        challenge_id: challengeForm.title,
        name: challengeForm.title,
        category: challengeForm.category,
        deadline: challengeForm.deadline || null,
      })
      .select("id")
      .single();

    if (error) {
      toast({
        title: "도전방 생성 실패",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "도전방이 생성되었습니다!",
    });

    setIsCreateDialogOpen(false);
    setChallengeForm({ title: "", category: "", deadline: "" });
    loadChallenges();
    navigate(`/chat/${newRoom.id}`);
  };

  const handleCreatePost = async () => {
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

    if (!postContent.trim()) {
      toast({
        title: "내용을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setIsPostLoading(true);

    let imageUrl = null;
    if (postImage) {
      const fileExt = postImage.name.split(".").pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, postImage);

      if (uploadError) {
        toast({
          title: "이미지 업로드 실패",
          variant: "destructive",
        });
        setIsPostLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);
      
      imageUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("posts")
      .insert({
        user_id: session.user.id,
        content: postContent,
        image_url: imageUrl,
      });

    if (error) {
      toast({
        title: "게시글 작성 실패",
        variant: "destructive",
      });
    } else {
      toast({
        title: "게시글이 작성되었습니다!",
      });
      setPostContent("");
      setPostImage(null);
      loadPosts();
    }

    setIsPostLoading(false);
  };

  const handleJoinChallenge = async (roomId: string) => {
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
          <TabsList className="grid w-full grid-cols-3 h-auto bg-card/50 p-1 border-2 border-border">
            <TabsTrigger value="challenges" className="font-korean data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              도전방
            </TabsTrigger>
            <TabsTrigger value="feed" className="font-korean data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              피드
            </TabsTrigger>
            <TabsTrigger value="ranking" className="font-korean data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              랭킹
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-6">
            <Card className="bg-gradient-primary border-2 border-primary shadow-neon">
              <CardContent className="p-6">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="lg" className="w-full sm:w-auto">
                      <Users className="w-5 h-5" />
                      도전방 만들기
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="font-korean text-xl">도전방 만들기</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="font-korean">방 제목</Label>
                        <Input
                          id="title"
                          placeholder="예: 30일 운동 챌린지"
                          value={challengeForm.title}
                          onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                          className="font-korean"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="font-korean">카테고리</Label>
                        <Input
                          id="category"
                          placeholder="예: 운동, 독서, 공부, 습관"
                          value={challengeForm.category}
                          onChange={(e) => setChallengeForm({ ...challengeForm, category: e.target.value })}
                          className="font-korean"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadline" className="font-korean">마감일 (선택)</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={challengeForm.deadline}
                          onChange={(e) => setChallengeForm({ ...challengeForm, deadline: e.target.value })}
                          className="font-korean"
                        />
                      </div>
                      <Button 
                        variant="neon" 
                        className="w-full"
                        onClick={handleCreateChallenge}
                      >
                        도전방 생성
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenges.map((challenge, i) => {
                const daysLeft = challenge.deadline 
                  ? Math.ceil((new Date(challenge.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                
                return (
                  <Card
                    key={challenge.id}
                    className="bg-card border-2 border-border hover:border-primary transition-all shadow-card hover:shadow-neon cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-korean text-lg mb-2">{challenge.name}</CardTitle>
                          {challenge.category && (
                            <div className="inline-block px-2 py-1 bg-primary/20 rounded-sm border border-primary">
                              <span className="font-korean text-xs text-primary">{challenge.category}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm font-korean text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>도전방</span>
                        </div>
                        {daysLeft !== null && <div>D-{daysLeft}</div>}
                      </div>
                      <Button 
                        variant="neon" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleJoinChallenge(challenge.id)}
                      >
                        참가하기
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="feed" className="space-y-6">
            <Card className="bg-card border-2 border-border shadow-card">
              <CardContent className="p-6">
                <Textarea
                  placeholder="무슨 생각을 하고 계신가요?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="font-korean mb-4 min-h-[100px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                      className="hidden"
                      id="post-image"
                    />
                    <Label htmlFor="post-image" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border-2 border-border rounded-sm hover:border-primary transition-colors">
                        <ImageIcon className="w-4 h-4" />
                        <span className="font-korean text-sm">
                          {postImage ? postImage.name : "이미지 추가"}
                        </span>
                      </div>
                    </Label>
                  </div>
                  <Button 
                    variant="neon" 
                    onClick={handleCreatePost}
                    disabled={isPostLoading}
                  >
                    <Send className="w-4 h-4" />
                    게시
                  </Button>
                </div>
              </CardContent>
            </Card>

            {posts.map((post, i) => (
              <Card
                key={post.id}
                className="bg-card border-2 border-border shadow-card animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-pixel text-sm">
                        {post.profiles?.display_name?.[0] || "모"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-korean font-bold">
                          {post.profiles?.display_name || "모험가"}
                        </span>
                      </div>
                      <p className="font-korean text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  <p className="font-korean mb-4">{post.content}</p>
                  {post.image_url && (
                    <img 
                      src={post.image_url} 
                      alt="Post" 
                      className="w-full rounded-sm border-2 border-border mb-4"
                    />
                  )}
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Heart className="w-4 h-4" />
                      <span className="font-korean text-sm">좋아요</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-korean text-sm">댓글</span>
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
                  전체 랭킹
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rankings.map((entry, i) => {
                  const badges = ["🥇", "🥈", "🥉"];
                  const badge = i < 3 ? badges[i] : "";
                  
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-sm border-2 transition-all",
                        i < 3
                          ? "bg-gradient-primary border-primary shadow-neon"
                          : "bg-card border-border hover:border-primary"
                      )}
                    >
                      <div className="font-pixel text-2xl w-12 text-center">
                        {badge || i + 1}
                      </div>
                      <Avatar className="w-10 h-10 border-2 border-primary">
                        <AvatarFallback className="bg-gradient-secondary text-secondary-foreground font-pixel text-sm">
                          {entry.user[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-korean font-bold">{entry.user}</div>
                        <div className="font-korean text-sm text-muted-foreground">
                          목표 {entry.goalsCompleted}개 · 가루 {entry.powder}
                        </div>
                      </div>
                      <div className="font-pixel text-xl text-primary">
                        {entry.score}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
