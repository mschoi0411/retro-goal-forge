import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Pet {
  id: string;
  name: string;
  level: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface MovingPet extends Pet {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  direction: "horizontal" | "vertical" | "diagonal";
}

const rarityGradients = {
  common: "from-muted to-muted-foreground",
  rare: "from-secondary to-secondary/70",
  epic: "from-accent to-accent/70",
  legendary: "from-warning to-warning/70",
};

export const WalkingCat = () => {
  const [movingPets, setMovingPets] = useState<MovingPet[]>([]);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("pets")
      .select("id, name, level, rarity")
      .eq("user_id", session.user.id)
      .limit(5); // 최대 5마리만 표시

    if (data && data.length > 0) {
      const pets = data.map((pet) => {
        // 랜덤한 시작 위치 (화면 안쪽에서 시작)
        const x = Math.random() * (window.innerWidth - 100) + 50;
        const y = Math.random() * (window.innerHeight - 100) + 50;
        
        // 랜덤한 속도와 방향
        const speedX = (Math.random() - 0.5) * 4;
        const speedY = (Math.random() - 0.5) * 4;

        return {
          ...pet,
          x,
          y,
          speedX,
          speedY,
          direction: "diagonal" as const,
        } as MovingPet;
      });

      setMovingPets(pets);
    }
  };

  useEffect(() => {
    if (movingPets.length === 0) return;

    const interval = setInterval(() => {
      setMovingPets((prevPets) =>
        prevPets.map((pet) => {
          let newX = pet.x + pet.speedX;
          let newY = pet.y + pet.speedY;
          let newSpeedX = pet.speedX;
          let newSpeedY = pet.speedY;

          // 화면 가장자리에 부딪히면 튕겨나감
          const petSize = 32; // w-8 = 32px
          if (newX <= 0 || newX >= window.innerWidth - petSize) {
            newSpeedX = -newSpeedX;
            newX = newX <= 0 ? 0 : window.innerWidth - petSize;
          }

          if (newY <= 0 || newY >= window.innerHeight - petSize) {
            newSpeedY = -newSpeedY;
            newY = newY <= 0 ? 0 : window.innerHeight - petSize;
          }

          return {
            ...pet,
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY,
          };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [movingPets.length]);

  return (
    <>
      {movingPets.map((pet) => (
        <div
          key={pet.id}
          className="fixed z-50 walking-cat"
          style={{ left: `${pet.x}px`, top: `${pet.y}px` }}
        >
          <div className="relative">
            <div
              className={`w-8 h-8 bg-gradient-to-br ${
                rarityGradients[pet.rarity]
              } rounded-lg flex items-center justify-center shadow-neon animate-bounce-walk`}
            >
              <Heart className="w-4 h-4 text-primary-foreground animate-pulse-glow" />
            </div>
            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-card border border-primary px-2 py-0.5 rounded-sm shadow-neon text-[10px] font-korean animate-fade-in">
                {pet.name}
              </div>
            </div>
            {/* Pet legs animation */}
            <div className="absolute -bottom-1 left-1 w-1 h-2 bg-primary rounded-sm animate-leg-left"></div>
            <div className="absolute -bottom-1 right-1 w-1 h-2 bg-primary rounded-sm animate-leg-right"></div>
          </div>
        </div>
      ))}
    </>
  );
};
