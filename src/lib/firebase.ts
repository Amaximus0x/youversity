import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import type { CourseEnrollment, EnrollmentProgress, FinalCourseStructure, ModuleProgress } from './types/course';

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

    // Add required metadata for courses
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

    // Save to courses collection
    await setDoc(publicCourseRef, courseWithMetadata);

    // Save reference to user's courses collection
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    await setDoc(userCourseRef, {
      courseRef: publicCourseRef,
      createdAt: serverTimestamp(),
      isCreator: true
    });

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
    // Get courses created by user
    const createdCoursesQuery = query(
      collection(db, 'courses'),
      where('createdBy', '==', userId)
    );
    const createdCoursesSnapshot = await getDocs(createdCoursesQuery);
    const createdCourses = createdCoursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isCreator: true
    }));

    // Get enrolled courses from user's subcollection
    const enrolledCoursesRef = collection(db, `users/${userId}/courses`);
    const enrolledCoursesSnapshot = await getDocs(enrolledCoursesRef);
    
    // Get full course data for enrolled courses
    const enrolledCourses = await Promise.all(
      enrolledCoursesSnapshot.docs
        .filter(doc => !doc.data().isCreator) // Only get enrolled courses, not created ones
        .map(async (doc) => {
          const courseRef = doc.data().courseRef;
          const courseDoc = await getDoc(courseRef);
          if (courseDoc.exists()) {
            return {
              id: courseDoc.id,
              ...courseDoc.data(),
              isCreator: false,
              isEnrolled: true,
              enrolledAt: doc.data().createdAt?.toDate?.() || new Date()
            };
          }
          return null;
        })
    );

    // Filter out null values and courses that don't exist anymore
    const validEnrolledCourses = enrolledCourses.filter(course => course !== null);

    // Combine and sort by most recent
    const allCourses = [...createdCourses, ...validEnrolledCourses].sort((a, b) => {
      const dateA = a.enrolledAt?.toDate?.() || a.createdAt?.toDate?.() || new Date();
      const dateB = b.enrolledAt?.toDate?.() || b.createdAt?.toDate?.() || new Date();
      return dateB.getTime() - dateA.getTime();
    });

    // Remove any duplicates based on course ID
    const uniqueCourses = Array.from(
      new Map(allCourses.map(course => [course.id, course])).values()
    );

    return uniqueCourses;
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
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    const userCourseDoc = await getDoc(userCourseRef);
    
    if (!userCourseDoc.exists()) {
      throw new Error('Not enrolled in this course');
    }

    const currentData = userCourseDoc.data();
    const currentProgress = currentData.progress || {
      moduleProgress: [],
      lastAccessedModule: 0,
      completedModules: [],
      quizResults: {
        moduleQuizzes: {}
      },
      startDate: new Date(),
      lastAccessDate: new Date()
    };

    currentProgress.moduleProgress[moduleIndex] = progress;
    currentProgress.lastAccessDate = new Date();
    
    await updateDoc(userCourseRef, {
      'progress': currentProgress
    });
    
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
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    console.log('Course exists:', courseDoc.exists());
    
    if (courseDoc.exists()) {
      const data = courseDoc.data();
      console.log('Course data:', data);

      // Increment views if it's a public course
      if (data.isPublic) {
        const currentViews = data.views || 0;
        await updateDoc(courseRef, {
          views: currentViews + 1
        });
        data.views = currentViews + 1;
      }

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

export async function likeCourse(courseId: string, userId: string) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }
    
    const data = courseDoc.data();
    
    // Check if the course is public
    if (!data.isPublic) {
      throw new Error('Cannot like a private course');
    }
    
    const likes = data.likes || 0;
    const likedBy = data.likedBy || [];
    
    // Toggle like
    if (likedBy.includes(userId)) {
      await updateDoc(courseRef, {
        ...data,  // Preserve all existing fields
        likes: likes - 1,
        likedBy: likedBy.filter((id: string) => id !== userId)
      });
      return { likes: likes - 1, likedBy: likedBy.filter((id: string) => id !== userId) };
    } else {
      await updateDoc(courseRef, {
        ...data,  // Preserve all existing fields
        likes: likes + 1,
        likedBy: [...likedBy, userId]
      });
      return { likes: likes + 1, likedBy: [...likedBy, userId] };
    }
  } catch (error) {
    console.error('Error liking course:', error);
    throw new Error('Failed to like course');
  }
}

export async function bookmarkCourse(userId: string, courseId: string) {
  try {
    if (!userId || !courseId) {
      throw new Error('User ID and Course ID are required');
    }

    const userBookmarkRef = doc(db, `users/${userId}/bookmarks/${courseId}`);
    const userBookmarkDoc = await getDoc(userBookmarkRef);
    
    if (userBookmarkDoc.exists()) {
      // Remove bookmark if it exists
      await deleteDoc(userBookmarkRef);
      return { bookmarked: false };
    } else {
      // Get course reference first
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
      
      if (!courseDoc.exists()) {
        throw new Error('Course not found');
      }
      
      // Add to user's bookmarks subcollection only
      await setDoc(userBookmarkRef, {
        courseRef: courseRef,
        createdAt: serverTimestamp()
      });
      
      return { bookmarked: true };
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw new Error('Failed to toggle bookmark');
  }
}

export async function enrollInCourse(userId: string, courseId: string) {
  try {
    // Get course data first
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }
    
    // Check if already enrolled
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    const userCourseDoc = await getDoc(userCourseRef);
    
    if (userCourseDoc.exists()) {
      throw new Error('Already enrolled in this course');
    }

    const now = new Date();
    
    // Create enrollment with initial progress
    const enrollmentData = {
      courseRef: courseRef,
      createdAt: now,
      isEnrolled: true,
      progress: {
        moduleProgress: [],
        lastAccessedModule: 0,
        completedModules: [],
        quizResults: {
          moduleQuizzes: {}
        },
        startDate: now,
        lastAccessDate: now
      }
    };

    // Add to user's courses subcollection with progress data
    await setDoc(userCourseRef, enrollmentData);

    return {
      ...courseDoc.data(),
      id: courseId,
      isEnrolled: true,
      enrolledAt: now,
      progress: enrollmentData.progress
    };
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw new Error('Failed to enroll in course');
  }
}

export async function getEnrollmentStatus(userId: string, courseId: string) {
  try {
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    const userCourseDoc = await getDoc(userCourseRef);
    return userCourseDoc.exists() && userCourseDoc.data().isEnrolled === true;
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return false;
  }
}

interface CourseData {
  id?: string;
  createdAt: any;
  createdBy: string;
  userId: string;
  isPublic: boolean;
  views: number;
  likes: number;
  updatedAt: any;
  [key: string]: any; // For other course-specific fields
}

interface BookmarkedCourse extends CourseData {
  id: string;
  bookmarkedAt: Date | null;
}

export async function getUserBookmarks(userId: string): Promise<BookmarkedCourse[]> {
  try {
    const userBookmarksRef = collection(db, `users/${userId}/bookmarks`);
    const bookmarksSnapshot = await getDocs(userBookmarksRef);
    
    // Get all bookmarked courses
    const bookmarkedCourses = await Promise.all(
      bookmarksSnapshot.docs.map(async (doc) => {
        const courseRef = doc.data().courseRef;
        const courseDoc = await getDoc(courseRef);
        if (courseDoc.exists()) {
          const courseData = courseDoc.data() as CourseData;
          return {
            id: courseDoc.id,
            ...courseData,
            bookmarkedAt: doc.data().createdAt?.toDate?.() || null
          } as BookmarkedCourse;
        }
        return null;
      })
    );
    
    // Sort in memory instead
    return bookmarkedCourses
      .filter((course): course is BookmarkedCourse => course !== null)
      .sort((a, b) => {
        if (!a.bookmarkedAt || !b.bookmarkedAt) return 0;
        return b.bookmarkedAt.getTime() - a.bookmarkedAt.getTime();
      });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
}

export async function getEnrollmentProgress(userId: string, courseId: string) {
  try {
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    const userCourseDoc = await getDoc(userCourseRef);
    
    if (!userCourseDoc.exists()) {
      throw new Error('Not enrolled in this course');
    }
    
    const data = userCourseDoc.data();
    return data.progress || {
      moduleProgress: [],
      lastAccessedModule: 0,
      completedModules: [],
      quizResults: {
        moduleQuizzes: {}
      },
      startDate: new Date(),
      lastAccessDate: new Date()
    };
  } catch (error) {
    console.error('Error getting enrollment progress:', error);
    throw error;
  }
}

export async function updateEnrollmentQuizResult(
  userId: string,
  courseId: string,
  moduleIndex: number | null,
  score: number,
  completed: boolean
) {
  try {
    const enrollmentRef = doc(db, 'enrollments', `${userId}_${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);
    const enrollment = enrollmentDoc.data() as EnrollmentProgress;

    const updateData: any = {
      lastAccessedAt: new Date()
    };

    if (moduleIndex !== null) {
      // Module quiz update
      const currentModuleQuiz = enrollment.quizResults.moduleQuizzes[moduleIndex] || {
        attempts: 0,
        bestScore: 0,
        completed: false
      };

      updateData[`quizResults.moduleQuizzes.${moduleIndex}`] = {
        attempts: currentModuleQuiz.attempts + 1,
        bestScore: Math.max(currentModuleQuiz.bestScore, score),
        lastAttemptDate: new Date(),
        completed: completed || currentModuleQuiz.completed
      };

      // Update completed modules if passed
      if (completed && !enrollment.completedModules.includes(moduleIndex)) {
        updateData.completedModules = [...enrollment.completedModules, moduleIndex];
      }
    } else {
      // Final quiz update
      const currentFinalQuiz = enrollment.quizResults.finalQuiz || {
        attempts: 0,
        bestScore: 0,
        completed: false
      };

      updateData['quizResults.finalQuiz'] = {
        attempts: currentFinalQuiz.attempts + 1,
        bestScore: Math.max(currentFinalQuiz.bestScore, score),
        lastAttemptDate: new Date(),
        completed: completed || currentFinalQuiz.completed
      };
    }

    await updateDoc(enrollmentRef, updateData);
    return updateData;
  } catch (error) {
    console.error('Error updating quiz result:', error);
    throw error;
  }
}

export async function getBookmarkedCourses(userId: string): Promise<(FinalCourseStructure & { id: string })[]> {
  try {
    const userBookmarksRef = collection(db, 'users', userId, 'bookmarks');
    const bookmarksSnapshot = await getDocs(userBookmarksRef);
    
    const bookmarkedCourses = await Promise.all(
      bookmarksSnapshot.docs.map(async (doc) => {
        const courseRef = doc.data().courseRef;
        const courseDoc = await getDoc(courseRef);
        if (courseDoc.exists()) {
          return {
            ...(courseDoc.data() as FinalCourseStructure),
            id: courseDoc.id
          };
        }
        return null;
      })
    );

    return bookmarkedCourses.filter((course): course is FinalCourseStructure & { id: string } => 
      course !== null
    );
  } catch (error) {
    console.error('Error getting bookmarked courses:', error);
    throw error;
  }
}


// Check if a course is bookmarked by a user
export async function isBookmarked(userId: string, courseId: string): Promise<boolean> {
  try {
    const userBookmarkRef = doc(db, `users/${userId}/bookmarks/${courseId}`);
    const bookmarkDoc = await getDoc(userBookmarkRef);
    return bookmarkDoc.exists();
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return false;
  }
}