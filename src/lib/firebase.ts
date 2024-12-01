import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAOzl4NcFW95BEhRw-t3meFAyzfCo-vZIs",
  authDomain: "youversity-c8632.firebaseapp.com",
  projectId: "youversity-c8632",
  storageBucket: "youversity-c8632.appspot.com",
  messagingSenderId: "1021633759112",
  appId: "1:1021633759112:web:6476141a5dd9527b97dc3d"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

// Firebase utility functions
export async function saveCourseToFirebase(userId: string, courseData: any) {
  try {
    // Create a new document reference in the public courses collection
    const publicCourseRef = doc(collection(db, 'courses'));
    const courseId = publicCourseRef.id;

    // Add creation timestamp and ID
    const courseWithMetadata = {
      ...courseData,
      createdAt: serverTimestamp(),
      id: courseId,
      createdBy: userId
    };

    // Save to public courses collection
    await setDoc(publicCourseRef, courseWithMetadata);

    // Save reference to user's courses collection
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    await setDoc(userCourseRef, courseWithMetadata);

    return courseId;
  } catch (error) {
    console.error('Error saving course:', error);
    throw error;
  }
}

export async function getUserCourses(userId: string) {
  try {
    const q = query(collection(db, 'courses'), where('userId', '==', userId));
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
    // Get course from public courses collection
    const courseDoc = await getDoc(doc(db, 'courses', courseId));
    if (courseDoc.exists()) {
      const data = courseDoc.data();
      return {
        ...data,
        id: courseDoc.id,
        createdAt: data.createdAt?.toDate?.() || null
      } as FinalCourseStructure & { id: string };
    }
    return null;
  } catch (error) {
    console.error('Error getting shared course:', error);
    throw error;
  }
} 