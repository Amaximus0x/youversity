import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.youversity.app',
  appName: 'YouVersity',
  webDir: 'build',
  server: {
    // Don't specify allowNavigation for mobile apps that need to work with the API
    // This allows the app to connect to any domain via fetch/XHR
    androidScheme: 'https',
    // Clear hostname to allow fetch requests to any domain
    hostname: ''
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
    }
  }
};

export default config; 