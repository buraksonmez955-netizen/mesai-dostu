import { Capacitor } from "@capacitor/core";

let initialized = false;

function setKeyboardHeight(height: number) {
  document.documentElement.style.setProperty("--keyboard-height", `${Math.max(0, height)}px`);
}

function keepFocusedFieldVisible() {
  const active = document.activeElement;
  if (!(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) return;
  window.setTimeout(() => {
    active.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, 80);
}

export async function installNativeKeyboardGuards() {
  if (initialized || typeof window === "undefined" || !Capacitor.isNativePlatform()) return;
  initialized = true;

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    await Keyboard.addListener("keyboardDidShow", (info) => {
      setKeyboardHeight(info.keyboardHeight);
      keepFocusedFieldVisible();
    });
    await Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
  } catch (err) {
    console.warn("[keyboard] Native klavye dinleyicileri kurulamadı", err);
  }
}