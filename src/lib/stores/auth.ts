import { writable } from 'svelte/store';
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

// Create stores
export const user = writable<ExtendedUser | null>(null);
export const isAuthenticated = writable<boolean>(false);

// Initialize auth state listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Fetch the user's profile from Firestore
        const userProfile = await getUserProfile(firebaseUser.uid);
        
        // Cast the Firebase user to our ExtendedUser type and include Firestore profile data
        const extendedUser: ExtendedUser = {
          ...firebaseUser,
          username: userProfile?.username || '',
          displayName: userProfile?.displayName || firebaseUser.displayName,
          photoURL: userProfile?.photoURL || firebaseUser.photoURL,
        };
        
        user.set(extendedUser);
        isAuthenticated.set(true);
        
        console.log('User profile loaded:', {
          username: extendedUser.username,
          displayName: extendedUser.displayName,
          email: extendedUser.email
        });
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Still set the basic Firebase user if profile fetch fails
        user.set(firebaseUser as ExtendedUser);
        isAuthenticated.set(true);
      }
    } else {
      user.set(null);
      isAuthenticated.set(false);
    }
  });
} 