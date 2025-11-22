import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.save.app',
  appName: 'S.A.V.E',
  webDir: 'www',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3880ff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    }
  }
};

export default config;
