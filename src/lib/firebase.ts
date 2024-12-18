import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase config
const missingEnvVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('Missing Firebase configuration variables:', missingEnvVars);
  throw new Error(`Missing required Firebase configuration: ${missingEnvVars.join(', ')}`);
}

console.log('Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: '***' // Hide API key in logs
});

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase Auth persistence enabled');
  })
  .catch((error) => {
    console.error('Auth persistence error:', error);
  });

// Firebase utility functions
export async function saveCourseToFirebase(userId: string, courseData: any) {
  try {
    const publicCourseRef = doc(collection(db, 'courses'));
    const courseId = publicCourseRef.id;

    // Add required metadata for public courses
    const courseWithMetadata = {
      ...courseData,
      createdAt: serverTimestamp(),
      id: courseId,
      createdBy: userId,
      userId,
      isPublic: false,  // Default to private
      views: 0,         // Required for orderBy
      likes: 0,
      updatedAt: serverTimestamp()
    };

    // Save to public courses collection
    await setDoc(publicCourseRef, courseWithMetadata);

    // Save reference to user's courses collection
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    await setDoc(userCourseRef, courseWithMetadata);

    // Verify the course was saved by attempting to read it
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      const courseDoc = await getDoc(publicCourseRef);
      if (courseDoc.exists()) {
        return courseId;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
    }

    throw new Error('Course saved but not immediately available');
  } catch (error) {
    console.error('Error saving course:', error);
    throw error;
  }
}

export async function getUserCourses(userId: string) {
  try {
    const q = query(
      collection(db, 'courses'), 
      where('createdBy', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user courses:', error);
    throw new Error('Failed to fetch courses');
  }
}

export async function getUserCourse(userId: string, courseId: string) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (!courseSnap.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseSnap.data();
    if (courseData.userId !== userId) {
      throw new Error('Unauthorized access to course');
    }

    return {
      id: courseSnap.id,
      ...courseData
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    throw new Error('Failed to fetch course');
  }
}

export async function updateUserCourse(userId: string, courseId: string, courseData: any) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    
    if (!courseSnap.exists()) {
      throw new Error('Course not found');
    }

    if (courseSnap.data().userId !== userId) {
      throw new Error('Unauthorized access to course');
    }

    await updateDoc(courseRef, courseData);
  } catch (error) {
    console.error('Error updating course:', error);
    throw new Error('Failed to update course');
  }
}

export async function updateModuleProgress(
  userId: string, 
  courseId: string, 
  moduleIndex: number, 
  progress: ModuleProgress
) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const progressRef = doc(db, 'courseProgress', `${userId}_${courseId}`);
    
    const progressSnap = await getDoc(progressRef);
    let currentProgress = progressSnap.data() || {
      userId,
      courseId,
      moduleProgress: [],
      startDate: new Date(),
      lastAccessDate: new Date()
    };

    currentProgress.moduleProgress[moduleIndex] = progress;
    currentProgress.lastAccessDate = new Date();
    
    await setDoc(progressRef, currentProgress);
    
    return currentProgress;
  } catch (error) {
    console.error('Error updating module progress:', error);
    throw new Error('Failed to update module progress');
  }
}

export async function getCourseProgress(userId: string, courseId: string) {
  try {
    const progressRef = doc(db, 'courseProgress', `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);
    
    if (!progressSnap.exists()) {
      const initialProgress = {
        userId,
        courseId,
        moduleProgress: [],
        lastAccessedModule: 0,
        startDate: new Date(),
        lastAccessDate: new Date()
      };
      
      // Create initial progress document
      await setDoc(progressRef, initialProgress);
      return initialProgress;
    }
    
    return progressSnap.data();
  } catch (error) {
    console.error('Error fetching course progress:', error);
    throw new Error('Failed to fetch course progress');
  }
}

export async function getSharedCourse(courseId: string) {
  try {
    console.log('Fetching shared course:', courseId);
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    console.log('Course exists:', courseDoc.exists());
    
    if (courseDoc.exists()) {
      const data = courseDoc.data();
      console.log('Course data:', data);
      return {
        ...data,
        id: courseDoc.id,
        createdAt: data.createdAt?.toDate?.() || null
      } as FinalCourseStructure & { id: string };
    }
    console.log('Course not found');
    return null;
  } catch (error) {
    console.error('Error getting shared course:', error);
    throw error;
  }
}

export async function getPublicCourses() {
  try {
    console.log('Fetching public courses...');
    const q = query(
      collection(db, 'courses'),
      where('isPublic', '==', true),
      orderBy('views', 'desc'),
      limit(6)
    );
    console.log('Query created:', q);
    const querySnapshot = await getDocs(q);
    console.log('Query results:', querySnapshot.size, 'documents found');
    
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Mapped courses:', courses);
    return courses;
  } catch (error) {
    console.error('Error fetching public courses:', error);
    throw new Error('Failed to fetch public courses');
  }
}

export async function toggleCoursePrivacy(courseId: string, isPublic: boolean) {
  try {
    console.log('Toggling course privacy:', courseId, 'to', isPublic);
    const courseRef = doc(db, 'courses', courseId);
    const before = await getDoc(courseRef);
    console.log('Course before update:', before.data());
    
    // Ensure views field exists when making public
    const updateData: any = {
      isPublic,
      updatedAt: serverTimestamp()
    };
    
    if (isPublic && !before.data()?.views) {
      updateData.views = 0;
    }
    
    await updateDoc(courseRef, updateData);
    
    const after = await getDoc(courseRef);
    console.log('Course after update:', after.data());
    return true;
  } catch (error) {
    console.error('Error toggling course privacy:', error);
    throw new Error('Failed to update course privacy');
  }
}