import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

const router = getRouter();

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// Native splash screen'i sadece uygulama ilk açıldığında, garantili 2 sn sonra gizle.
// Sayfa geçişlerinde tetiklenmez — bu sadece dosya yüklendiğinde bir kez çalışır.
(async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // En az 2 sn ekranda kalsın
    await new Promise((r) => setTimeout(r, 2000));
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch (err) {
    console.warn("[splash] hide failed", err);
  }
})();
