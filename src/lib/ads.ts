// AdMob entegrasyonu — sadece native (Android/iOS) platformlarda çalışır.
// Web/SSR ortamında tüm fonksiyonlar sessizce no-op döner; uygulama akışını bloklamaz.
import { Capacitor } from "@capacitor/core";

export const ADMOB_IDS = {
  appId: "ca-app-pub-9985326646469445~9233828508",
  banner: "ca-app-pub-9985326646469445/1141118436",
  interstitial: "ca-app-pub-9985326646469445/8101699915",
};

// Google'ın resmi test ID'leri — dahili testte fill rate %100, gerçek reklam yüklenmese
// bile görünür. Production'a geçince AD_TESTING=false yap.
const AD_TESTING = true;
const TEST_IDS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
};
const BANNER_ID = AD_TESTING ? TEST_IDS.banner : ADMOB_IDS.banner;
const INTERSTITIAL_ID = AD_TESTING ? TEST_IDS.interstitial : ADMOB_IDS.interstitial;

const INTERSTITIAL_MIN_INTERVAL_MS = 15 * 60 * 1000; // 15 dakika
const LAST_INTERSTITIAL_KEY = "mesai.lastInterstitialAt";

function isNative(): boolean {
  try {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

let initialized = false;
let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<boolean> {
  if (!isNative()) return false;
  if (initialized) return true;
  if (initPromise) {
    await initPromise;
    return initialized;
  }
  initPromise = (async () => {
    try {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.initialize({
        initializeForTesting: AD_TESTING,
        testingDevices: [],
      });
      initialized = true;
      console.log("[ads] AdMob initialized (testing=" + AD_TESTING + ")");
    } catch (err) {
      console.warn("[ads] init failed", err);
    }
  })();
  await initPromise;
  return initialized;
}

let bannerShown = false;

export async function showBanner(): Promise<void> {
  if (!(await ensureInit())) {
    console.log("[ads] showBanner skipped — not native or init failed");
    return;
  }
  if (bannerShown) return;
  try {
    const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: AD_TESTING,
    });
    bannerShown = true;
    console.log("[ads] banner shown");
  } catch (err) {
    console.warn("[ads] showBanner failed", err);
  }
}

export async function hideBanner(): Promise<void> {
  if (!isNative() || !bannerShown) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.hideBanner();
    await AdMob.removeBanner();
    bannerShown = false;
  } catch (err) {
    console.warn("[ads] hideBanner failed", err);
  }
}

function getLastInterstitialAt(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(LAST_INTERSTITIAL_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function setLastInterstitialAt(ts: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_INTERSTITIAL_KEY, String(ts));
  } catch {
    /* noop */
  }
}

export async function maybeShowInterstitial(): Promise<void> {
  if (!isNative()) return;
  const now = Date.now();
  const last = getLastInterstitialAt();
  if (now - last < INTERSTITIAL_MIN_INTERVAL_MS) return;

  setLastInterstitialAt(now);

  void (async () => {
    try {
      const ok = await ensureInit();
      if (!ok) return;
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.prepareInterstitial({
        adId: INTERSTITIAL_ID,
        isTesting: AD_TESTING,
      });
      await AdMob.showInterstitial();
      console.log("[ads] interstitial shown");
    } catch (err) {
      setLastInterstitialAt(last);
      console.warn("[ads] interstitial failed", err);
    }
  })();
}
