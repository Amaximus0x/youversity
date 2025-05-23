import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youversity.app',
  appName: 'YouVersity',
  webDir: 'build',
  server: {
    // For Android, we need to use a valid URL structure
    androidScheme: 'https',
    // Use 'localhost' for local web content instead of empty string
    hostname: 'localhost',
    // Set this to true to load from the built web directory
    iosScheme: 'ionic',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#1E3443",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large",
      spinnerColor: "#FFFFFF",
      splashFullScreen: true,
      splashImmersive: true
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    }
  }
};

export default config;
