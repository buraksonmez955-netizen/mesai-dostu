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
      launchShowDuration: 1300,
      launchAutoHide: false,
      launchFadeOutDuration: 180,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    Keyboard: {
      resize: 'native',
      resizeOnFullScreen: false,
    },
  },
};

export default config;
