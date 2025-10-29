import { useState, useEffect, useRef } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

interface Goal {
  id: string;
  title: string;
  completed: boolean;
  progress: number;
  difficulty: number;
  powder_reward: number;
  due_date: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDifficulty, setNewGoalDifficulty] = useState(1);
  const [newGoalDueDate, setNewGoalDueDate] = useState("");
  const [newGoalReward, setNewGoalReward] = useState(100);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
    loadGoals();
    loadCalendarEvents();
  }, []);

  useEffect(() => {
    calculateReward();
  }, [newGoalDifficulty, newGoalDueDate]);

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

  const loadCalendarEvents = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("calendar_events")
      .select("id, title, start_date, end_date")
      .eq("user_id", session.user.id)
      .order("start_date", { ascending: true });

    if (data) {
      setCalendarEvents(data);
    }
  };

  const handleTitleChange = (value: string) => {
    setNewGoalTitle(value);
    
    if (value.trim().length > 0) {
      const filtered = calendarEvents.filter((event) =>
        event.title.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredEvents(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredEvents([]);
    }
  };

  const selectEvent = (event: CalendarEvent) => {
    setNewGoalTitle(event.title);
    if (event.end_date) {
      setNewGoalDueDate(event.end_date.split('T')[0]);
    } else {
      setNewGoalDueDate(event.start_date.split('T')[0]);
    }
    setShowSuggestions(false);
    setFilteredEvents([]);
  };

  const calculateReward = () => {
    let reward = 100; // 기본 보상
    
    // 난이도에 따른 보상 (난이도 1당 +50)
    reward += (newGoalDifficulty - 1) * 50;
    
    // 기간에 따른 보상 계산
    if (newGoalDueDate) {
      const today = new Date();
      const dueDate = new Date(newGoalDueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        // 1주일(7일)당 +25 보상
        const weeks = Math.floor(diffDays / 7);
        reward += weeks * 25;
      }
    }
    
    setNewGoalReward(reward);
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
                  <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          ref={inputRef}
                          id="title"
                          value={newGoalTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="목표를 입력하세요 (캘린더 일정 연동)"
                          onFocus={() => {
                            if (newGoalTitle.trim() && filteredEvents.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-full p-0" 
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Command>
                        <CommandList>
                          <CommandEmpty className="font-korean text-sm p-2">
                            일치하는 일정이 없습니다.
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredEvents.map((event) => (
                              <CommandItem
                                key={event.id}
                                onSelect={() => selectEvent(event)}
                                className="font-korean cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <div>
                                    <div>{event.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(event.start_date).toLocaleDateString('ko-KR')}
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                  <div className="text-xs text-muted-foreground mt-1 font-korean">
                    난이도 1당 +50 가루
                  </div>
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
                  <div className="text-xs text-muted-foreground mt-1 font-korean">
                    1주일당 +25 가루
                  </div>
                </div>
                <div>
                  <Label htmlFor="reward" className="font-korean">
                    보상 가루 (자동 계산)
                  </Label>
                  <Input
                    id="reward"
                    type="number"
                    min="1"
                    value={newGoalReward}
                    readOnly
                    className="bg-muted"
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
