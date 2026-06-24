import { useEffect } from "react";
import { showBanner, hideBanner } from "@/lib/ads";

/**
 * Native AdMob banner'ı gösterir. Web'de hiçbir şey yapmaz.
 * Banner görsel olarak alt menüye binmesin diye AppLayout'ta pb-24 + ek alan bırakılır.
 */
export function AdBanner() {
  useEffect(() => {
    showBanner();
    return () => {
      hideBanner();
    };
  }, []);
  return null;
}
