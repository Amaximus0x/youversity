import { GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '$lib/firebase';
import { goto } from '$app/navigation';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (callbackUrl?: string) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const token = await result.user.getIdToken();
    
    // Store token in cookie
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    // Wait a brief moment for the cookie to be set
    await new Promise(resolve => setTimeout(resolve, 100));

    if (callbackUrl) {
      window.location.href = callbackUrl; // Use direct navigation instead of goto
    }
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    // Clear token cookie
    await fetch('/api/auth/session', { method: 'DELETE' });
    await goto('/');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, callbackUrl?: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    
    // Store token in cookie
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    // Wait a brief moment for the cookie to be set
    await new Promise(resolve => setTimeout(resolve, 100));

    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
    return result.user;
  } catch (error) {
    console.error('Error registering with email:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string, callbackUrl?: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    
    // Store token in cookie
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    // Wait a brief moment for the cookie to be set
    await new Promise(resolve => setTimeout(resolve, 100));

    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
    return result.user;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

export async function refreshUserToken() {
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

