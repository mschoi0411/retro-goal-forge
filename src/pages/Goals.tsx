import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check, Star, Calendar, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Goal {
  id: number;
  title: string;
  completed: boolean;
  progress: number;
  difficulty: number;
  dueDate: string;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, title: "React 마스터하기", completed: false, progress: 65, difficulty: 3, dueDate: "2025-12-31" },
    { id: 2, title: "매일 30분 운동", completed: true, progress: 100, difficulty: 2, dueDate: "2025-10-15" },
    { id: 3, title: "책 10권 읽기", completed: false, progress: 40, difficulty: 2, dueDate: "2025-11-30" },
    { id: 4, title: "영어 단어 1000개 암기", completed: false, progress: 25, difficulty: 3, dueDate: "2025-12-31" },
  ]);

  const completedCount = goals.filter((g) => g.completed).length;
  const remainingCount = goals.length - completedCount;

  const toggleGoal = (id: number) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed, progress: g.completed ? g.progress : 100 } : g)));
  };

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

          <Button variant="hero" size="lg" className="w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            새로운 목표 추가
          </Button>
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
                    onClick={() => toggleGoal(goal.id)}
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
                      <h3
                        className={cn(
                          "font-korean text-lg",
                          goal.completed ? "text-muted-foreground line-through" : "text-foreground"
                        )}
                      >
                        {goal.title}
                      </h3>
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
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{goal.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-secondary border-2 border-secondary shadow-neon">
          <CardHeader>
            <CardTitle className="font-pixel text-xl text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              AI 추천 목표
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["TypeScript 기초 다지기", "알고리즘 문제 풀이", "디자인 패턴 학습"].map((suggestion, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-card/80 rounded-sm border border-border hover:border-secondary transition-all"
              >
                <span className="font-korean text-sm">{suggestion}</span>
                <Button variant="neon" size="sm">
                  추가하기
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
