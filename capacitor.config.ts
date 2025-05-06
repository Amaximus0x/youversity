import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youversity.app',
  appName: 'Youversity',
  webDir: 'build',
  server: {
    androidScheme: 'http',
    iosScheme: 'http',
    hostname: 'localhost',
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#EE434A",
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
