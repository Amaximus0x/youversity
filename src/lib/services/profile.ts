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

export async function createUserProfile(userId: string, initialData: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Generate a unique username
    const username = await generateUsername(initialData.displayName || '', initialData.email || '');
    
    // Create the profile data with server timestamps
    const profileData = {
      username,
      displayName: initialData.displayName || '',
      email: initialData.email || '',
      photoURL: initialData.photoURL || '',
      about: initialData.about || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      // First try to reserve the username
      const usernameRef = doc(db, 'usernames', username);
      await setDoc(usernameRef, {
        userId,
        createdAt: serverTimestamp()
      });

      // If username reservation succeeds, create the user profile
      await setDoc(userRef, profileData);
    } catch (error) {
      // If username reservation fails, try to clean up
      try {
        const usernameRef = doc(db, 'usernames', username);
        await deleteDoc(usernameRef);
      } catch (cleanupError) {
        console.error('Error cleaning up username after failure:', cleanupError);
      }
      throw error;
    }

    return {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    } as UserProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
    throw new Error('Failed to create user profile');
  }
}

export async function getUserProfile(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      // Convert Firestore Timestamp to Date and ensure all fields are present
      const data = userDoc.data();
      return {
        ...data,
        photoURL: data.photoURL || '',  // Ensure photoURL is always returned
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// First, define a type for the update data
type UpdateData = {
  [key: string]: string | Date | undefined;
};

export async function updateUserProfile(userId: string, data: Partial<UserProfile>) {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Get current user data first
    const currentUserDoc = await getDoc(userRef);
    const currentData = currentUserDoc.data();

    // Create update object with all required fields
    const updateData = {
      displayName: data.displayName || currentData?.displayName || '',
      photoURL: data.photoURL || '',  // Don't fallback to current photoURL to allow deletion
      username: data.username || currentData?.username || '',
      email: data.email || currentData?.email || '',
      about: data.about || currentData?.about || '',
      updatedAt: new Date()
    };

    console.log('Updating user profile with data:', updateData);

    // Update the user document
    await updateDoc(userRef, updateData);
    
    // Update username if changed
    if (data.username && data.username !== currentData?.username) {
      const usernameRef = doc(db, 'usernames', data.username);
      await setDoc(usernameRef, {
        userId: userId,
        createdAt: new Date()
      });
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