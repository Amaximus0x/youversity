import { writable, derived } from 'svelte/store';
import type { User } from 'firebase/auth';
import { auth } from '$lib/firebase';

export const user = writable<User | null>(null);
export const isAuthenticated = derived(user, $user => !!$user);

export async function refreshToken() {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(true);
      await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

// Set up auth state listener with token refresh
auth.onAuthStateChanged(async (newUser) => {
  user.set(newUser);
  if (newUser) {
    await refreshToken();
  }
}); 