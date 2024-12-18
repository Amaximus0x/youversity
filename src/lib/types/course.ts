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
  lastAttemptDate?: Date;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  moduleProgress: ModuleProgress[];
  lastAccessedModule: number;
  startDate: Date;
  lastAccessDate: Date;
}