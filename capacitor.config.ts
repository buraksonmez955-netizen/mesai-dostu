import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mesaidefteri.app',
  appName: 'Mesai Defteri',
  webDir: 'dist/client',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      // Native splash 2 sn görünür kalır; React tarafında ayrı bir splash yok.
      launchShowDuration: 2000,
      launchAutoHide: false, // main.tsx içinde manuel hide() ile garanti süre.
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    // 'native' mode bazı Android 13/14 WebView'lerinde input focus'unu kilitliyor.
    // 'body' modu sayfa gövdesini yeniden boyutlandırır, sayfa donmaz.
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
