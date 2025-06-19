import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp, orderBy, limit, deleteDoc, Timestamp, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import type { CourseEnrollment, EnrollmentProgress, FinalCourseStructure, ModuleProgress, CourseRating, QuizResult } from './types/course';
import { getUserProfile } from '$lib/services/profile';
import { NotificationService } from '$lib/services/notificationService';
import { browser } from '$app/environment';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !import.meta.env[envVar]
);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Initialize Firebase only in browser context
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Create a promise to track Firebase initialization
export const firebaseInitialized = new Promise<{
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}>(async (resolve, reject) => {
  try {
    if (browser) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);

      // Set persistence to local
      await setPersistence(auth, browserLocalPersistence);
      console.log('Firebase initialized successfully');
      resolve({ app, auth, db, storage });
    } else {
      // For SSR, provide empty objects
      app = {} as FirebaseApp;
      auth = {} as Auth;
      db = {} as Firestore;
      storage = {} as FirebaseStorage;
      resolve({ app, auth, db, storage });
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    reject(error);
  }
});

// Export initialized instances
export { app, auth, db, storage };

// Function to refresh the auth token
export async function refreshToken(): Promise<string | null> {
  try {
    const { auth } = await firebaseInitialized;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No user signed in to refresh token');
      return null;
    }
    const token = await currentUser.getIdToken(true);
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Function to set the auth token cookie
export async function setAuthTokenCookie(): Promise<void> {
  try {
    const { auth } = await firebaseInitialized;
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No user signed in to set token cookie');
      return;
    }

    const token = await currentUser.getIdToken(true);
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    const maxAge = 3600; // 1 hour expiration
    document.cookie = `firebase-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;

    // Store token expiry time
    const expiryTime = Date.now() + (maxAge * 1000);
    localStorage.setItem('youversity_token_expiry', expiryTime.toString());
  } catch (error) {
    console.error('Error setting auth token cookie:', error);
  }
}

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
function generatePlaylistUrl(videoUrls: string[], courseTitle: string = ''): string {
  if (!videoUrls?.length) return '';
  
  // Try to extract playlist ID from any video URL first
  for (const url of videoUrls) {
    const playlistId = getPlaylistIdFromUrl(url);
    if (playlistId) {
      return `https://www.youtube.com/playlist?list=${playlistId}`;
    }
  }

  // If no playlist ID found, create a new playlist URL
  const videoIds = videoUrls.map(url => {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i);
    return match ? match[1] : null;
  }).filter(Boolean);

  if (videoIds.length) {
    // Create a playlist URL that will work with YouTube's playlist feature
    const encodedTitle = encodeURIComponent(courseTitle);
    return `https://youtube.com/watch_videos?video_ids=${videoIds.join(',')}&title=${encodedTitle}`;
  }

  return '';
}

export async function getUserCourse(userId: string, courseId: string) {
  try {
    console.debug('[getUserCourse] Fetching course:', { userId, courseId });
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      console.error('[getUserCourse] Course not found');
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    console.debug('[getUserCourse] Raw course data:', courseData);
    
    // Generate playlist URL if missing but has video URLs
    if (!courseData.YouTube_Playlist_URL && courseData.Final_Module_YouTube_Video_URL?.length > 0) {
      courseData.YouTube_Playlist_URL = generatePlaylistUrl(
        courseData.Final_Module_YouTube_Video_URL,
        courseData.Final_Course_Title
      );
      
      // Optionally update the document with the generated URL
      try {
        await updateDoc(courseRef, {
          YouTube_Playlist_URL: courseData.YouTube_Playlist_URL
        });
      } catch (error) {
        console.error('[getUserCourse] Error updating playlist URL:', error);
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
      console.error('[getUserCourse] Unauthorized access to course');
      throw new Error('Unauthorized access to course');
    }

    // Ensure all required fields are present with proper types
    const enrichedCourseData: FinalCourseStructure = {
      id: courseId,
      Final_Course_Title: courseData.Final_Course_Title || '',
      Final_Course_Objective: courseData.Final_Course_Objective || '',
      Final_Course_Introduction: courseData.Final_Course_Introduction || '',
      Final_Module_Title: courseData.Final_Module_Title || [],
      Final_Module_Objective: courseData.Final_Module_Objective || [],
      Final_Module_Summary: courseData.Final_Module_Summary || [],
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
      views: courseData.views || 0,
      totalRatings: courseData.totalRatings || 0,
      Final_Module_Video_Duration: courseData.Final_Module_Video_Duration || [],
      Final_Module_Thumbnails: courseData.Final_Module_Thumbnails || [],
      Final_Course_Duration: courseData.Final_Course_Duration || 0,
      Module_Additional_Videos: courseData.Module_Additional_Videos || {},
      isCreator,
      isEnrolled,
      enrollmentData: enrollmentDoc.exists() ? enrollmentDoc.data() : null
    };

    // Fetch creator profile and enrich with creator details
    const creatorProfile = await getUserProfile(courseData.createdBy);
    if (creatorProfile) {
      enrichedCourseData.creatorUsername = creatorProfile.username || 'Unknown User';
      enrichedCourseData.creatorDisplayName = creatorProfile.displayName || 'Unknown User';
    } else {
      enrichedCourseData.creatorUsername = 'Unknown User';
      enrichedCourseData.creatorDisplayName = 'Unknown User';
    }

    console.debug('[getUserCourse] Enriched course data:', enrichedCourseData);
    return enrichedCourseData;
  } catch (error) {
    console.error('[getUserCourse] Error:', error);
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
      courseData.YouTube_Playlist_URL = generatePlaylistUrl(
        courseData.Final_Module_YouTube_Video_URL,
        courseData.Final_Course_Title
      );
      
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
      Final_Module_Summary: courseData.Final_Module_Summary || [],
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

    const courseData = courseDoc.data();
    
    // Check if user has already liked
    const userLikeRef = doc(db, `users/${userId}/likes/${courseId}`);
    const likeDoc = await getDoc(userLikeRef);

    // Get current likes count
    const currentLikes = courseData.likes || 0;

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

      // Create notification for course creator if it's not the same user
      if (userId !== courseData.createdBy) {
        try {
          // Get liker's profile for the notification message
          const likerProfile = await getUserProfile(userId);
          const likerName = likerProfile?.displayName || 'Someone';

          await NotificationService.createNotification({
            userId: courseData.createdBy,
            title: 'Your Course Got an Upvote',
            message: `Great work! Your course just received an upvote.`,
            // message: `${likerName} liked your course "${courseData.Final_Course_Title}"`,
            type: NotificationType.COURSE_LIKED,
            isRead: false,
            createdAt: new Date(),
            courseId,
            courseTitle: courseData.Final_Course_Title
          });
        } catch (notificationError) {
          // Log notification error but don't fail the like operation
          console.error('Error creating notification:', notificationError);
        }
      }

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
      lastAccessedModule: 0,
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
    console.debug('[getEnrollmentStatus] Checking enrollment:', { userId, courseId });
    
    // Check both enrollment document and user's courses collection
    const enrollmentRef = doc(db, 'enrollments', `${userId}_${courseId}`);
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    
    const [enrollmentDoc, userCourseDoc] = await Promise.all([
      getDoc(enrollmentRef),
      getDoc(userCourseRef)
    ]);
    
    // Check enrollment status from both documents
    const isEnrolledInEnrollments = enrollmentDoc.exists();
    const isEnrolledInUserCourses = userCourseDoc.exists() && userCourseDoc.data().isEnrolled;
    
    const isEnrolled = isEnrolledInEnrollments || isEnrolledInUserCourses;
    
    // Get enrollment data from the most recent source
    let enrollmentData = null;
    if (isEnrolledInEnrollments) {
      enrollmentData = enrollmentDoc.data();
    } else if (isEnrolledInUserCourses) {
      enrollmentData = userCourseDoc.data();
    }

    // Initialize enrollment data if it doesn't exist
    if (isEnrolled && !enrollmentData) {
      enrollmentData = {
        userId,
        courseId,
        enrolledAt: new Date(),
        lastAccessedAt: new Date(),
        completedModules: [],
        moduleProgress: [],
        lastAccessedModule: 0,
        quizResults: {
          moduleQuizzes: {}
        }
      };

      // Create enrollment document if it doesn't exist
      if (!isEnrolledInEnrollments) {
        console.debug('[getEnrollmentStatus] Creating enrollment document');
        await setDoc(enrollmentRef, enrollmentData);
      }
    }

    console.debug('[getEnrollmentStatus] Status:', {
      isEnrolled,
      hasEnrollmentDoc: isEnrolledInEnrollments,
      hasUserCourseDoc: isEnrolledInUserCourses,
      enrollmentData
    });
    
    return {
      isEnrolled,
      enrollmentData
    };
  } catch (error) {
    console.error('[getEnrollmentStatus] Error:', error);
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
    const enrollmentRef = doc(db, `enrollments/${userId}_${courseId}`);
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    // Return default progress object if not enrolled
    if (!enrollmentDoc.exists()) {
      return {
        moduleProgress: [],
        lastAccessedModule: 0,
        completedModules: [],
        quizResults: {
          moduleQuizzes: {}
        },
        startDate: new Date(),
        lastAccessDate: new Date()
      };
    }
    
    const data = enrollmentDoc.data();
    return data || {
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
  moduleIndex: number,
  quizResult: QuizResult
) {
  try {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    const enrollmentDoc = await getDoc(enrollmentRef);

    // Initialize default enrollment data if it doesn't exist
    if (!enrollmentDoc.exists()) {
      const defaultEnrollmentData = {
        userId,
        courseId,
        enrolledAt: serverTimestamp(),
        lastAccessedAt: serverTimestamp(),
        completedModules: [],
        moduleProgress: [],
        lastAccessedModule: 0,
        quizResults: {
          moduleQuizzes: {}
        }
      };
      await setDoc(enrollmentRef, defaultEnrollmentData);
    }

    // Get the latest enrollment data
    const enrollmentData = (await getDoc(enrollmentRef)).data() || {};
    const updatedQuizResults = {
      ...enrollmentData.quizResults || {},
    };

    // Handle final quiz result
    if (moduleIndex === -1) {
      updatedQuizResults.finalQuiz = quizResult;
      
      // If the quiz is passed (score >= 80), mark the course as completed
      if (quizResult.passed) {
        await updateDoc(enrollmentRef, {
          quizResults: updatedQuizResults,
          completedAt: new Date(),
          isCompleted: true,
          lastAccessedAt: new Date()
        });
      }
    } else {
      // Handle module quiz results
      if (!updatedQuizResults.moduleQuizzes) {
        updatedQuizResults.moduleQuizzes = {};
      }
      updatedQuizResults.moduleQuizzes[moduleIndex] = quizResult;

      // Update completed modules if quiz is passed
      let completedModules = enrollmentData.completedModules || [];
      if (quizResult.passed && !completedModules.includes(moduleIndex)) {
        completedModules = [...completedModules, moduleIndex];
      }

      // Update the enrollment document with quiz results and completed modules
      await updateDoc(enrollmentRef, {
        quizResults: updatedQuizResults,
        completedModules,
        lastAccessedAt: new Date()
      });
    }

    // Return the updated enrollment data
    const updatedDoc = await getDoc(enrollmentRef);
    return updatedDoc.data();

  } catch (error) {
    console.error('Error updating quiz result:', error);
    throw error;
  }
}

export async function getBookmarkedCourses(userId: string): Promise<(FinalCourseStructure & { id: string; bookmarkedAt: Date })[]> {
  try {
    const userBookmarksRef = collection(db, 'users', userId, 'bookmarks');
    const bookmarksSnapshot = await getDocs(userBookmarksRef);
    
    console.log('Raw bookmarks data:', bookmarksSnapshot.docs.map(doc => ({
      id: doc.id,
      createdAt: doc.data().createdAt
    }))); // Debug log
    
    const bookmarkedCourses = await Promise.all(
      bookmarksSnapshot.docs.map(async (doc) => {
        const courseRef = doc.data().courseRef;
        const courseDoc = await getDoc(courseRef);
        if (courseDoc.exists()) {
          const bookmarkedAt = doc.data().createdAt?.toDate() || new Date();
          console.log(`Course ${courseDoc.id} bookmarked at:`, bookmarkedAt); // Debug log
          
          return {
            ...(courseDoc.data() as FinalCourseStructure),
            id: courseDoc.id,
            bookmarkedAt
          };
        }
        return null;
      })
    );

    return bookmarkedCourses.filter((course): course is FinalCourseStructure & { id: string; bookmarkedAt: Date } => 
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

    const courseData = courseDoc.data();

    if (!courseData.isPublic) {
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

      // Create notification for course creator if it's not the same user
      if (userId !== courseData.createdBy) {
        await NotificationService.createNotification({
          userId: courseData.createdBy,
          title: 'New Comment on Your Course',
          message: `There's a new comment on your course. Check it out and join the conversation!`,
          // message: `${userDisplayName} left a new on your course "${courseData.Final_Course_Title}"`,
          type: NotificationType.COURSE_REVIEWED,
          isRead: false,
          createdAt: new Date(),
          courseId,
          courseTitle: courseData.Final_Course_Title
        });
      }
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

export async function removeEnrollment(userId: string, courseId: string) {
  try {
    // Remove from user's courses collection (enrollment)
    const userCourseRef = doc(db, `users/${userId}/courses/${courseId}`);
    await deleteDoc(userCourseRef);

    // Remove enrollment progress
    const enrollmentRef = doc(db, `enrollments/${userId}_${courseId}`);
    try {
      await deleteDoc(enrollmentRef);
    } catch (error) {
      console.error('Error removing enrollment progress:', error);
    }

    return true;
  } catch (error) {
    console.error('Error removing enrollment:', error);
    throw new Error('Failed to remove course enrollment');
  }
}

export async function getPublicCoursesByCreator(creatorId: string) {
  try {
    // First get all public courses by the creator
    const q = query(
      collection(db, 'courses'),
      where('createdBy', '==', creatorId),
      // where('isPublic', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    const courses = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const course: FinalCourseStructure = {
        Final_Course_Title: data.Final_Course_Title || '',
        Final_Course_Objective: data.Final_Course_Objective || '',
        Final_Course_Introduction: data.Final_Course_Introduction || '',
        Final_Module_Title: data.Final_Module_Title || [],
        Final_Module_Objective: data.Final_Module_Objective || [],
        Final_Module_YouTube_Video_URL: data.Final_Module_YouTube_Video_URL || [],
        Final_Module_Quiz: data.Final_Module_Quiz || [],
        Final_Course_Quiz: data.Final_Course_Quiz || null,
        Final_Course_Conclusion: data.Final_Course_Conclusion || '',
        YouTube_Playlist_URL: data.YouTube_Playlist_URL || '',
        Final_Course_Thumbnail: data.Final_Course_Thumbnail || '',
        isPublic: data.isPublic || false,
        createdBy: data.createdBy || '',
        createdAt: data.createdAt?.toDate?.() || new Date(),
        likes: data.likes || 0,
        views: data.views || 0,
        totalRatings: data.totalRatings || 0,
        Final_Module_Video_Duration: data.Final_Module_Video_Duration || [],
        Final_Module_Thumbnails: data.Final_Module_Thumbnails || [],
        Final_Course_Duration: data.Final_Course_Duration || 0
      };

      return {
        ...course,
        id: doc.id // Add the id field
      };
    });
    
    // Sort in memory
    return courses.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching creator courses:', error);
    throw new Error('Failed to fetch creator courses');
  }
}

// Function to add a video to an existing module in a course
export async function addVideoToModule(
  userId: string,
  courseId: string,
  moduleIndex: number,
  videoData: {
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration?: number;
    description?: string;
  }
) {
  try {
    console.log('Adding video to module:', { userId, courseId, moduleIndex, videoData });
    
    // Get the course document
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    
    // Check if user is the creator of the course
    if (courseData.createdBy !== userId) {
      throw new Error('Unauthorized: Only the course creator can add videos to modules');
    }

    // Extract YouTube video ID from URL to create proper YouTube URL
    const extractYouTubeVideoId = (url: string): string | null => {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = url.match(regex);
      return match ? match[1] : null;
    };

    const videoId = extractYouTubeVideoId(videoData.videoUrl);
    const youtubeUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : videoData.videoUrl;

    // Get or initialize additional videos structure for modules
    const additionalVideos = courseData.Module_Additional_Videos || {};
    
    // Initialize the module's additional videos array if it doesn't exist
    if (!additionalVideos[moduleIndex]) {
      additionalVideos[moduleIndex] = [];
    }

    // Create the video object to add
    const newVideo = {
      title: videoData.title,
      videoUrl: youtubeUrl,
      thumbnailUrl: videoData.thumbnailUrl || '',
      duration: videoData.duration || 0,
      description: videoData.description || '',
      addedAt: new Date().toISOString(),
      videoId: videoId || ''
    };

    // Add the new video to the module's additional videos
    additionalVideos[moduleIndex].push(newVideo);

    // Calculate new total duration including additional videos
    let additionalDuration = 0;
    Object.values(additionalVideos).forEach((moduleVideos: any) => {
      if (Array.isArray(moduleVideos)) {
        additionalDuration += moduleVideos.reduce((sum: number, video: any) => sum + (video.duration || 0), 0);
      }
    });

    // Get current main module durations
    const mainModuleDurations = courseData.Final_Module_Video_Duration || [];
    const mainDuration = mainModuleDurations.reduce((sum: number, duration: number) => sum + (duration || 0), 0);
    
    const totalDuration = mainDuration + additionalDuration;

    // Update the course document
    const updateData = {
      Module_Additional_Videos: additionalVideos,
      Final_Course_Duration: totalDuration,
      updatedAt: serverTimestamp()
    };

    await updateDoc(courseRef, updateData);
    
    console.log('Successfully added video to module');
    return true;
  } catch (error) {
    console.error('Error adding video to module:', error);
    throw error;
  }
}

// Function to add a video as a new module to a course
export async function addVideoAsNewModule(
  userId: string,
  courseId: string,
  videoData: {
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration?: number;
    description?: string;
  }
) {
  try {
    console.log('Adding video as new module:', { userId, courseId, videoData });
    
    // Get the course document
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    
    // Check if user is the creator of the course
    if (courseData.createdBy !== userId) {
      throw new Error('Unauthorized: Only the course creator can add modules to courses');
    }

    // Extract YouTube video ID from URL to create proper YouTube URL
    const extractYouTubeVideoId = (url: string): string | null => {
      const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
      const match = url.match(regex);
      return match ? match[1] : null;
    };

    const videoId = extractYouTubeVideoId(videoData.videoUrl);
    const youtubeUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : videoData.videoUrl;

    // Get current module data arrays
    const moduleTitles = courseData.Final_Module_Title || [];
    const moduleObjectives = courseData.Final_Module_Objective || [];
    const moduleSummaries = courseData.Final_Module_Summary || [];
    const moduleUrls = courseData.Final_Module_YouTube_Video_URL || [];
    const moduleThumbnails = courseData.Final_Module_Thumbnails || [];
    const moduleDurations = courseData.Final_Module_Video_Duration || [];
    const moduleQuizzes = courseData.Final_Module_Quiz || [];

    // Add new module data
    const newModuleIndex = moduleTitles.length;
    moduleTitles.push(videoData.title);
    moduleObjectives.push(videoData.description || `Learn about ${videoData.title}`);
    moduleSummaries.push(videoData.description || `This module covers ${videoData.title}`);
    moduleUrls.push(youtubeUrl);
    moduleThumbnails.push(videoData.thumbnailUrl || '');
    moduleDurations.push(videoData.duration || 0);
    
    // Create a basic quiz for the new module
    const basicQuiz = {
      quiz: [
        {
          question: `What is the main topic covered in this module about ${videoData.title}?`,
          options: [
            videoData.title,
            "Something else",
            "Not covered",
            "Unknown topic"
          ],
          correct_answer: videoData.title
        }
      ]
    };
    moduleQuizzes.push(basicQuiz);

    // Calculate new total duration
    const totalDuration = moduleDurations.reduce((sum, duration) => sum + (duration || 0), 0);

    // Update the course document
    const updateData = {
      Final_Module_Title: moduleTitles,
      Final_Module_Objective: moduleObjectives,
      Final_Module_Summary: moduleSummaries,
      Final_Module_YouTube_Video_URL: moduleUrls,
      Final_Module_Thumbnails: moduleThumbnails,
      Final_Module_Video_Duration: moduleDurations,
      Final_Module_Quiz: moduleQuizzes,
      Final_Course_Duration: totalDuration,
      updatedAt: serverTimestamp()
    };

    await updateDoc(courseRef, updateData);
    
    console.log('Successfully added video as new module');
    return newModuleIndex;
  } catch (error) {
    console.error('Error adding video as new module:', error);
    throw error;
  }
}

// Function to remove a video from a module's additional videos
export async function removeVideoFromModule(
  userId: string,
  courseId: string,
  moduleIndex: number,
  videoIndex: number
) {
  try {
    console.log('Removing video from module:', { userId, courseId, moduleIndex, videoIndex });
    
    // Get the course document
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    
    // Check if user is the creator of the course
    if (courseData.createdBy !== userId) {
      throw new Error('Unauthorized: Only the course creator can remove videos from modules');
    }

    // Get the additional videos structure
    const additionalVideos = courseData.Module_Additional_Videos || {};
    
    // Check if the module has additional videos
    if (!additionalVideos[moduleIndex] || !Array.isArray(additionalVideos[moduleIndex])) {
      throw new Error('No additional videos found for this module');
    }

    // Check if the video index is valid
    if (videoIndex >= additionalVideos[moduleIndex].length || videoIndex < 0) {
      throw new Error('Invalid video index');
    }

    // Remove the video from the array
    additionalVideos[moduleIndex].splice(videoIndex, 1);

    // Calculate new total duration excluding the removed video
    let additionalDuration = 0;
    Object.values(additionalVideos).forEach((moduleVideos: any) => {
      if (Array.isArray(moduleVideos)) {
        additionalDuration += moduleVideos.reduce((sum: number, video: any) => sum + (video.duration || 0), 0);
      }
    });

    // Get current main module durations
    const mainModuleDurations = courseData.Final_Module_Video_Duration || [];
    const mainDuration = mainModuleDurations.reduce((sum: number, duration: number) => sum + (duration || 0), 0);
    
    const totalDuration = mainDuration + additionalDuration;

    // Update the course document
    const updateData = {
      Module_Additional_Videos: additionalVideos,
      Final_Course_Duration: totalDuration,
      updatedAt: serverTimestamp()
    };

    await updateDoc(courseRef, updateData);
    
    console.log('Successfully removed video from module');
    return true;
  } catch (error) {
    console.error('Error removing video from module:', error);
    throw error;
  }
}