import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";

const SPLASH_FLAG = "mesai_splash_shown";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setMounted(true);
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SPLASH_FLAG) === "1";
    } catch {
      // ignore
    }
    if (alreadyShown) return;

    setVisible(true);
    try {
      sessionStorage.setItem(SPLASH_FLAG, "1");
    } catch {
      // ignore
    }
    const fadeTimer = setTimeout(() => setFading(true), 1600);
    const hideTimer = setTimeout(() => setVisible(false), 2100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!mounted || !visible) return null;

  return (
    <div
      aria-hidden
      style={{
        background: "linear-gradient(135deg, #14b8a6, #0d9488)",
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex h-28 w-28 items-center justify-center rounded-[28px] bg-white/15 backdrop-blur-sm shadow-2xl">
        <Calendar className="h-16 w-16 text-white" strokeWidth={1.75} />
        <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal-600 shadow-md">
          <Clock className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <div className="absolute -top-2 -left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal-600 text-lg font-bold shadow-md">
          ₺
        </div>
      </div>
      <h1 className="mt-8 text-2xl font-semibold text-white tracking-tight">Mesai Defteri</h1>
      <p className="mt-2 text-sm text-white/90">Mesaini Hesapla, Kazancını Takip Et</p>
    </div>
  );
}
