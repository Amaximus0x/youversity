import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Declare the window property type
declare global {
  interface Window {
    loadingStateTimeout?: number;
  }
}

type LoadingState = {
  isLoading: boolean;
  currentModule: number;
  totalModules: number;
  currentModuleTitle: string;
  currentStep: string;
  progress: number;
  courseTitle: string;
  minimized: boolean;
  courseId: string | null;
  isInitialBuild: boolean;
  error: string | null;
  isCreateCourse: boolean;
  notification: {
    show: boolean;
    type: 'success' | 'error' | null;
    message: string;
  };
};

// Initialize from localStorage if available
const getInitialState = () => {
  if (browser) {
    const saved = localStorage.getItem('loadingState');
    if (saved) return JSON.parse(saved);
  }
  return {
    isLoading: false,
    currentModule: 0,
    totalModules: 10,
    currentModuleTitle: '',
    currentStep: '',
    progress: 0,
    courseTitle: '',
    minimized: false,
    courseId: null,
    isInitialBuild: true,
    error: null,
    isCreateCourse: false,
    notification: {
      show: false,
      type: null,
      message: ''
    }
  };
};

function createLoadingStore() {
  const { subscribe, set, update } = writable<LoadingState>(getInitialState());

  if (browser) {
    subscribe(state => {
      if (state.courseId || state.minimized || state.isLoading) {
        localStorage.setItem('loadingState', JSON.stringify({
          ...state,
          isLoading: state.isLoading,
          courseId: state.courseId,
          courseTitle: state.courseTitle,
          progress: state.progress,
          minimized: state.minimized,
          isInitialBuild: state.isInitialBuild
        }));
      } else {
        localStorage.removeItem('loadingState');
      }
    });
  }

  return {
    subscribe,
    startLoading: (title: string, showProgress = true, isInitialBuild = true) => 
      update(state => ({
        ...state,
        isLoading: true,
        courseTitle: title,
        isInitialBuild,
        isCreateCourse: true,
        progress: 0,
        minimized: false
      })),
    stopLoading: (courseId?: string) => 
      update(state => ({
        ...state,
        courseId: courseId || null,
        isLoading: false,
        isInitialBuild: false,
        isCreateCourse: courseId ? true : false
      })),
    setMinimized: (minimized: boolean) => update(state => ({ ...state, minimized })),
    setCourseTitle: (title: string) => update(state => ({ ...state, courseTitle: title })),
    clearState: () => update(state => {
      // Always return a fresh state regardless of conditions
      const freshState = getInitialState();
      
      if (browser) {
        localStorage.removeItem('loadingState');
      }
      
      return freshState;
    }),
    setCurrentModule: (module: number, title: string = '') => 
      update(state => ({ 
        ...state, 
        currentModule: module,
        currentModuleTitle: title 
      })),
    setStep: (step: string) =>
      update(state => ({
        ...state,
        currentStep: step
      })),
    setProgress: (progress: number) =>
      update(state => ({
        ...state,
        progress: Math.min(Math.max(progress, 0), 100)
      })),
    setTotalModules: (total: number) => 
      update(state => ({ ...state, totalModules: total })),
    setError: (error: string | null) => update(state => ({ 
      ...state, 
      error,
      isLoading: false,
      notification: error && !state.isInitialBuild ? {
        show: true,
        type: 'error',
        message: `Course generation failed\n${error}`
      } : state.notification
    })),
    clearNotification: () => update(state => ({
      ...state,
      notification: {
        show: false,
        type: null,
        message: ''
      }
    })),
    clearError: () => update(state => ({ 
      ...state, 
      error: null,
      isLoading: false,
      isCreateCourse: false
    }))
  };
}

export const loadingState = createLoadingStore();

// Split into two separate stores
function createInitialLoadingStore() {
  const { subscribe, set, update } = writable<InitialLoadingState>({
    isLoading: false,
    currentModule: 0,
    totalModules: 10,
    currentStep: '',
    progress: 0,
    error: null
  });

  return {
    subscribe,
    startLoading: () => update(state => ({
      ...state,
      isLoading: true,
      progress: 0
    })),
    stopLoading: () => update(state => ({
      ...state,
      isLoading: false
    })),
    setCurrentModule: (module: number) => 
      update(state => ({ ...state, currentModule: module })),
    setStep: (step: string) =>
      update(state => ({ ...state, currentStep: step })),
    setProgress: (progress: number) =>
      update(state => ({
        ...state,
        progress: Math.min(Math.max(progress, 0), 100)
      })),
    setTotalModules: (total: number) => 
      update(state => ({ ...state, totalModules: total })),
    setError: (error: string | null) => update(state => ({ 
      ...state, 
      error,
      isLoading: false
    })),
    clearError: () => update(state => ({ 
      ...state, 
      error: null,
      isLoading: false
    }))
  };
}

function createFinalLoadingStore() {
  const { subscribe, set, update } = writable<FinalLoadingState>({
    isLoading: false,
    currentStep: '',
    progress: 0,
    courseTitle: '',
    minimized: false,
    courseId: null,
    error: null,
    notification: {
      show: false,
      type: null,
      message: ''
    }
  });

  if (browser) {
    subscribe(state => {
      if (state.courseId || state.minimized || state.isLoading) {
        localStorage.setItem('finalLoadingState', JSON.stringify(state));
      } else {
        localStorage.removeItem('finalLoadingState');
      }
    });
  }

  return {
    subscribe,
    startLoading: (title: string) => update(state => ({
      ...state,
      isLoading: true,
      courseTitle: title,
      progress: 0,
      minimized: false
    })),
    stopLoading: (courseId?: string) => update(state => ({
      ...state,
      courseId: courseId || null,
      isLoading: false
    })),
    setStep: (step: string) => update(state => ({
      ...state,
      currentStep: step
    })),
    setProgress: (progress: number) => update(state => ({
      ...state,
      progress: Math.min(Math.max(progress, 0), 100)
    })),
    setMinimized: (minimized: boolean) => update(state => ({ ...state, minimized })),
    setCourseTitle: (title: string) => update(state => ({ ...state, courseTitle: title })),
    setError: (error: string | null) => update(state => ({ 
      ...state, 
      error,
      isLoading: false
    })),
    clearError: () => update(state => ({ 
      ...state, 
      error: null,
      isLoading: false
    })),
    clearState: () => {
      const freshState = {
        isLoading: false,
        currentStep: '',
        progress: 0,
        courseTitle: '',
        minimized: false,
        courseId: null,
        error: null,
        notification: {
          show: false,
          type: null,
          message: ''
        }
      };
      set(freshState);
      if (browser) {
        localStorage.removeItem('finalLoadingState');
      }
    },
    setCourseId: (courseId: string | null) => update(state => ({
      ...state,
      courseId,
      isLoading: true // Keep loading true so modal stays open
    }))
  };
}

export const initialLoadingState = createInitialLoadingStore();
export const finalLoadingState = createFinalLoadingStore(); 