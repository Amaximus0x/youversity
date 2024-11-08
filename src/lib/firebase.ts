import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import type { FinalCourseStructure } from '$lib/types/course';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize persistence in a function instead of top-level await
async function initializePersistence() {
  try {
    await enableIndexedDbPersistence(db);
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser doesn\'t support persistence.');
    }
  }

  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error("Auth persistence error:", error);
  }
}

// Call the initialization function
initializePersistence();

export { app, db, auth };

// Firebase utility functions
export async function saveCourseToFirebase(userId: string, course: FinalCourseStructure) {
  try {
    console.log('Starting Firebase save...', { userId });
    
    const courseData = {
      userId,
      createdAt: new Date().toISOString(),
      Final_Course_Title: course.Final_Course_Title,
      Final_Course_Objective: course.Final_Course_Objective,
      Final_Course_Introduction: course.Final_Course_Introduction,
      Final_Module_Title: course.Final_Module_Title,
      Final_Module_Objective: course.Final_Module_Objective,
      Final_Course_Conclusion: course.Final_Course_Conclusion,
      Final_Module_YouTube_Video_URL: course.Final_Module_YouTube_Video_URL,
      completed_modules: new Array(course.Final_Module_Title.length).fill(false)
    };
    
    console.log('Course data prepared:', courseData);

    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const coursesRef = collection(db, 'courses');
    console.log('Collection reference created');

    const courseRef = await addDoc(coursesRef, courseData);
    console.log('Document written with ID:', courseRef.id);

    return courseRef.id;
  } catch (error) {
    console.error('Error saving course:', error);
    throw new Error(`Failed to save course: ${error}`);
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