import { firebaseInitialized } from '$lib/firebase';
import { signInWithCredential, GoogleAuthProvider, OAuthCredential } from 'firebase/auth';
import type { User } from 'firebase/auth';

/**
 * Sign in with Google using Capacitor Firebase Authentication
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    // Dynamic import to avoid errors when not on native platform
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication').catch(() => {
      throw new Error('Native authentication not available on this platform');
    });
    
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
    
    // Wait for Firebase to be initialized
    const { auth } = await firebaseInitialized;
    
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
    // Try to import and use native sign out if available
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      await FirebaseAuthentication.signOut();
    } catch {
      // Native auth not available, continue with web sign out
    }
    
    // Wait for Firebase to be initialized
    const { auth } = await firebaseInitialized;
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
  const { auth } = await firebaseInitialized;
  return auth.currentUser;
} 