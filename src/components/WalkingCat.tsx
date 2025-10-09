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
      const pets = data.map((pet, index) => {
        const directions = ["horizontal", "vertical", "diagonal"] as const;
        const direction = directions[index % directions.length];
        
        let x, y, speedX, speedY;
        
        switch (direction) {
          case "horizontal":
            x = Math.random() > 0.5 ? -100 : window.innerWidth + 100;
            y = Math.random() * (window.innerHeight - 200) + 100;
            speedX = x < 0 ? 2 + Math.random() : -(2 + Math.random());
            speedY = 0;
            break;
          case "vertical":
            x = Math.random() * (window.innerWidth - 200) + 100;
            y = Math.random() > 0.5 ? -100 : window.innerHeight + 100;
            speedX = 0;
            speedY = y < 0 ? 2 + Math.random() : -(2 + Math.random());
            break;
          case "diagonal":
            x = Math.random() > 0.5 ? -100 : window.innerWidth + 100;
            y = Math.random() > 0.5 ? -100 : window.innerHeight + 100;
            speedX = x < 0 ? 1.5 + Math.random() : -(1.5 + Math.random());
            speedY = y < 0 ? 1.5 + Math.random() : -(1.5 + Math.random());
            break;
        }

        return {
          ...pet,
          x,
          y,
          speedX,
          speedY,
          direction,
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

          // 화면 밖으로 나가면 반대편에서 다시 나타남
          if (newX > window.innerWidth + 100) {
            newX = -100;
          } else if (newX < -100) {
            newX = window.innerWidth + 100;
          }

          if (newY > window.innerHeight + 100) {
            newY = -100;
          } else if (newY < -100) {
            newY = window.innerHeight + 100;
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
              className={`w-16 h-16 bg-gradient-to-br ${
                rarityGradients[pet.rarity]
              } rounded-lg flex items-center justify-center shadow-neon animate-bounce-walk`}
            >
              <Heart className="w-8 h-8 text-primary-foreground animate-pulse-glow" />
            </div>
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-card border-2 border-primary px-3 py-1 rounded-sm shadow-neon text-xs font-korean animate-fade-in">
                {pet.name}
              </div>
            </div>
            {/* Pet legs animation */}
            <div className="absolute -bottom-2 left-2 w-2 h-3 bg-primary rounded-sm animate-leg-left"></div>
            <div className="absolute -bottom-2 right-2 w-2 h-3 bg-primary rounded-sm animate-leg-right"></div>
          </div>
        </div>
      ))}
    </>
  );
};
