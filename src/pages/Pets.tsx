import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Star, Sparkles, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Pet {
  id: number;
  name: string;
  level: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  experience: number;
  isMain: boolean;
  stars: number;
}

const rarityColors = {
  common: "text-muted-foreground border-muted",
  rare: "text-secondary border-secondary",
  epic: "text-accent border-accent",
  legendary: "text-warning border-warning",
};

const rarityBg = {
  common: "from-muted/20 to-muted/5",
  rare: "from-secondary/20 to-secondary/5",
  epic: "from-accent/20 to-accent/5",
  legendary: "from-warning/20 to-warning/5",
};

export default function Pets() {
  const [pets, setPets] = useState<Pet[]>([
    { id: 1, name: "불꽃이", level: 5, rarity: "legendary", experience: 75, isMain: true, stars: 3 },
    { id: 2, name: "푸르미", level: 3, rarity: "epic", experience: 45, isMain: false, stars: 2 },
    { id: 3, name: "반짝이", level: 2, rarity: "rare", experience: 60, isMain: false, stars: 1 },
  ]);

  const [powder] = useState(1250);

  const setMainPet = (id: number) => {
    setPets(pets.map((p) => ({ ...p, isMain: p.id === id })));
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 animate-slide-up">
          <h1 className="font-pixel text-2xl sm:text-3xl mb-4 text-foreground">나의 펫</h1>

          <Card className="bg-gradient-primary border-2 border-primary shadow-neon mb-6">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-warning rounded-lg flex items-center justify-center animate-pulse-glow">
                  <Sparkles className="w-8 h-8 text-warning-foreground" />
                </div>
                <div>
                  <div className="font-korean text-sm text-primary-foreground/80">보유 가루</div>
                  <div className="font-pixel text-2xl text-primary-foreground">{powder}</div>
                </div>
              </div>
              <Button variant="hero" size="lg">
                <Zap className="w-5 h-5" />
                펫 생성하기
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-4">
            <div className="font-korean text-muted-foreground">
              총 <span className="text-foreground font-bold">{pets.length}</span>마리의 펫을 보유하고 있습니다
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet, index) => (
            <Card
              key={pet.id}
              className={cn(
                "relative overflow-hidden border-2 transition-all shadow-card hover:shadow-neon animate-slide-up",
                rarityColors[pet.rarity],
                pet.isMain && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {pet.isMain && (
                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-primary rounded-sm">
                  <span className="font-pixel text-xs text-primary-foreground">MAIN</span>
                </div>
              )}

              <div className="absolute top-2 right-2 z-10 flex gap-0.5">
                {Array.from({ length: pet.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-warning fill-warning animate-pulse-glow" />
                ))}
              </div>

              <div className={cn("h-48 bg-gradient-to-br flex items-center justify-center", rarityBg[pet.rarity])}>
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center shadow-neon animate-float">
                    <Heart className="w-16 h-16 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-card/90 rounded-full border border-border">
                    <span className="font-pixel text-xs">Lv.{pet.level}</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-korean text-lg font-bold mb-1">{pet.name}</h3>
                  <div className={cn("font-korean text-xs capitalize", rarityColors[pet.rarity])}>
                    {pet.rarity}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-korean text-muted-foreground">
                    <span>경험치</span>
                    <span>{pet.experience}%</span>
                  </div>
                  <Progress value={pet.experience} className="h-2" />
                </div>

                <div className="flex gap-2">
                  {!pet.isMain && (
                    <Button
                      variant="neon"
                      size="sm"
                      onClick={() => setMainPet(pet.id)}
                      className="flex-1"
                    >
                      메인 설정
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1">
                    <Star className="w-4 h-4" />
                    강화
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 bg-card/50 border-2 border-border">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="inline-flex w-20 h-20 bg-gradient-secondary rounded-lg items-center justify-center shadow-neon animate-float">
                <Sparkles className="w-10 h-10 text-secondary-foreground" />
              </div>
              <h3 className="font-pixel text-xl text-foreground">펫 강화 시스템</h3>
              <p className="font-korean text-sm text-muted-foreground max-w-md mx-auto">
                가루를 사용해 펫을 강화하세요!<br />
                강화할수록 더 많은 가루가 필요합니다.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <div className="text-center">
                  <div className="font-pixel text-2xl text-warning">★</div>
                  <div className="font-korean text-xs text-muted-foreground">100 가루</div>
                </div>
                <div className="text-center">
                  <div className="font-pixel text-2xl text-warning">★★</div>
                  <div className="font-korean text-xs text-muted-foreground">200 가루</div>
                </div>
                <div className="text-center">
                  <div className="font-pixel text-2xl text-warning">★★★</div>
                  <div className="font-korean text-xs text-muted-foreground">400 가루</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
