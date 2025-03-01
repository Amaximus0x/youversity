import { db } from '$lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, deleteDoc, query, getDocs, collection, where, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '$lib/firebase';
import { generateUsername } from '$lib/utils/username';

export interface UserProfile {
  username: string;
  displayName: string;
  email: string;
  photoURL: string;
  about?: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Generate a username if not provided
    const username = data.username || await generateUsername(data.displayName || '', data.email || '');
    
    // Create initial profile with required fields
    const initialProfile = {
      username,
      displayName: data.displayName || '',
      email: data.email || '',
      photoURL: data.photoURL || '',
      about: data.about || '',
      firstName: data.firstName || data.displayName?.split(' ')[0] || '',
      lastName: data.lastName || data.displayName?.split(' ').slice(1).join(' ') || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Use setDoc with merge option to handle both creation and updates
    await setDoc(userRef, initialProfile, { merge: true });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile: ' + (error as Error).message);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return userDoc.data() as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// First, define a type for the update data
type UpdateData = {
  [key: string]: string | Date | undefined;
};

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  try {
    // Initialize storage with the app instance
    const storage = getStorage(app);
    // Create a reference to the storage bucket
    const storageRef = ref(storage, `profile-images/${userId}`);
    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded file successfully');
    // Get the download URL for the uploaded file
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File available at', downloadURL);
    // Return the download URL
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
}

export async function getUserProfileByUsername(username: string) {
  try {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      uid: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error fetching user profile by username:', error);
    return null;
  }
} 