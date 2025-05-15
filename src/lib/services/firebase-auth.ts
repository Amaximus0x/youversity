import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '$lib/firebase';
import { signInWithCredential, GoogleAuthProvider, OAuthCredential } from 'firebase/auth';
import type { User } from 'firebase/auth';

/**
 * Sign in with Google using Capacitor Firebase Authentication
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    // Sign in with Google on the native layer
    const result = await FirebaseAuthentication.signInWithGoogle();
    
    if (!result.credential) {
      throw new Error('No credential returned from Google Sign In');
    }
    
    // Get the OAuth credential for Firebase
    const credential: OAuthCredential = GoogleAuthProvider.credential(
      result.credential?.idToken,
      result.credential?.accessToken
    );
    
    // Sign in to Firebase with the Google credential
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Sign out from Firebase and native authentication
 */
export async function signOut(): Promise<void> {
  try {
    await FirebaseAuthentication.signOut();
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get the current authentication state
 */
export async function getCurrentUser(): Promise<User | null> {
  return auth.currentUser;
} 