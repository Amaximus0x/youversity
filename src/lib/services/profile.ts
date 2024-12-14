import { db } from '$lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  nickName?: string;
  gender?: string;
  country?: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createUserProfile(userId: string, initialData: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', userId);
    const profile: UserProfile = {
      displayName: initialData.displayName || '',
      email: initialData.email || '',
      photoURL: initialData.photoURL || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...initialData
    };

    await setDoc(userRef, profile);
    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
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
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', userId);
    const updatedData = {
      ...updates,
      updatedAt: new Date()
    };

    await updateDoc(userRef, updatedData);
    return updatedData;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, `profile-images/${userId}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user profile with new photo URL
    await updateUserProfile(userId, { photoURL: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload profile image');
  }
} 