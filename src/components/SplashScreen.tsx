import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // En az 2 sn görünür kalsın, ardından 600ms yumuşak fade ile kaybolsun.
    const fadeTimer = setTimeout(() => setFading(true), 2000);
    const hideTimer = setTimeout(() => setVisible(false), 2600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center primary-gradient transition-opacity duration-700 ease-out ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex h-28 w-28 items-center justify-center rounded-[28px] bg-white/15 backdrop-blur-sm shadow-[var(--shadow-elevated)]">
        <Calendar className="h-16 w-16 text-white" strokeWidth={1.75} />
        <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-md">
          <Clock className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <div className="absolute -top-2 -left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary text-lg font-bold shadow-md">
          ₺
        </div>
      </div>
      <h1 className="mt-8 text-2xl font-semibold text-white tracking-tight">Mesai Defteri</h1>
      <p className="mt-2 text-sm text-white/80">Mesaini Hesapla, Kazancını Takip Et</p>
    </div>
  );
}
