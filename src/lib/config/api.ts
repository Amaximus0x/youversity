import { Capacitor } from '@capacitor/core'; // Import Capacitor

// API Configuration for the application

/**
 * Base configuration for API endpoints
 */
export const API_CONFIG = {
  // Base URL for API requests
  baseURL: Capacitor.isNativePlatform() 
    ? 'https://www.youversity.io' 
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
  
  // API version
  version: 'v1',
  
  // Timeout in milliseconds
  timeout: 30000,

  // Utility to check if running in a native Capacitor environment
  isNative: Capacitor.isNativePlatform()
};

/**
 * Get fetch options with appropriate headers for API requests
 */
export function getFetchOptions(options: RequestInit = {}): RequestInit {
  return {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    },
    ...options
  };
} 

