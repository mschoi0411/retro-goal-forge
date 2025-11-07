import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Send, ArrowLeft, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EXP_CONSTANTS, checkLevelUp, getExpRequiredForNextLevel } from "@/utils/petLevel";

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
}

interface Participant {
  id: string;
  user_id: string;
  profiles?: {
    display_name: string;
  };
  pets?: {
    id: string;
    name: string;
    level: number;
    rarity: "common" | "rare" | "epic" | "legendary";
  };
}

interface MovingPet {
  id: string;
  name: string;
  level: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  user_id: string;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
}

const rarityGradients = {
  common: "from-muted to-muted-foreground",
  rare: "from-secondary to-secondary/70",
  epic: "from-accent to-accent/70",
  legendary: "from-warning to-warning/70",
};

export default function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [movingPets, setMovingPets] = useState<MovingPet[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable global walking pets when entering chat room
    const previousState = localStorage.getItem("walkingPetsEnabled");
    localStorage.setItem("walkingPetsEnabled", "false");
    window.dispatchEvent(new Event("walkingPetsToggle"));

    initializeRoom();

    // Re-enable global walking pets when leaving chat room
    return () => {
      localStorage.setItem("walkingPetsEnabled", previousState || "true");
      window.dispatchEvent(new Event("walkingPetsToggle"));
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (movingPets.length === 0 || !chatContainerRef.current) return;

    const interval = setInterval(() => {
      setMovingPets((prevPets) =>
        prevPets.map((pet) => {
          let newX = pet.x + pet.speedX;
          let newY = pet.y + pet.speedY;

          const containerRect = chatContainerRef.current?.getBoundingClientRect();
          if (!containerRect) return pet;

          const petSize = 32;
          const maxX = containerRect.width - petSize;
          const maxY = containerRect.height - petSize;

          if (newX <= 0 || newX >= maxX) {
            pet.speedX = -pet.speedX;
            newX = newX <= 0 ? 0 : maxX;
          }

          if (newY <= 0 || newY >= maxY) {
            pet.speedY = -pet.speedY;
            newY = newY <= 0 ? 0 : maxY;
          }

          return {
            ...pet,
            x: newX,
            y: newY,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [movingPets.length]);

  const initializeRoom = async () => {
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

    setCurrentUserId(session.user.id);

    // Get user's main pet
    const { data: mainPet } = await supabase
      .from("pets")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("is_main", true)
      .maybeSingle();

    // Check if already a participant
    const { data: existingParticipant } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (existingParticipant) {
      // Update existing participant with current main pet
      await supabase
        .from("chat_participants")
        .update({ pet_id: mainPet?.id })
        .eq("id", existingParticipant.id);
    } else {
      // Join the room as new participant
      await supabase
        .from("chat_participants")
        .insert({
          room_id: roomId,
          user_id: session.user.id,
          pet_id: mainPet?.id,
        });
    }

    // Load messages
    loadMessages();

    // Load participants and their pets
    loadParticipants();

    // Subscribe to new messages
    const messageChannel = supabase
      .channel(`chat_messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          loadMessages();
        }
      )
      .subscribe();

    // Subscribe to participant changes
    const participantChannel = supabase
      .channel(`chat_participants:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_participants",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(participantChannel);
    };
  };

  const loadMessages = async () => {
    const { data: messagesData, error } = await supabase
      .from("chat_messages")
      .select("id, user_id, message, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    if (!messagesData) {
      setMessages([]);
      return;
    }

    // Fetch profiles separately
    const userIds = [...new Set(messagesData.map((m) => m.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profilesMap = new Map(
      profilesData?.map((p) => [p.user_id, p]) || []
    );

    const enrichedMessages = messagesData.map((msg) => ({
      ...msg,
      profiles: profilesMap.get(msg.user_id),
    }));

    setMessages(enrichedMessages);
  };

  const loadParticipants = async () => {
    const { data: participantsData, error } = await supabase
      .from("chat_participants")
      .select("id, user_id, pet_id")
      .eq("room_id", roomId);

    if (error) {
      console.error("Error loading participants:", error);
      return;
    }

    if (!participantsData) {
      setParticipants([]);
      setMovingPets([]);
      return;
    }

    // Fetch profiles separately
    const userIds = participantsData.map((p) => p.user_id);
    
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    // Fetch main pets for all users
    const { data: petsData } = await supabase
      .from("pets")
      .select("id, name, level, rarity, user_id")
      .in("user_id", userIds)
      .eq("is_main", true);

    console.log("Participants:", participantsData);
    console.log("Pets data:", petsData);

    const profilesMap = new Map(
      profilesData?.map((p) => [p.user_id, p]) || []
    );
    const petsMap = new Map(petsData?.map((p) => [p.user_id, p]) || []);

    const enrichedParticipants = participantsData.map((participant) => ({
      ...participant,
      profiles: profilesMap.get(participant.user_id),
      pets: petsMap.get(participant.user_id),
    }));

    setParticipants(enrichedParticipants as Participant[]);

    // Initialize moving pets
    if (chatContainerRef.current) {
      const containerRect = chatContainerRef.current.getBoundingClientRect();
      const pets = enrichedParticipants
        .filter((p) => p.pets)
        .map((p) => {
          const pet = p.pets!;
          const x = Math.random() * (containerRect.width - 100) + 50;
          const y = Math.random() * (containerRect.height - 100) + 50;
          const speedX = (Math.random() - 0.5) * 3;
          const speedY = (Math.random() - 0.5) * 3;

          return {
            id: pet.id,
            name: pet.name,
            level: pet.level,
            rarity: pet.rarity as "common" | "rare" | "epic" | "legendary",
            user_id: p.user_id,
            x,
            y,
            speedX,
            speedY,
          };
        });

      console.log("Moving pets initialized:", pets);
      setMovingPets(pets);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const { error } = await supabase.from("chat_messages").insert({
      room_id: roomId,
      user_id: currentUserId,
      message: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "메시지 전송 실패",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePetClick = async (petId: string, petOwnerId: string) => {
    if (!currentUserId) return;
    if (currentUserId === petOwnerId) {
      toast({
        title: "자신의 펫은 클릭할 수 없습니다",
        variant: "destructive",
      });
      return;
    }

    try {
      // 오늘 이미 클릭했는지 확인
      const { data: existingClick } = await supabase
        .from('pet_clicks')
        .select('id')
        .eq('pet_id', petId)
        .eq('clicked_by_user_id', currentUserId)
        .eq('click_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (existingClick) {
        toast({
          title: "이미 오늘 이 펫을 응원했습니다",
        });
        return;
      }

      // 클릭 기록
      const { error: clickError } = await supabase
        .from('pet_clicks')
        .insert({
          pet_id: petId,
          clicked_by_user_id: currentUserId,
        });

      if (clickError) throw clickError;

      // 펫의 현재 경험치와 레벨 가져오기
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .select('experience, level, user_id')
        .eq('id', petId)
        .single();

      if (petError) throw petError;

      const newExp = pet.experience + EXP_CONSTANTS.PET_CLICK;
      const { newLevel, totalReward } = checkLevelUp(newExp, pet.level);

      // 레벨업 발생 시
      if (newLevel > pet.level) {
        const expRequired = getExpRequiredForNextLevel(pet.level);
        // 펫 경험치와 레벨 업데이트
        const { error: updatePetError } = await supabase
          .from('pets')
          .update({
            experience: newExp - expRequired,
            level: newLevel,
          })
          .eq('id', petId);

        if (updatePetError) throw updatePetError;

        // 가루 보상 지급
        const { data: powderData, error: powderError } = await supabase
          .from('user_powder')
          .select('amount')
          .eq('user_id', pet.user_id)
          .single();

        if (powderError) throw powderError;

        const { error: updatePowderError } = await supabase
          .from('user_powder')
          .update({ amount: powderData.amount + totalReward })
          .eq('user_id', pet.user_id);

        if (updatePowderError) throw updatePowderError;

        toast({
          title: "🎉 펫이 레벨업했습니다!",
          description: `레벨 ${newLevel}이 되었습니다! +${totalReward} 가루 획득`,
        });
      } else {
        // 경험치만 업데이트
        const { error: updatePetError } = await supabase
          .from('pets')
          .update({ experience: newExp })
          .eq('id', petId);

        if (updatePetError) throw updatePetError;

        toast({
          title: "펫을 응원했습니다!",
          description: `+${EXP_CONSTANTS.PET_CLICK} 경험치`,
        });
      }

      // 참가자 목록 새로고침
      loadParticipants();
    } catch (error) {
      console.error('Error clicking pet:', error);
      toast({
        title: "펫 클릭 실패",
        description: "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b-2 border-border p-4">
        <div className="container mx-auto max-w-6xl flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/community")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-pixel text-xl text-foreground">채팅방</h1>
            <p className="font-korean text-sm text-muted-foreground">
              {participants.length}명 참가중
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area with Pets */}
      <div className="flex-1 relative overflow-hidden" ref={chatContainerRef}>
        {/* Moving Pets */}
        {movingPets.map((pet) => (
          <div
            key={pet.id}
            className="absolute z-10 cursor-pointer"
            style={{ left: `${pet.x}px`, top: `${pet.y}px` }}
            onClick={() => handlePetClick(pet.id, pet.user_id)}
          >
            <div className="relative">
              <div
                className={`w-8 h-8 bg-gradient-to-br ${
                  rarityGradients[pet.rarity]
                } rounded-lg flex items-center justify-center shadow-neon animate-bounce-walk transition-transform hover:scale-110`}
              >
                <Heart className="w-4 h-4 text-primary-foreground animate-pulse-glow" />
              </div>
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className="bg-card border border-primary px-2 py-0.5 rounded-sm shadow-neon text-[10px] font-korean">
                  {pet.name} Lv.{pet.level}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Messages */}
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="container mx-auto max-w-6xl space-y-4 pb-4">
            {messages.map((msg) => {
              const isMyMessage = msg.user_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isMyMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[70%] ${
                      isMyMessage ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {!isMyMessage && (
                      <Avatar className="w-8 h-8 border-2 border-primary flex-shrink-0">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-pixel text-xs">
                          {msg.profiles?.display_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`flex flex-col ${
                        isMyMessage ? "items-end" : "items-start"
                      }`}
                    >
                      {!isMyMessage && (
                        <span className="font-korean text-xs text-muted-foreground mb-1 px-2">
                          {msg.profiles?.display_name || "알 수 없음"}
                        </span>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isMyMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border-2 border-border"
                        }`}
                      >
                        <p className="font-korean text-sm">{msg.message}</p>
                      </div>
                      <span className="font-korean text-xs text-muted-foreground mt-1 px-2">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="bg-card border-t-2 border-border p-4">
        <div className="container mx-auto max-w-6xl flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 font-korean"
          />
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
