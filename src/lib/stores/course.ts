import { writable, type Writable, derived } from 'svelte/store';
import type { EnrollmentProgress } from '$lib/types/course';
import { browser } from '$app/environment';

// Initialize with -1 to show introduction first
function createCurrentModuleStore() {
  const { subscribe, set, update } = writable(-1);

  return {
    subscribe,
    set: (value: number) => set(value),
    reset: () => set(-1),
  };
}

export const currentModuleStore = createCurrentModuleStore();

// Initialize enrollment progress store with data from localStorage if available
function createEnrollmentProgressStore() {
  // Try to load initial value from localStorage if in browser
  let initialValue: EnrollmentProgress | null = null;
  
  if (browser) {
    try {
      // Get the current URL to extract the course ID
      const url = new URL(window.location.href);
      const pathParts = url.pathname.split('/');
      const courseIdIndex = pathParts.indexOf('course') + 1;
      
      if (courseIdIndex > 0 && courseIdIndex < pathParts.length) {
        const courseId = pathParts[courseIdIndex];
        
        // First check if the user is enrolled in this course
        const savedState = localStorage.getItem(`course_${courseId}_state`);
        let isEnrolled = false;
        
        if (savedState) {
          try {
            const state = JSON.parse(savedState);
            isEnrolled = state.isEnrolled === true;
          } catch (e) {
            console.error('Error parsing course state:', e);
          }
        }
        
        // Only load progress if the user is enrolled
        if (isEnrolled) {
          const savedProgress = localStorage.getItem(`course_${courseId}_progress`);
          
          if (savedProgress) {
            const parsed = JSON.parse(savedProgress);
            initialValue = {
              quizResults: parsed.quizResults || { moduleQuizzes: {} },
              moduleProgress: parsed.moduleProgress || {},
              completedModules: Array.isArray(parsed.completedModules) 
                ? [...parsed.completedModules] 
                : [],
              lastAccessedModule: parsed.lastAccessedModule || 0
            };
            console.log('Store - Loaded progress from current URL for enrolled course:', initialValue);
          }
        } else {
          console.log('Store - User is not enrolled in this course, not loading progress');
        }
      }
    } catch (error) {
      console.error('Error loading enrollment progress from localStorage:', error);
      initialValue = null;
    }
  }
  
  // Create the base writable store with the initial value
  const { subscribe, set, update } = writable<EnrollmentProgress | null>(initialValue);

  // Return an enhanced store with persistence
  return {
    subscribe,
    set: (value: EnrollmentProgress | null) => {
      // Set the store value
      set(value);
      
      // If we're in a browser and have a value, save to localStorage
      if (browser && value) {
        try {
          // Get the current URL to extract the course ID
          const url = new URL(window.location.href);
          const pathParts = url.pathname.split('/');
          const courseIdIndex = pathParts.indexOf('course') + 1;
          
          if (courseIdIndex > 0 && courseIdIndex < pathParts.length) {
            const courseId = pathParts[courseIdIndex];
            
            // Check if the user is enrolled in this course before saving
            const savedState = localStorage.getItem(`course_${courseId}_state`);
            let isEnrolled = false;
            
            if (savedState) {
              try {
                const state = JSON.parse(savedState);
                isEnrolled = state.isEnrolled === true;
              } catch (e) {
                console.error('Error parsing course state:', e);
              }
            }
            
            // Only save progress if the user is enrolled
            if (isEnrolled) {
              // Save to localStorage with the course ID
              localStorage.setItem(
                `course_${courseId}_progress`,
                JSON.stringify(value)
              );
              console.log('Store - Saved progress to localStorage for enrolled course:', value);
            } else {
              console.log('Store - User is not enrolled in this course, not saving progress');
            }
          }
        } catch (error) {
          console.error('Error saving enrollment progress to localStorage:', error);
        }
      }
    },
    update,
    // Add a method to clear the store
    clear: () => {
      set(null);
      console.log('Store - Cleared enrollment progress store');
    }
  };
}

export const enrollmentProgressStore = createEnrollmentProgressStore();

// Derived store for progress percentage
export const progressPercentageStore = derived(
  enrollmentProgressStore,
  ($progress) => {
    if (!$progress || !$progress.completedModules) return 0;
    // This is a placeholder calculation - adjust based on your actual data structure
    return Math.round(($progress.completedModules.length / 10) * 100);
  }
);

// Enrollment status store
export const enrollmentStatusStore: Writable<boolean> = writable(false);

// Course details store
export const courseDetailsStore: Writable<any> = writable(null);

// Optional: Add other course-related stores here if needed
// For example:
// export const courseProgressStore = writable<any>(null);
// export const enrollmentStatusStore = writable<boolean>(false); 