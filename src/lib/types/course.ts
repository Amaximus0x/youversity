import type { Timestamp } from 'firebase/firestore';

export interface CourseStructure {
  OG_Course_Title: string;
  OG_Course_Objective: string;
  OG_Module_Title: string[];
  OG_Module_YouTube_Search_Prompt: string[];
}

export interface ModuleVideos {
  [moduleIndex: number]: VideoItem[];
}

export interface SelectedVideos {
  [moduleIndex: number]: number;
}
  
export interface QuizQuestion {
  question: string;
  type: 'multiple-choice' | 'true/false';
  options: {
    [key: string]: string;
  };
  answer: string;
}

export interface Quiz {
  quiz: QuizQuestion[];
}

export interface FinalCourseStructure {
  Final_Course_Title: string;
  Final_Course_Objective: string;
  Final_Course_Introduction: string;
  Final_Module_Title: string[];
  Final_Module_Objective: string[];
  Final_Module_YouTube_Video_URL: string[];
  Final_Module_Quiz: Quiz[];
  Final_Course_Quiz: Quiz;
  Final_Course_Conclusion: string;
  YouTube_Playlist_URL: string;
  Final_Course_Thumbnail?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  likes?: number;
  views?: number;
  averageRating?: number;
  totalRatings?: number;
  Final_Module_Video_Duration: number[];
  Final_Module_Thumbnails: string[];
  Final_Course_Duration: number;
  creatorUsername?: string;
  creatorDisplayName?: string;
}

export interface CourseRating {
  userId: string;
  courseId: string;
  rating: number;
  review: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userDisplayName: string;
  userPhotoURL?: string;
}

export interface VideoItem {
  videoId: string;
  videoUrl: string;
  title: string;
  description: string;
  length: number;
  thumbnailUrl: string;
}

export interface ModuleProgress {
  completed: boolean;
  quizAttempts: number;
  bestScore: number;
  lastAttemptDate: Timestamp;
  timeTaken?: number;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  moduleProgress: ModuleProgress[];
  lastAccessedModule: number;
  startDate: Date;
  lastAccessDate: Date;
}

export interface CourseBookmark {
  userId: string;
  courseId: string;
  createdAt: Date;
}

export interface CourseEnrollment {
  userId: string;
  courseId: string;
  enrolledAt: Date;
  lastAccessedAt: Date;
  completedModules: number[];
  progress: CourseProgress;
}

export interface QuizResult {
  attempts: number;
  bestScore: number;
  lastAttemptDate: Timestamp;
  completed: boolean;
  timeTaken?: number;
}

export interface EnrollmentProgress {
  userId: string;
  courseId: string;
  enrolledAt: Date;
  lastAccessedAt: Date;
  moduleProgress: ModuleProgress[];
  completedModules: number[];
  quizResults: {
    moduleQuizzes: {
      [moduleIndex: number]: QuizResult;
    };
    finalQuiz?: QuizResult;
  };
  startDate: Timestamp;
  lastAccessDate: Timestamp;
}