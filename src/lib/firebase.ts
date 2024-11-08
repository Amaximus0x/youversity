import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

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