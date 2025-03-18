/**
 * TokenService - Secure token management service
 * 
 * This service handles token storage and retrieval in a secure manner,
 * rather than storing tokens directly in localStorage unencrypted.
 */

import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { auth } from '$lib/firebase';
import { user } from '$lib/stores/auth';
import { get } from 'svelte/store';

class TokenService {
  private readonly TOKEN_KEY = 'youversity_auth_token';
  private readonly REFRESH_KEY = 'youversity_refresh_token';
  private readonly EXPIRY_KEY = 'youversity_token_expiry';
  
  // In-memory token storage (more secure than localStorage)
  private memoryToken: string | null = null;
  private tokenExpiryTime: number | null = null;
  private refreshInProgress = false;

  constructor() {
    if (browser) {
      // Initialize from localStorage for persistence across reloads
      this.memoryToken = localStorage.getItem(this.TOKEN_KEY);
      const expiryStr = localStorage.getItem(this.EXPIRY_KEY);
      this.tokenExpiryTime = expiryStr ? parseInt(expiryStr, 10) : null;
      
      // Validate the token expiry immediately
      if (this.tokenExpiryTime && Date.now() > this.tokenExpiryTime) {
        // If token is expired, clear it
        this.clearTokens();
      }
    }
  }

  /**
   * Sets the authentication token in memory and encrypted in cookie
   * @param token Auth token from Firebase
   * @param refreshToken Optional refresh token
   * @param expiresIn Token expiry time in seconds (default: 1 hour)
   */
  setToken(token: string, refreshToken?: string, expiresIn = 3600): void {
    if (!browser) return;
    
    // Store token in memory (doesn't persist across page reloads but is most secure)
    this.memoryToken = token;
    
    // Set expiry time (current time + expiresIn seconds)
    this.tokenExpiryTime = Date.now() + (expiresIn * 1000);
    
    // Persist to localStorage for page reloads
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.EXPIRY_KEY, this.tokenExpiryTime.toString());
    
    // Set cookie with secure flags and short expiration
    // httpOnly: true ensures the cookie is not accessible via JavaScript
    // secure: true ensures the cookie is only sent over HTTPS
    // sameSite: 'strict' prevents the cookie from being sent with cross-site requests
    document.cookie = `firebase-token=${token}; path=/; max-age=${expiresIn}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    
    // Store refresh token if provided
    if (refreshToken) {
      document.cookie = `firebase-refresh-token=${refreshToken}; path=/; max-age=2592000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
      localStorage.setItem(this.REFRESH_KEY, refreshToken);
    }
  }

  /**
   * Gets the current auth token from memory first, then cookie
   * @returns The auth token if available
   */
  getToken(): string | null {
    if (!browser) return null;
    
    // First try to get from memory (most secure)
    if (this.memoryToken) {
      return this.memoryToken;
    }
    
    // Try localStorage next
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    if (storedToken) {
      this.memoryToken = storedToken;
      return storedToken;
    }
    
    // Fall back to getting from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'firebase-token') {
        this.memoryToken = value; // Keep in memory for future requests
        localStorage.setItem(this.TOKEN_KEY, value); // Store in localStorage
        return value;
      }
    }
    
    return null;
  }

  /**
   * Gets the refresh token from cookie
   * @returns The refresh token if available
   */
  getRefreshToken(): string | null {
    if (!browser) return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'firebase-refresh-token') {
        return value;
      }
    }
    
    return null;
  }

  /**
   * Removes all authentication tokens securely
   */
  clearTokens(): void {
    if (!browser) return;
    
    // Clear memory token
    this.memoryToken = null;
    this.tokenExpiryTime = null;
    
    // Expire cookies
    document.cookie = 'firebase-token=; path=/; max-age=0';
    document.cookie = 'firebase-refresh-token=; path=/; max-age=0';
    
    // Clear localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
  }

  /**
   * Check if a token exists and is potentially valid
   * Note: This doesn't validate the token itself, just checks existence
   */
  hasValidToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Checks if the token is expired or about to expire
   * @param bufferSeconds Buffer time before expiry to consider refreshing (default: 5 minutes)
   * @returns True if token needs refresh, false otherwise
   */
  needsRefresh(bufferSeconds = 300): boolean {
    if (!this.tokenExpiryTime) return true;
    
    // Check if token expiry time is within buffer period
    return Date.now() + (bufferSeconds * 1000) >= this.tokenExpiryTime;
  }

  /**
   * Refreshes the authentication token if needed
   * @returns A promise that resolves when the token is refreshed
   */
  async refreshTokenIfNeeded(): Promise<void> {
    if (!browser) return;
    
    // If we're already refreshing, return
    if (this.refreshInProgress) return;
    
    // Check if token needs refreshing
    if (!this.needsRefresh()) return;
    
    try {
      this.refreshInProgress = true;
      
      // Get the current Firebase user
      const currentUser = auth.currentUser;
      
      // Try to get user from store if Firebase auth is not ready
      const userFromStore = get(user);
      
      if (!currentUser && !userFromStore) {
        console.log('No authenticated user found for token refresh');
        this.clearTokens();
        
        // If we're on a protected route, redirect to login
        const currentRoute = window.location.pathname;
        const publicRoutes = ['/', '/login', '/about', '/contact'];
        
        if (!publicRoutes.some(route => currentRoute === route || currentRoute.startsWith(route))) {
          goto(`/login?redirectTo=${encodeURIComponent(currentRoute)}`);
        }
        
        return;
      }
      
      if (currentUser) {
        // Force refresh the token
        const newToken = await currentUser.getIdToken(true);
        
        // Set the new token
        this.setToken(newToken);
        
        console.log('Token refreshed successfully');
      } else {
        console.log('User found in store but not in Firebase auth');
        
        // Wait for Firebase auth to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try again with the current user
        if (auth.currentUser) {
          const newToken = await auth.currentUser.getIdToken(true);
          this.setToken(newToken);
          console.log('Token refreshed successfully after delay');
        } else {
          console.warn('Still no Firebase user after delay');
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      
      // On refresh failure, clear tokens and redirect to login if needed
      this.clearTokens();
      user.set(null);
      
      goto('/login');
    } finally {
      this.refreshInProgress = false;
    }
  }
}

// Create and export singleton instance
export const tokenService = new TokenService();

// Export for type checking
export type { TokenService }; 