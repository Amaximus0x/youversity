import { browser } from '$app/environment';
import { Capacitor } from '@capacitor/core';

const getPlatform = () => {
  if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform) {
    return Capacitor.getPlatform();
  }
  return 'web';
};

const isNative = getPlatform() === 'android' || getPlatform() === 'ios';

// API URLs for different environments
const API_URLS = {
  development: 'http://localhost:5173',
  production: 'https://youversity-kt23syhg2-derevyan-gmailcoms-projects.vercel.app',
  // Add other environments as needed
};

// Get the current environment
const getEnvironment = () => {
  if (browser) {
    if (window.location.hostname === 'localhost') return 'development';
    return 'production';
  }
  return 'production';
};

// Export the API configuration
export const API_CONFIG = {
  baseURL: API_URLS[getEnvironment()],
  isNative,
  platform: getPlatform(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
}; 