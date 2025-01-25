import { GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
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

interface UserData {
  firstName: string;
  lastName: string;
}

export async function registerWithEmail(
  email: string, 
  password: string, 
  redirectTo: string,
  userData: UserData
) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update the user profile with additional data
  await updateProfile(userCredential.user, {
    displayName: `${userData.firstName} ${userData.lastName}`
  });

  // You might want to store additional user data in Firestore here
  
  if (redirectTo) {
    goto(redirectTo);
  }
}

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

