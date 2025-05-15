import { browser } from '$app/environment';
import { Capacitor } from '@capacitor/core';

// Check if running on a mobile device via Capacitor
const isMobileApp = Capacitor.isNativePlatform();
const getPlatform = () => Capacitor.getPlatform();

// Define the base URLs
const WEB_API_URL = 'https://www.youversity.io'; // Your production server
const LOCAL_DEV_URL = 'http://localhost:3000'; // For local web development

// Define config based on platform
export const API_CONFIG = {
  // Use the production URL when on mobile or in production web
  baseURL: isMobileApp ? WEB_API_URL : (import.meta.env.PROD ? WEB_API_URL : LOCAL_DEV_URL),
  
  // Define fetch options based on platform
  fetchOptions: {
    // Use 'cors' mode when on mobile, 'same-origin' on web
    mode: isMobileApp ? 'cors' as RequestMode : 'same-origin' as RequestMode,
    
    // Always include credentials
    credentials: 'include' as RequestCredentials,
    
    // Headers that should be included in all requests
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  
  // Additional platform info
  isNative: isMobileApp,
  platform: getPlatform()
};

// Helper to get fetch options with additional headers/options
export const getFetchOptions = (options: { headers?: Record<string, string>; [key: string]: any } = {}) => {
  return {
    ...API_CONFIG.fetchOptions,
    ...options,
    headers: {
      ...API_CONFIG.fetchOptions.headers,
      ...(options.headers || {})
    }
  };
};
