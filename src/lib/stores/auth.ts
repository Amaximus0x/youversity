import { writable, derived } from 'svelte/store';
import type { User } from 'firebase/auth';
import { auth } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '$lib/services/profile';
import { browser } from '$app/environment';

// Define a type for our user that includes additional fields
export interface ExtendedUser extends User {
  username?: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
  about?: string;
}

// Restore user from localStorage if available
const storedUser = browser ? localStorage.getItem('youversity_user') : null;
const initialUser = storedUser ? JSON.parse(storedUser) : null;

function createUserStore() {
  const { subscribe, set, update } = writable<ExtendedUser | null>(initialUser);

  return {
    subscribe,
    set: (newUser: ExtendedUser | null) => {
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
      if (currentUser) {
        try {
          // Force reload the current user first
          await currentUser.reload();
          
          const userProfile = await getUserProfile(currentUser.uid);
          console.log('Refreshing user store with profile:', userProfile);
          
          // Get the latest user data after reload
          const freshUser = auth.currentUser;
          
          const extendedUser: ExtendedUser = {
            ...(freshUser || currentUser),
            username: userProfile?.username || '',
            displayName: userProfile?.displayName || freshUser?.displayName || '',
            photoURL: userProfile?.photoURL || freshUser?.photoURL || '',
            email: freshUser?.email || currentUser.email || '',
            about: userProfile?.about || '',
            uid: currentUser.uid
          };
          
          console.log('Setting user store with extended user:', extendedUser);
          this.set(extendedUser);

          return extendedUser;
        } catch (error) {
          console.error('Error refreshing user profile:', error);
          this.set(currentUser as ExtendedUser);
        }
      } else {
        this.set(null);
      }
    }
  };
}

export const user = createUserStore();
export const isAuthenticated = derived(user, $user => $user !== null);

// Initialize auth state listener
if (typeof window !== 'undefined') {
  // Check localStorage first for quick restore
  if (initialUser) {
    console.log('Found user in localStorage, pre-loading auth state');
    user.set(initialUser);
  }
  
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      await user.refresh();
    } else {
      user.set(null);
    }
  });
} 