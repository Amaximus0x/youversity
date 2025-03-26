import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { browser } from '$app/environment';
import { firebaseInitialized, setAuthTokenCookie } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '$lib/services/profile';

// Define a type for our user that includes additional fields
export interface ExtendedUser extends User {
  username?: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
  about?: string;
}

// Create the base store with initial value
export const user = writable<ExtendedUser | null>(null);

// Define loading state
export const isAuthLoading = writable(true);

// Create authentication status store
export const isAuthenticated = writable(false);

// Subscribe to user store to update authentication status
user.subscribe(($user) => {
  isAuthenticated.set($user !== null);
});

// Initialize auth state listener
if (browser) {
  // Wait for Firebase to be initialized before setting up auth listener
  firebaseInitialized.then(({ auth }) => {
    // Restore user from localStorage if available
    const storedUser = localStorage.getItem('youversity_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        user.set(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('youversity_user');
      }
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Get user profile from Firestore
          const userProfile = await getUserProfile(currentUser.uid);
          
          // Create extended user with combined data
          const extendedUser: ExtendedUser = {
            ...currentUser,
            username: userProfile?.username || '',
            displayName: userProfile?.displayName || currentUser.displayName || '',
            photoURL: userProfile?.photoURL || currentUser.photoURL || '',
            email: currentUser.email || '',
            about: userProfile?.about || '',
            uid: currentUser.uid
          };

          // Update user store
          user.set(extendedUser);
          
          // Store user data in localStorage
          localStorage.setItem('youversity_user', JSON.stringify(extendedUser));
          
          // Set auth token cookie
          await setAuthTokenCookie();
        } catch (error) {
          console.error('Error updating user profile:', error);
          // If there's an error, still set the basic user data
          user.set(currentUser as ExtendedUser);
        }
      } else {
        // Clear user store and localStorage
        user.set(null);
        localStorage.removeItem('youversity_user');
      }
      isAuthLoading.set(false);
    });

    // Clean up listener on app unmount
    window.addEventListener('unload', () => {
      unsubscribe();
    });
  }).catch(error => {
    console.error('Error initializing auth store:', error);
    isAuthLoading.set(false);
  });
} else {
  // For SSR, set loading to false
  isAuthLoading.set(false);
}

// Export the stores
export { user as default }; 