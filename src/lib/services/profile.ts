import { db } from '$lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '$lib/firebase';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  dateOfBirth?: string;
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
      dateOfBirth: initialData.dateOfBirth || '',
      gender: initialData.gender || '',
      country: initialData.country || '',
      phoneNumber: initialData.phoneNumber || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Convert dates to timestamps
    const profileData = {
      ...profile,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };

    await setDoc(userRef, profileData);
    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    
    // Convert Firestore Timestamps to Dates
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    const updateData: Partial<UserProfile> & { updatedAt: Date } = {
      ...updates,
      updatedAt: new Date()
    };

    if (!userDoc.exists()) {
      // If document doesn't exist, create it
      await setDoc(userRef, {
        ...updateData,
        createdAt: new Date(),
        email: updates.email || '',
        displayName: updates.displayName || '',
        photoURL: updates.photoURL || ''
      });
    } else {
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(userRef, updateData);
    }

    return updateData;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
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