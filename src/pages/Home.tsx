import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Heart, Zap, TrendingUp } from "lucide-react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName] = useState("모험가");

  const stats = [
    { label: "달성한 목표", value: 12, icon: Target, color: "text-success" },
    { label: "나의 펫", value: 3, icon: Heart, color: "text-accent" },
    { label: "도전 중", value: 5, icon: Zap, color: "text-warning" },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-2xl w-full animate-slide-up">
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-primary rounded-lg flex items-center justify-center shadow-neon animate-float">
                <Heart className="w-16 h-16 text-primary-foreground animate-pulse-glow" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center animate-pulse">
                <Zap className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
          </div>

          <h1 className="font-pixel text-2xl sm:text-4xl mb-6 text-foreground">
            QuestPet
          </h1>
          
          <p className="font-korean text-base sm:text-xl mb-8 text-muted-foreground leading-relaxed">
            오늘도 목표를 깨러 떠나볼까요?<br />
            목표를 달성하고 귀여운 펫을 키워보세요!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="hero"
              size="hero"
              onClick={() => setIsLoggedIn(true)}
              className="w-full sm:w-auto"
            >
              회원가입 하기
            </Button>
            <Button
              variant="neon"
              size="lg"
              onClick={() => setIsLoggedIn(true)}
              className="w-full sm:w-auto"
            >
              로그인
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="bg-card/50 border-2 border-border hover:border-primary transition-all cursor-default">
                  <CardContent className="p-6 text-center">
                    <Icon className={cn("w-8 h-8 mx-auto mb-2", stat.color)} />
                    <div className="font-korean text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="font-pixel text-2xl sm:text-3xl mb-4 text-foreground">
            {userName}님, 환영합니다!
          </h1>
          <p className="font-korean text-muted-foreground">
            오늘도 목표를 향해 달려봐요!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="bg-card border-2 border-border hover:border-primary transition-all shadow-card hover:shadow-neon cursor-pointer group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center shadow-neon group-hover:animate-float">
                      <Icon className={cn("w-8 h-8 text-primary-foreground")} />
                    </div>
                  </div>
                  <div className="font-pixel text-4xl mb-2 text-foreground">{stat.value}</div>
                  <div className="font-korean text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button variant="hero" size="hero" className="group">
            <TrendingUp className="w-5 h-5 group-hover:animate-pulse" />
            새로운 목표 달성하기
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/50 border-2 border-border">
            <CardContent className="p-6">
              <h3 className="font-pixel text-lg mb-4 text-foreground">오늘의 목표</h3>
              <div className="space-y-3">
                {["React 공부 1시간", "운동 30분", "독서 20페이지"].map((goal, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-sm border border-border hover:border-primary transition-all"
                  >
                    <div className="w-4 h-4 border-2 border-primary rounded-sm"></div>
                    <span className="font-korean text-sm">{goal}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-2 border-border">
            <CardContent className="p-6">
              <h3 className="font-pixel text-lg mb-4 text-foreground">나의 펫</h3>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((pet) => (
                  <div
                    key={pet}
                    className="aspect-square bg-gradient-primary rounded-lg flex items-center justify-center shadow-neon hover:shadow-neon-hover cursor-pointer transition-all hover:scale-105"
                  >
                    <Heart className="w-8 h-8 text-primary-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
