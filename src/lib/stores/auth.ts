import { writable, derived } from 'svelte/store';
import type { User } from 'firebase/auth';
import { auth } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '$lib/services/profile';
import { browser } from '$app/environment';
import { setAuthTokenCookie, refreshToken } from '$lib/firebase';

// Define a type for our user that includes additional fields
export interface ExtendedUser extends User {
  username?: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
  about?: string;
}

// Auth status enum for better type safety
export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated'
}

// Restore user from localStorage if available
const storedUser = browser ? localStorage.getItem('youversity_user') : null;
const initialUser = storedUser ? JSON.parse(storedUser) : null;

function createUserStore() {
  // Create the base store with initial value (may be null)
  const { subscribe, set, update } = writable<ExtendedUser | null>(initialUser);
  
  // Create the auth status store - starts with LOADING if we have a stored user
  const authStatus = writable<AuthStatus>(
    initialUser ? AuthStatus.LOADING : AuthStatus.UNAUTHENTICATED
  );

  return {
    subscribe,
    authStatus: {
      subscribe: authStatus.subscribe
    },
    set: (newUser: ExtendedUser | null) => {
      // Update auth status first
      if (newUser) {
        authStatus.set(AuthStatus.AUTHENTICATED);
      } else {
        authStatus.set(AuthStatus.UNAUTHENTICATED);
      }
      
      // Save to localStorage if in browser
      if (browser) {
        if (newUser) {
          localStorage.setItem('youversity_user', JSON.stringify(newUser));
        } else {
          localStorage.removeItem('youversity_user');
        }
      }
      set(newUser);
    },
    update,
    
    // Add a method to refresh the user data
    async refresh() {
      const currentUser = auth.currentUser;
      
      // Mark as loading during refresh
      authStatus.set(AuthStatus.LOADING);
      
      if (currentUser) {
        try {
          // Force reload the current user's data from Firebase Auth
          await currentUser.reload();
          
          // Get the user profile from Firestore
          const userProfile = await getUserProfile(currentUser.uid);
          
          // Get fresh user data after reload
          const freshUser = auth.currentUser; // This might have changed after reload
          
          // Create extended user with combined data
          const extendedUser: ExtendedUser = {
            ...(freshUser || currentUser),
            username: userProfile?.username || '',
            displayName: userProfile?.displayName || freshUser?.displayName || '',
            photoURL: userProfile?.photoURL || freshUser?.photoURL || '',
            email: freshUser?.email || currentUser.email || '',
            about: userProfile?.about || '',
            uid: currentUser.uid
          };
          
          // Update the Firebase token cookie
          await setAuthTokenCookie();
          
          // Update the store with new user data
          this.set(extendedUser);
          return extendedUser;
        } catch (error) {
          console.error('Error refreshing user profile:', error);
          
          // If refresh fails but we still have a current user, use that
          if (auth.currentUser) {
            this.set(auth.currentUser as ExtendedUser);
            return auth.currentUser as ExtendedUser;
          } else {
            // User is no longer authenticated
            this.set(null);
            return null;
          }
        }
      } else {
        // User is not authenticated
        this.set(null);
        return null;
      }
    },
    
    // Method to force token refresh
    async refreshToken() {
      try {
        // If not authenticated, nothing to do
        if (!auth.currentUser) {
          return null;
        }
        
        // Get fresh token
        const newToken = await refreshToken();
        
        // Also refresh user data
        await this.refresh();
        
        return newToken;
      } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
      }
    }
  };
}

export const user = createUserStore();
export const isAuthenticated = derived(
  [user, user.authStatus], 
  ([$user, $authStatus]) => $authStatus === AuthStatus.AUTHENTICATED
);
export const isAuthLoading = derived(
  user.authStatus,
  ($authStatus) => $authStatus === AuthStatus.LOADING
);

// Initialize auth state listener
if (browser) {
  // Check localStorage first for quick restore
  if (initialUser) {
    console.log('Found user in localStorage, pre-loading auth state');
    user.set(initialUser);
  }
  
  // Set up Firebase auth state listener
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // User is logged in, refresh full profile
      await user.refresh();
    } else {
      // User is logged out
      user.set(null);
    }
  });
  
  // Set up token refresh interval (every 30 minutes)
  if (initialUser) {
    setInterval(async () => {
      if (auth.currentUser) {
        try {
          await user.refreshToken();
        } catch (err) {
          console.error('Scheduled token refresh failed:', err);
        }
      }
    }, 30 * 60 * 1000); // 30 minutes
  }
} 