import { GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '$lib/firebase';
import { goto } from '$app/navigation';
import { createUserProfile, getUserProfile } from './profile';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (callbackUrl?: string) => {
  try {
    const result = await signInWithPopup(auth, provider);
    
    // Check if user profile exists, if not create one
    const existingProfile = await getUserProfile(result.user.uid);
    if (!existingProfile) {
      await createUserProfile(result.user.uid, {
        displayName: result.user.displayName || '',
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string, callbackUrl?: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile for email registration
    await createUserProfile(result.user.uid, {
      displayName: '',
      email: result.user.email || '',
      photoURL: '',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
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
    
    // Check if user profile exists, if not create one
    const existingProfile = await getUserProfile(result.user.uid);
    if (!existingProfile) {
      await createUserProfile(result.user.uid, {
        displayName: result.user.displayName || '',
        email: result.user.email || '',
        photoURL: result.user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
    return result.user;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    await goto('/login');
  } catch (error) {
    console.error('Error signing out:', error);
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

