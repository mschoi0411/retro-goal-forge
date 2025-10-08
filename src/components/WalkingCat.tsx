import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

export const WalkingCat = () => {
  const [position, setPosition] = useState(-100);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition((prev) => {
        if (prev > window.innerWidth + 100) {
          return -100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed bottom-8 z-50 walking-cat"
      style={{ left: `${position}px` }}
    >
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center shadow-neon animate-bounce-walk">
          <Heart className="w-8 h-8 text-primary-foreground animate-pulse-glow" />
        </div>
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <div className="bg-card border-2 border-primary px-3 py-1 rounded-sm shadow-neon text-xs font-korean animate-fade-in">
            화이팅! 💪
          </div>
        </div>
        {/* Cat legs animation */}
        <div className="absolute -bottom-2 left-2 w-2 h-3 bg-primary rounded-sm animate-leg-left"></div>
        <div className="absolute -bottom-2 right-2 w-2 h-3 bg-primary rounded-sm animate-leg-right"></div>
      </div>
    </div>
  );
};
