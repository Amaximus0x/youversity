import { GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '$lib/firebase';
import { goto } from '$app/navigation';
import { createUserProfile, getUserProfile } from './profile';
import type { UserProfile } from './profile';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

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
    // Try to clean up any existing data for this email if it exists
    try {
      // Check if there's an existing profile with this email
      const existingProfiles = await getUserProfileByEmail(email);
      
      // If found, clean up the old data
      if (existingProfiles) {
        const usernameRef = doc(db, 'usernames', existingProfiles.username);
        await deleteDoc(usernameRef);
        
        const userRef = doc(db, 'users', existingProfiles.userId);
        await deleteDoc(userRef);
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
      // Continue with registration even if cleanup fails
    }

    // Proceed with new user registration
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    try {
      // Create user profile for email registration
      await createUserProfile(result.user.uid, {
        displayName: '',
        email: result.user.email || '',
        photoURL: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (profileError) {
      // If profile creation fails, delete the auth user to maintain consistency
      try {
        await result.user.delete();
      } catch (deleteError) {
        console.error('Error deleting auth user after profile creation failed:', deleteError);
      }
      throw profileError;
    }
    
    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
    return result.user;
  } catch (error) {
    console.error('Error registering with email:', error);
    // Add more specific error handling
    if (error instanceof Error) {
      if (error.message.includes('auth/email-already-in-use')) {
        throw new Error('This email is already registered. Please try signing in instead.');
      }
      // Pass through the original error message for other cases
      throw error;
    }
    throw new Error('Registration failed. Please try again.');
  }
};

// Helper function to find a user profile by email
async function getUserProfileByEmail(email: string): Promise<(UserProfile & { userId: string }) | null> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'users'), where('email', '==', email))
    );
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        userId: doc.id,
        ...(doc.data() as UserProfile)
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding user profile by email:', error);
    return null;
  }
}

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

