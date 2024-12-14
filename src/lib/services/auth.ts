import { GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '$lib/firebase';
import { goto } from '$app/navigation';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (callbackUrl?: string) => {
  try {
    const result = await signInWithPopup(auth, provider);
    
    if (callbackUrl) {
      window.location.href = callbackUrl;
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
    await goto('/');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string, callbackUrl?: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
    return result.user;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, callbackUrl?: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
    return result.user;
  } catch (error) {
    console.error('Error registering with email:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

