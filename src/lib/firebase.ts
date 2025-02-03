import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp, orderBy, limit, deleteDoc, Timestamp } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import type { CourseEnrollment, EnrollmentProgress, FinalCourseStructure, ModuleProgress, CourseRating } from './types/course';
import { getUserProfile } from '$lib/services/profile';

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

    // Try to extract playlist ID from the first video URL
    let playlistUrl = '';
    if (courseData.Final_Module_YouTube_Video_URL?.length > 0) {
      const firstVideoUrl = courseData.Final_Module_YouTube_Video_URL[0];
      const playlistId = getPlaylistIdFromUrl(firstVideoUrl);
      if (playlistId) {
        playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      }
    }

    // Add required metadata for courses
    const courseWithMetadata = {
      ...courseData,
      YouTube_Playlist_URL: playlistUrl,
      createdAt: serverTimestamp(),
      id: courseId,
      createdBy: userId,
      userId,
      isPublic: true,
      views: 0,
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

    return courseId;
  } catch (error) {
    console.error('Error saving course:', error);
    throw error;
  }
}

// Helper function to get user profile with username
async function enrichWithCreatorProfile(course: any) {
  try {
    const creatorProfile = await getUserProfile(course.createdBy);
    return {
      ...course,
      creatorUsername: creatorProfile?.username || 'Unknown User',
      creatorDisplayName: creatorProfile?.displayName || 'Unknown User'
    };
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return {
      ...course,
      creatorUsername: 'Unknown User',
      creatorDisplayName: 'Unknown User'
    };
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
    const createdCourses = await Promise.all(
      createdCoursesSnapshot.docs.map(async doc => {
        const courseData = {
          id: doc.id,
          ...doc.data(),
          isCreator: true
        };
        return enrichWithCreatorProfile(courseData);
      })
    );

    // Get enrolled courses from user's subcollection
    const enrolledCoursesRef = collection(db, `users/${userId}/courses`);
    const enrolledCoursesSnapshot = await getDocs(enrolledCoursesRef);
    
    // Get full course data for enrolled courses
    const enrolledCourses = await Promise.all(
      enrolledCoursesSnapshot.docs
        .filter(doc => !doc.data().isCreator)
        .map(async (doc) => {
          const courseRef = doc.data().courseRef;
          const courseDoc = await getDoc(courseRef);
          if (courseDoc.exists()) {
            const courseData = {
              id: courseDoc.id,
              ...courseDoc.data(),
              isCreator: false,
              isEnrolled: true,
              enrolledAt: doc.data().createdAt?.toDate?.() || new Date()
            };
            return enrichWithCreatorProfile(courseData);
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

// Helper function to generate playlist URL from video URLs
function generatePlaylistUrl(videoUrls: string[]): string {
  if (!videoUrls?.length) return '';
  
  // Try to extract playlist ID from any video URL
  for (const url of videoUrls) {
    const playlistId = getPlaylistIdFromUrl(url);
    if (playlistId) {
      return `https://www.youtube.com/playlist?list=${playlistId}`;
    }
  }

  // If no playlist ID found, create a custom playlist URL with video IDs
  const videoIds = videoUrls.map(url => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i);
    return match ? match[1] : null;
  }).filter(Boolean);

  if (videoIds.length) {
    // Create a playlist URL with the first video and additional videos as playlist
    return `https://www.youtube.com/watch?v=${videoIds[0]}&list=${videoIds.join(',')}`;
  }

  return '';
}

export async function getUserCourse(userId: string, courseId: string) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    
    // Generate playlist URL if missing but has video URLs
    if (!courseData.YouTube_Playlist_URL && courseData.Final_Module_YouTube_Video_URL?.length > 0) {
      courseData.YouTube_Playlist_URL = generatePlaylistUrl(courseData.Final_Module_YouTube_Video_URL);
      
      // Optionally update the document with the generated URL
      try {
        await updateDoc(courseRef, {
          YouTube_Playlist_URL: courseData.YouTube_Playlist_URL
        });
      } catch (error) {
        console.error('Error updating playlist URL:', error);
        // Continue even if update fails
      }
    }
    
    // Check if user is creator
    const isCreator = courseData.createdBy === userId;
    
    // Check if user is enrolled
    const enrollmentRef = doc(db, 'enrollments', `${userId}_${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    // Also check user's courses collection for enrollment
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    const userCourseDoc = await getDoc(userCourseRef);
    
    const isEnrolled = enrollmentDoc.exists() || (userCourseDoc.exists() && userCourseDoc.data().isEnrolled);

    // If not creator or enrolled, check if course is public
    if (!isCreator && !isEnrolled && !courseData.isPublic) {
      throw new Error('Unauthorized access to course');
    }

    return {
      id: courseId,
      ...courseData,
      isCreator,
      isEnrolled,
      enrollmentData: enrollmentDoc.exists() ? enrollmentDoc.data() : null
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
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

    // Initialize moduleProgress array if it doesn't exist or is too short
    if (!Array.isArray(currentProgress.moduleProgress)) {
      currentProgress.moduleProgress = [];
    }
    while (currentProgress.moduleProgress.length <= moduleIndex) {
      currentProgress.moduleProgress.push({
        completed: false,
        quizAttempts: 0,
        bestScore: 0,
        lastAttemptDate: new Date()
      });
    }

    // Update module progress
    currentProgress.moduleProgress[moduleIndex] = {
      ...currentProgress.moduleProgress[moduleIndex],
      ...progress
    };
    
    // Update last accessed module
    currentProgress.lastAccessedModule = moduleIndex;
    
    // Update last access date
    currentProgress.lastAccessDate = new Date();

    // Initialize quizResults if needed
    if (!currentProgress.quizResults) {
      currentProgress.quizResults = { moduleQuizzes: {} };
    }
    if (!currentProgress.quizResults.moduleQuizzes) {
      currentProgress.quizResults.moduleQuizzes = {};
    }

    // Update quiz results if there's quiz data
    if (progress.quizAttempts !== undefined || progress.bestScore !== undefined) {
      currentProgress.quizResults.moduleQuizzes[moduleIndex] = {
        attempts: progress.quizAttempts || 0,
        bestScore: progress.bestScore || 0,
        lastAttemptDate: new Date(),
        completed: progress.completed || false
      };

      // Initialize completedModules array if needed
      if (!Array.isArray(currentProgress.completedModules)) {
        currentProgress.completedModules = [];
      }

      // Update completed modules if quiz is passed
      if (progress.completed && !currentProgress.completedModules.includes(moduleIndex)) {
        currentProgress.completedModules.push(moduleIndex);
      }
    }
    
    // Update the entire progress object
    await updateDoc(userCourseRef, {
      progress: currentProgress
    });
    
    return currentProgress;
  } catch (error) {
    console.error('Error updating module progress:', error);
    throw new Error('Failed to update module progress');
  }
}

export async function getCourseProgress(userId: string, courseId: string) {
  try {
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    const userCourseDoc = await getDoc(userCourseRef);
    
    if (!userCourseDoc.exists()) {
      const initialProgress = {
        moduleProgress: [],
        lastAccessedModule: 0,
        completedModules: [],
        quizResults: {
          moduleQuizzes: {}
        },
        startDate: new Date(),
        lastAccessDate: new Date()
      };
      
      // Create initial progress in the user's course document
      await updateDoc(userCourseRef, {
        progress: initialProgress
      });
      
      return initialProgress;
    }
    
    return userCourseDoc.data().progress || {
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
    console.error('Error fetching course progress:', error);
    throw new Error('Failed to fetch course progress');
  }
}

export async function getSharedCourse(courseId: string): Promise<FinalCourseStructure> {
  try {
    console.log('Getting shared course:', courseId);
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    
    // Check if course is public
    if (!courseData.isPublic) {
      throw new Error('This course is not public');
    }

    // Generate playlist URL if missing but has video URLs
    if (!courseData.YouTube_Playlist_URL && courseData.Final_Module_YouTube_Video_URL?.length > 0) {
      courseData.YouTube_Playlist_URL = generatePlaylistUrl(courseData.Final_Module_YouTube_Video_URL);
      
      // Optionally update the document with the generated URL
      try {
        await updateDoc(courseRef, {
          YouTube_Playlist_URL: courseData.YouTube_Playlist_URL
        });
      } catch (error) {
        console.error('Error updating playlist URL:', error);
        // Continue even if update fails
      }
    }

    // Increment view count
    try {
      await updateDoc(courseRef, {
        views: (courseData.views || 0) + 1
      });
    } catch (error) {
      console.error('Error updating view count:', error);
    }

    // Ensure all required fields are present with proper types
    const enrichedCourseData: FinalCourseStructure = {
      id: courseId,
      ...courseData,
      Final_Course_Title: courseData.Final_Course_Title || '',
      Final_Course_Objective: courseData.Final_Course_Objective || '',
      Final_Course_Introduction: courseData.Final_Course_Introduction || '',
      Final_Module_Title: courseData.Final_Module_Title || [],
      Final_Module_Objective: courseData.Final_Module_Objective || [],
      Final_Module_YouTube_Video_URL: courseData.Final_Module_YouTube_Video_URL || [],
      Final_Module_Quiz: courseData.Final_Module_Quiz || [],
      Final_Course_Quiz: courseData.Final_Course_Quiz || { quiz: [] },
      Final_Course_Conclusion: courseData.Final_Course_Conclusion || '',
      YouTube_Playlist_URL: courseData.YouTube_Playlist_URL || '',
      Final_Course_Thumbnail: courseData.Final_Course_Thumbnail || '',
      isPublic: courseData.isPublic || false,
      createdBy: courseData.createdBy || '',
      createdAt: courseData.createdAt?.toDate() || new Date(),
      likes: courseData.likes || 0,
      views: (courseData.views || 0) + 1,
      totalRatings: courseData.totalRatings || 0,
      Final_Module_Video_Duration: courseData.Final_Module_Video_Duration || [],
      Final_Module_Thumbnails: courseData.Final_Module_Thumbnails || [],
      Final_Course_Duration: courseData.Final_Course_Duration || 0,
      creatorUsername: courseData.creatorUsername,
      creatorDisplayName: courseData.creatorDisplayName
    };

    console.log('Enriched course data:', enrichedCourseData);
    return enrichedCourseData;
  } catch (error) {
    console.error('Error getting shared course:', error);
    throw error;
  }
}

export async function getPublicCourses() {
  try {
    console.log('Fetching public courses...');
    // Add cache control and limit to ensure fresh data
    const q = query(
      collection(db, 'courses'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    // Force a fresh read from the server
    const querySnapshot = await getDocs(q);
    console.log('Query results:', querySnapshot.size, 'documents found');
    
    const courses = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date()
      } as FinalCourseStructure & { id: string };
    });
    
    // Sort in memory to ensure consistent ordering
    courses.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log('Processed courses:', courses.length);
    return courses;
  } catch (error: unknown) {
    console.error('Error fetching public courses:', error);
    if (error instanceof Error && error.message?.includes('index')) {
      console.log('Missing index. Falling back to basic query...');
      try {
        const basicQuery = query(
          collection(db, 'courses'),
          where('isPublic', '==', true)
        );
        const basicSnapshot = await getDocs(basicQuery);
        const basicCourses = basicSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date()
          } as FinalCourseStructure & { id: string };
        });
        
        return basicCourses.sort((a, b) => {
          const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
          const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
      } catch (fallbackError) {
        console.error('Fallback query failed:', fallbackError);
        throw new Error('Failed to fetch public courses');
      }
    }
    throw new Error('Failed to fetch public courses');
  }
}

export async function toggleCoursePrivacy(courseId: string, newIsPublic: boolean) {
  try {
    console.log('Toggling course privacy:', courseId, 'to', newIsPublic);
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const existingData = courseDoc.data();
    console.log('Course before update:', existingData);
    
    // Create update data with the new isPublic value
    const updateData = {
      isPublic: newIsPublic,
      updatedAt: serverTimestamp(),
      views: newIsPublic ? (existingData.views || 0) : existingData.views
    };

    // Update only the necessary fields
    await updateDoc(courseRef, updateData);
    
    // Get the updated document
    const updatedDoc = await getDoc(courseRef);
    const updatedData = updatedDoc.data();
    console.log('Course after update:', updatedData);
    
    // Return the complete updated course data
    return {
      id: courseId,
      ...existingData,
      ...updatedData,
      isPublic: newIsPublic // Ensure the isPublic value is correct
    };
  } catch (error) {
    console.error('Error toggling course privacy:', error);
    throw new Error('Failed to update course privacy');
  }
}

export async function likeCourse(userId: string, courseId: string) {
  try {
    // Get course reference and data
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    // Check if user has already liked
    const userLikeRef = doc(db, `users/${userId}/likes/${courseId}`);
    const likeDoc = await getDoc(userLikeRef);

    // Get current likes count
    const currentLikes = courseDoc.data().likes || 0;

    if (likeDoc.exists()) {
      // Remove like - first update course to avoid permission issues
      await updateDoc(courseRef, {
        likes: Math.max(0, currentLikes - 1) // Ensure likes don't go below 0
      });
      await deleteDoc(userLikeRef);
      return false;
    } else {
      // Add like - first create the like document
      await setDoc(userLikeRef, {
        courseId,
        createdAt: serverTimestamp()
      });
      await updateDoc(courseRef, {
        likes: currentLikes + 1
      });
      return true;
    }
  } catch (error) {
    console.error('Error liking course:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to like course');
  }
}

export async function hasLikedCourse(userId: string, courseId: string): Promise<boolean> {
  try {
    const userLikeRef = doc(db, `users/${userId}/likes/${courseId}`);
    const likeDoc = await getDoc(userLikeRef);
    return likeDoc.exists();
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
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
    // Create enrollment document
    const enrollmentRef = doc(db, 'enrollments', `${userId}_${courseId}`);
    await setDoc(enrollmentRef, {
      userId,
      courseId,
      enrolledAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp(),
      completedModules: [],
      moduleProgress: [],
      quizResults: {
        moduleQuizzes: {}
      }
    });

    // Add course to user's courses collection
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    await setDoc(userCourseRef, {
      courseRef: doc(db, 'courses', courseId),
      createdAt: serverTimestamp(),
      isEnrolled: true
    });

    return true;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
}

export async function getEnrollmentStatus(userId: string, courseId: string) {
  try {
    // Check both enrollment document and user's courses collection
    const enrollmentRef = doc(db, 'enrollments', `${userId}_${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    const userCourseDoc = await getDoc(userCourseRef);
    
    const isEnrolled = enrollmentDoc.exists() || (userCourseDoc.exists() && userCourseDoc.data().isEnrolled);
    
    return {
      isEnrolled,
      enrollmentData: enrollmentDoc.exists() ? enrollmentDoc.data() : null
    };
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    throw error;
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
  completed: boolean,
  timeTaken: number
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
      startDate: Timestamp.fromDate(new Date()),
      lastAccessDate: Timestamp.fromDate(new Date())
    };

    if (moduleIndex !== null) {
      // Module quiz update
      const currentModuleQuiz = currentProgress.quizResults.moduleQuizzes[moduleIndex] || {
        attempts: 0,
        bestScore: 0,
        completed: false
      };

      currentProgress.quizResults.moduleQuizzes[moduleIndex] = {
        attempts: currentModuleQuiz.attempts + 1,
        bestScore: Math.max(currentModuleQuiz.bestScore, score),
        lastAttemptDate: Timestamp.fromDate(new Date()),
        completed: completed || currentModuleQuiz.completed,
        timeTaken
      };

      // Update completed modules if passed
      if (completed && !currentProgress.completedModules.includes(moduleIndex)) {
        currentProgress.completedModules.push(moduleIndex);
      }
    } else {
      // Final quiz update
      const currentFinalQuiz = currentProgress.quizResults.finalQuiz || {
        attempts: 0,
        bestScore: 0,
        completed: false
      };

      currentProgress.quizResults.finalQuiz = {
        attempts: currentFinalQuiz.attempts + 1,
        bestScore: Math.max(currentFinalQuiz.bestScore, score),
        lastAttemptDate: Timestamp.fromDate(new Date()),
        completed: completed || currentFinalQuiz.completed,
        timeTaken
      };
    }

    currentProgress.lastAccessDate = Timestamp.fromDate(new Date());
    await updateDoc(userCourseRef, { progress: currentProgress });
    return currentProgress;
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

export async function submitCourseRating(
  userId: string,
  courseId: string,
  review: string,
  userDisplayName: string,
  userPhotoURL?: string
) {
  try {
    console.log('Submitting review:', { userId, courseId, review });
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    if (!courseDoc.data().isPublic) {
      throw new Error('Cannot review a private course');
    }

    const ratingRef = doc(db, `courses/${courseId}/ratings/${userId}`);
    const ratingDoc = await getDoc(ratingRef);
    const now = Timestamp.fromDate(new Date());

    // Create review data object without undefined values
    const reviewData = {
      userId,
      courseId,
      review,
      userDisplayName,
      createdAt: now,
      updatedAt: now,
      ...(userPhotoURL ? { userPhotoURL } : {}) // Only include if not undefined
    };

    console.log('Review data to save:', reviewData);

    if (ratingDoc.exists()) {
      console.log('Updating existing review');
      await updateDoc(ratingRef, {
        ...reviewData,
        createdAt: ratingDoc.data().createdAt // Keep original creation date
      });
    } else {
      console.log('Creating new review');
      await setDoc(ratingRef, reviewData);
    }

    return reviewData;
  } catch (error) {
    console.error('Error submitting course review:', error);
    throw error;
  }
}

export async function getCourseRatings(courseId: string) {
  try {
    console.log('Fetching ratings for course:', courseId);
    const ratingsQuery = query(
      collection(db, `courses/${courseId}/ratings`),
      orderBy('createdAt', 'desc')
    );
    const ratingsSnapshot = await getDocs(ratingsQuery);
    console.log('Raw ratings data:', ratingsSnapshot.docs.map(doc => doc.data()));
    
    const ratings = ratingsSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Rating document:', data);
      return {
        ...data,
        rating: Number(data.rating) // Ensure rating is a number
      };
    }) as CourseRating[];
    
    console.log('Processed ratings:', ratings);
    return ratings;
  } catch (error) {
    console.error('Error getting course ratings:', error);
    throw error;
  }
}

export async function getUserCourseRating(userId: string, courseId: string) {
  try {
    const ratingRef = doc(db, `courses/${courseId}/ratings/${userId}`);
    const ratingDoc = await getDoc(ratingRef);
    
    if (ratingDoc.exists()) {
      return ratingDoc.data() as CourseRating;
    }
    return null;
  } catch (error) {
    console.error('Error getting user course rating:', error);
    throw error;
  }
}

// Add these functions for bookmark handling
export async function toggleBookmark(userId: string, courseId: string) {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const userBookmarkRef = doc(db, `users/${userId}/bookmarks/${courseId}`);
    const bookmarkDoc = await getDoc(userBookmarkRef);

    if (bookmarkDoc.exists()) {
      // Remove bookmark
      await deleteDoc(userBookmarkRef);
      console.log('Bookmark removed');
      return false; // Return false to indicate bookmark was removed
    } else {
      // Add bookmark
      await setDoc(userBookmarkRef, {
        courseRef,
        createdAt: serverTimestamp()
      });
      console.log('Bookmark added');
      return true; // Return true to indicate bookmark was added
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    throw error;
  }
}

function getPlaylistIdFromUrl(url: string): string | null {
  const playlistMatch = url.match(/[&?]list=([^&]+)/i);
  return playlistMatch ? playlistMatch[1] : null;
}

export async function removeCourse(userId: string, courseId: string) {
  try {
    // Remove from user's courses collection
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    await deleteDoc(userCourseRef);

    // Remove from enrollments if exists
    const enrollmentRef = doc(db, 'enrollments', `${userId}_${courseId}`);
    try {
      await deleteDoc(enrollmentRef);
    } catch (error) {
      console.error('Error removing enrollment:', error);
      // Continue even if enrollment removal fails
    }

    return true;
  } catch (error) {
    console.error('Error removing course:', error);
    throw new Error('Failed to remove course');
  }
}