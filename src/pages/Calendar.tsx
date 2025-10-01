import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";

export default function Calendar() {
  const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  // Simple calendar grid for demo (actual implementation would calculate proper dates)
  const calendarDays = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 animate-slide-up">
          <h1 className="font-pixel text-2xl sm:text-3xl mb-4 text-foreground">캘린더</h1>
          <p className="font-korean text-muted-foreground">
            일정을 관리하고 목표를 계획하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-card border-2 border-border shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="font-pixel text-lg">{currentMonth}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="text-center font-korean text-sm text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => (
                    <button
                      key={day}
                      className="aspect-square p-2 rounded-sm border border-border hover:border-primary hover:bg-primary/10 transition-all font-korean text-sm"
                    >
                      {day <= 31 ? day : ""}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-primary border-2 border-primary shadow-neon">
              <CardContent className="p-6">
                <Button variant="hero" size="lg" className="w-full">
                  <Plus className="w-5 h-5" />
                  일정 추가
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <CardTitle className="font-pixel text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  오늘의 일정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { time: "09:00", task: "React 공부", color: "border-l-primary" },
                  { time: "14:00", task: "운동", color: "border-l-success" },
                  { time: "19:00", task: "독서", color: "border-l-accent" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 bg-muted/50 rounded-sm border-l-4 hover:bg-muted transition-all",
                      item.color
                    )}
                  >
                    <div className="font-pixel text-xs text-muted-foreground mb-1">{item.time}</div>
                    <div className="font-korean text-sm">{item.task}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-2 border-border">
              <CardHeader>
                <CardTitle className="font-pixel text-lg">Today Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-korean text-sm text-muted-foreground">완료한 목표</span>
                  <span className="font-pixel text-success">3 / 5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-korean text-sm text-muted-foreground">획득 가루</span>
                  <span className="font-pixel text-warning">+150</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
