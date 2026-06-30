import { Capacitor } from "@capacitor/core";

const MIN_SPLASH_MS = 1300;
const appStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

let hideRequested = false;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function nextPaint() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
  });
}

export async function hideNativeSplashAfterAppReady() {
  if (hideRequested || typeof window === "undefined" || !Capacitor.isNativePlatform()) return;
  hideRequested = true;

  try {
    await nextPaint();
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const remaining = Math.max(0, MIN_SPLASH_MS - (now - appStartedAt));
    if (remaining > 0) await wait(remaining);

    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch (err) {
    console.warn("[splash] Native splash kapatılamadı", err);
  }
}