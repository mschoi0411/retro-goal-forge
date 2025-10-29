import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Plus, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventStartDate, setNewEventStartDate] = useState("");
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
  const REDIRECT_URI = `${window.location.origin}/calendar`;

  useEffect(() => {
    checkAuth();
    checkGoogleConnection();
    handleOAuthCallback();
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadGoogleEvents();
    }
  }, [isConnected]);

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

  const checkGoogleConnection = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("google_tokens")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    setIsConnected(!!data);
  };

  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (!code) return;

    setConnecting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.functions.invoke("google-calendar", {
        body: {
          action: "exchange-token",
          code,
          redirectUri: REDIRECT_URI,
        },
      });

      if (error) throw error;

      toast({
        title: "구글 캘린더 연동 완료!",
      });

      setIsConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error("OAuth callback error:", error);
      toast({
        title: "연동 실패",
        description: "구글 캘린더 연동에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const connectGoogleCalendar = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar",
      access_type: "offline",
      prompt: "consent",
    })}`;

    window.location.href = authUrl;
  };

  const loadGoogleEvents = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("google-calendar", {
        body: {
          action: "get-events",
        },
      });

      if (error) throw error;

      if (data?.events) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
      toast({
        title: "일정 불러오기 실패",
        description: "구글 캘린더 일정을 불러올 수 없습니다.",
        variant: "destructive",
      });
    }
  };

  const addEvent = async () => {
    if (!newEventTitle.trim() || !newEventStartDate) {
      toast({
        title: "필수 항목을 입력해주세요",
        description: "제목과 시작 날짜는 필수입니다.",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected) {
      toast({
        title: "구글 캘린더 연동 필요",
        description: "먼저 구글 캘린더를 연동해주세요.",
        variant: "destructive",
      });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke("google-calendar", {
        body: {
          action: "create-event",
          title: newEventTitle,
          description: newEventDescription,
          startDate: newEventStartDate,
          endDate: newEventEndDate || newEventStartDate,
        },
      });

      if (error) throw error;

      toast({
        title: "일정 추가 완료!",
      });

      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventStartDate("");
      setNewEventEndDate("");
      setOpen(false);
      loadGoogleEvents();
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "일정 추가에 실패했습니다.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const selectedDateEvents = events.filter((event) => {
    if (!date) return false;
    const eventDateStr = event.start.dateTime || event.start.date;
    if (!eventDateStr) return false;
    
    const eventDate = new Date(eventDateStr);
    return (
      eventDate.getDate() === date.getDate() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getFullYear() === date.getFullYear()
    );
  });

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 animate-slide-up">
          <h1 className="font-pixel text-2xl sm:text-3xl mb-4 text-foreground">캘린더</h1>

          {!isConnected && !connecting && (
            <Alert className="mb-6">
              <CalendarIcon className="h-4 w-4" />
              <AlertDescription className="font-korean">
                구글 캘린더를 연동하여 일정을 관리하세요.
              </AlertDescription>
            </Alert>
          )}

          {connecting && (
            <Alert className="mb-6">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription className="font-korean">
                구글 캘린더 연동 중...
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 mb-6 flex-wrap">
            {!isConnected ? (
              <Button 
                variant="hero" 
                size="lg" 
                onClick={connectGoogleCalendar}
                disabled={connecting}
              >
                <CalendarIcon className="w-5 h-5" />
                {connecting ? "연동 중..." : "구글 캘린더 연동"}
              </Button>
            ) : (
              <>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero" size="lg">
                      <Plus className="w-5 h-5" />
                      일정 추가
                    </Button>
                  </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-pixel">새로운 일정 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="font-korean">
                    일정 제목
                  </Label>
                  <Input
                    id="title"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="일정 제목"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="font-korean">
                    설명
                  </Label>
                  <Textarea
                    id="description"
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="일정 설명"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate" className="font-korean">
                    시작 날짜
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={newEventStartDate}
                    onChange={(e) => setNewEventStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="font-korean">
                    종료 날짜
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={newEventEndDate}
                    onChange={(e) => setNewEventEndDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={addEvent}
                  variant="hero"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "추가 중..." : "일정 추가"}
                </Button>
              </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={loadGoogleEvents}
                >
                  <RefreshCw className="w-5 h-5" />
                  새로고침
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-2 border-border shadow-card">
            <CardContent className="p-6">
              <CalendarUI
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-border shadow-card">
            <CardContent className="p-6">
              <h3 className="font-pixel text-lg mb-4 text-foreground">
                {date ? `${date.getMonth() + 1}월 ${date.getDate()}일의 일정` : "날짜를 선택하세요"}
              </h3>
              <div className="space-y-3">
                {selectedDateEvents.length === 0 ? (
                  <p className="font-korean text-sm text-muted-foreground">
                    이날은 일정이 없습니다.
                  </p>
                ) : (
                  selectedDateEvents.map((event) => {
                    const startDate = event.start.dateTime || event.start.date;
                    return (
                      <div
                        key={event.id}
                        className="p-4 bg-muted/50 rounded-sm border border-border hover:border-primary transition-all"
                      >
                        <h4 className="font-korean font-bold">{event.summary}</h4>
                        {event.description && (
                          <p className="font-korean text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <p className="font-korean text-xs text-muted-foreground mt-2">
                          {startDate ? new Date(startDate).toLocaleString("ko-KR") : ""}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-card border-2 border-border shadow-card">
          <CardContent className="p-6">
            <h3 className="font-pixel text-lg mb-4 text-foreground">전체 일정</h3>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="font-korean text-sm text-muted-foreground">
                  등록된 일정이 없습니다.
                </p>
              ) : (
                events.map((event) => {
                  const startDate = event.start.dateTime || event.start.date;
                  return (
                    <div
                      key={event.id}
                      className="p-4 bg-muted/50 rounded-sm border border-border hover:border-primary transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-korean font-bold">{event.summary}</h4>
                          {event.description && (
                            <p className="font-korean text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <p className="font-korean text-xs text-muted-foreground">
                          {startDate ? new Date(startDate).toLocaleDateString("ko-KR") : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
