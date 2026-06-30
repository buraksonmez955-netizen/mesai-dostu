import { useEffect } from "react";
import { showBanner } from "@/lib/ads";

/**
 * Native AdMob banner'ı gösterir. Web'de hiçbir şey yapmaz.
 * Banner görsel olarak alt menüye binmesin diye AppLayout'ta pb-24 + ek alan bırakılır.
 */
export function AdBanner() {
  useEffect(() => {
    void showBanner();
  }, []);
  return null;
}
