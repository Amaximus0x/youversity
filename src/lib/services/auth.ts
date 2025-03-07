import { GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth';
import { auth, db } from '$lib/firebase';
import { goto } from '$app/navigation';
import { createUserProfile, getUserProfile } from './profile';
import type { UserProfile } from './profile';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch, getDoc, setDoc } from 'firebase/firestore';
import { NotificationService } from './notificationService';

const provider = new GoogleAuthProvider();

export const signInWithGoogle = async (callbackUrl?: string) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if this is a new user by looking up their profile
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isNewUser = !userDoc.exists();

    // Create or update user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      username: user.email?.split('@')[0],
      createdAt: isNewUser ? new Date() : userDoc.data()?.createdAt,
      updatedAt: new Date()
    }, { merge: true });

    // Create user profile if it doesn't exist
    const existingProfile = await getUserProfile(user.uid);
    if (!existingProfile) {
      await createUserProfile(user.uid, {
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create welcome notification for new users
      if (isNewUser) {
        await NotificationService.createWelcomeNotification(user.uid);
        await NotificationService.createFirstCourseNotification(user.uid);
      }
    }

    if (callbackUrl && callbackUrl !== '/') {
      window.location.href = callbackUrl;
    } else {
      window.location.href = '/dashboard';
    }
    return user;
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
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user profile with additional data
    await updateProfile(user, {
      displayName: `${userData.firstName} ${userData.lastName}`
    });

    // Create user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: `${userData.firstName} ${userData.lastName}`,
      username: email.split('@')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create user profile
    await createUserProfile(user.uid, {
      displayName: `${userData.firstName} ${userData.lastName}`,
      email: email,
      photoURL: '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create welcome notification
    await NotificationService.createWelcomeNotification(user.uid);
    await NotificationService.createFirstCourseNotification(user.uid);

    // Redirect to the specified URL or dashboard
    if (redirectTo && redirectTo !== '/') {
      window.location.href = redirectTo;
    } else {
      window.location.href = '/dashboard';
    }

    return user;
  } catch (error) {
    console.error('Error registering with email:', error);
    throw error;
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
    
    if (callbackUrl && callbackUrl !== '/') {
      window.location.href = callbackUrl;
    } else {
      window.location.href = '/dashboard';
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

// Add this function to handle re-authentication
export async function reauthenticateUser(password?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('No user found');

  try {
    if (user.providerData[0]?.providerId === 'google.com') {
      // Re-authenticate with Google
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    } else {
      // Re-authenticate with email/password
      if (!password) throw new Error('Password required');
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
    }
    return true;
  } catch (error) {
    console.error('Re-authentication error:', error);
    throw error;
  }
}

// Update the deleteUserAccount function
export async function deleteUserAccount(userId: string, password?: string) {
  try {
    // First re-authenticate the user
    await reauthenticateUser(password);

    const batch = writeBatch(db);
    
    // Delete user profile
    const userRef = doc(db, 'users', userId);
    batch.delete(userRef);

    // Delete user's courses
    const userCoursesRef = collection(db, `users/${userId}/courses`);
    const userCoursesSnapshot = await getDocs(userCoursesRef);
    userCoursesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's bookmarks
    const userBookmarksRef = collection(db, `users/${userId}/bookmarks`);
    const userBookmarksSnapshot = await getDocs(userBookmarksRef);
    userBookmarksSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's likes
    const userLikesRef = collection(db, `users/${userId}/likes`);
    const userLikesSnapshot = await getDocs(userLikesRef);
    userLikesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete enrollments
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('userId', '==', userId)
    );
    const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
    enrollmentsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete username reservation
    const usernameQuery = query(
      collection(db, 'usernames'),
      where('userId', '==', userId)
    );
    const usernameSnapshot = await getDocs(usernameQuery);
    usernameSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete search history
    const searchHistoryQuery = query(
      collection(db, 'searchHistory'),
      where('userId', '==', userId)
    );
    const searchHistorySnapshot = await getDocs(searchHistoryQuery);
    searchHistorySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    

    // Commit the batch
    await batch.commit();

    // Delete the Firebase Auth account
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.delete();
    }

    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw new Error('Failed to delete account');
  }
}

