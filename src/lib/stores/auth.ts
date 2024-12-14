import { writable, derived } from 'svelte/store';
import type { User } from 'firebase/auth';
import { auth } from '$lib/firebase';

export const user = writable<User | null>(null);
export const isAuthenticated = derived(user, $user => !!$user);

// Set up auth state listener
auth.onAuthStateChanged((newUser) => {
  user.set(newUser);
}); 