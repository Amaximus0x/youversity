import { writable, derived } from 'svelte/store';
import type { User } from 'firebase/auth';
import { auth } from '$lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile } from '$lib/services/profile';

// Define a type for our user that includes additional fields
export interface ExtendedUser extends User {
  username?: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

function createUserStore() {
  const { subscribe, set, update } = writable<ExtendedUser | null>(null);

  return {
    subscribe,
    set,
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
            uid: currentUser.uid
          };
          
          console.log('Setting user store with extended user:', extendedUser);
          set(extendedUser);

          return extendedUser;
        } catch (error) {
          console.error('Error refreshing user profile:', error);
          set(currentUser as ExtendedUser);
        }
      } else {
        set(null);
      }
    }
  };
}

export const user = createUserStore();
export const isAuthenticated = derived(user, $user => $user !== null);

// Initialize auth state listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      await user.refresh();
    } else {
      user.set(null);
    }
  });
} 