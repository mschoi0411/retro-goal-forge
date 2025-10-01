import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Check, Star, Calendar, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  progress: number;
  difficulty: number;
  powder_reward: number;
  due_date: string;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDifficulty, setNewGoalDifficulty] = useState(1);
  const [newGoalDueDate, setNewGoalDueDate] = useState("");
  const [newGoalReward, setNewGoalReward] = useState(100);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadGoals();
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
    }
  };

  const loadGoals = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setGoals(data);
    }
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    const newCompleted = !completed;
    const { error } = await supabase
      .from("goals")
      .update({
        completed: newCompleted,
        progress: newCompleted ? 100 : goal.progress,
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (newCompleted) {
      // Add powder reward
      const { data: powderData } = await supabase
        .from("user_powder")
        .select("amount")
        .eq("user_id", session.user.id)
        .single();

      if (powderData) {
        await supabase
          .from("user_powder")
          .update({ amount: powderData.amount + goal.powder_reward })
          .eq("user_id", session.user.id);
      }

      toast({
        title: "목표 달성!",
        description: `${goal.powder_reward} 가루를 획득했습니다!`,
      });
    }

    loadGoals();
  };

  const addGoal = async () => {
    if (!newGoalTitle.trim()) {
      toast({
        title: "제목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    setLoading(true);

    const { error } = await supabase.from("goals").insert({
      user_id: session.user.id,
      title: newGoalTitle,
      difficulty: newGoalDifficulty,
      due_date: newGoalDueDate || null,
      powder_reward: newGoalReward,
    });

    if (error) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "목표 추가 완료!",
      });
      setNewGoalTitle("");
      setNewGoalDifficulty(1);
      setNewGoalDueDate("");
      setNewGoalReward(100);
      setOpen(false);
      loadGoals();
    }

    setLoading(false);
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const remainingCount = goals.length - completedCount;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 animate-slide-up">
          <h1 className="font-pixel text-2xl sm:text-3xl mb-4 text-foreground">나의 목표</h1>

          <div className="flex flex-wrap gap-4 mb-6">
            <Card className="flex-1 min-w-[200px] bg-card/50 border-2 border-success">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="font-pixel text-2xl text-success">{completedCount}</div>
                  <div className="font-korean text-xs text-muted-foreground">달성한 목표</div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 min-w-[200px] bg-card/50 border-2 border-warning">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <div className="font-pixel text-2xl text-warning">{remainingCount}</div>
                  <div className="font-korean text-xs text-muted-foreground">남은 목표</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                <Plus className="w-5 h-5" />
                새로운 목표 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-pixel">새로운 목표 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="font-korean">
                    목표 제목
                  </Label>
                  <Input
                    id="title"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="목표를 입력하세요"
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty" className="font-korean">
                    난이도 (★)
                  </Label>
                  <Input
                    id="difficulty"
                    type="number"
                    min="1"
                    max="5"
                    value={newGoalDifficulty}
                    onChange={(e) => setNewGoalDifficulty(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="reward" className="font-korean">
                    보상 가루
                  </Label>
                  <Input
                    id="reward"
                    type="number"
                    min="1"
                    value={newGoalReward}
                    onChange={(e) => setNewGoalReward(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate" className="font-korean">
                    마감일
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newGoalDueDate}
                    onChange={(e) => setNewGoalDueDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={addGoal}
                  variant="hero"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "추가 중..." : "목표 추가"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4 mb-12">
          {goals.map((goal, index) => (
            <Card
              key={goal.id}
              className="bg-card border-2 border-border hover:border-primary transition-all shadow-card animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleGoal(goal.id, goal.completed)}
                    className={cn(
                      "w-6 h-6 rounded-sm border-2 flex-shrink-0 flex items-center justify-center transition-all mt-1",
                      goal.completed
                        ? "bg-success border-success shadow-neon"
                        : "border-border hover:border-primary"
                    )}
                  >
                    {goal.completed && <Check className="w-4 h-4 text-success-foreground" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <div>
                        <h3
                          className={cn(
                            "font-korean text-lg",
                            goal.completed ? "text-muted-foreground line-through" : "text-foreground"
                          )}
                        >
                          {goal.title}
                        </h3>
                        <div className="font-korean text-xs text-muted-foreground mt-1">
                          보상: {goal.powder_reward} 가루
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: goal.difficulty }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress value={goal.progress} className="h-2" />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-korean text-muted-foreground">
                        <span>진행률: {goal.progress}%</span>
                        {goal.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{goal.due_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
