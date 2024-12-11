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
    isInitialBuild: false,
    error: null,
    isCreateCourse: false,
    notification: {
      show: false,
      type: null,
      message: ''
    }
  };
};

const createLoadingStore = () => {
  const { subscribe, set, update } = writable<LoadingState>(getInitialState());

  // Clear timeout on store initialization
  if (browser && window.loadingStateTimeout) {
    clearTimeout(window.loadingStateTimeout);
  }

  if (browser) {
    subscribe(state => {
      localStorage.setItem('loadingState', JSON.stringify(state));
    });
  }

  return {
    subscribe,
    startLoading: (courseTitle: string = '', isInitialBuild: boolean = false, isCreateCourse: boolean = false) => {
      if (browser && window.loadingStateTimeout) {
        clearTimeout(window.loadingStateTimeout);
      }
      
      update(state => ({
        ...state,
        isLoading: true,
        currentModule: 0,
        progress: 0,
        courseTitle,
        isInitialBuild,
        isCreateCourse,
        minimized: false,
        notification: {
          show: false,
          type: null,
          message: ''
        }
      }));

      // Set auto-minimize timeout
      if (browser) {
        window.loadingStateTimeout = window.setTimeout(() => {
          update(state => ({ ...state, minimized: true }));
        }, 3000);
      }
    },
    stopLoading: (courseId: string | null = null) => update(state => {
      // Ensure we have the course title before stopping
      if (!state.courseTitle) {
        console.warn('No course title found when stopping loading');
      }
      
      return {
        ...state,
        isLoading: false,
        currentModule: 0,
        currentStep: '',
        progress: 100,
        courseId,
        isCreateCourse: false,
        notification: !state.isInitialBuild ? {
          show: true,
          type: 'success',
          message: `Your Course is ready,\n${state.courseTitle || 'Untitled Course'}`
        } : {
          show: false,
          type: null,
          message: ''
        }
      };
    }),
    setMinimized: (minimized: boolean) => update(state => ({ ...state, minimized })),
    clearState: () => {
      if (browser) {
        localStorage.removeItem('loadingState');
        if (window.loadingStateTimeout) {
          clearTimeout(window.loadingStateTimeout);
        }
      }
      set(getInitialState());
    },
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
      isLoading: error ? true : state.isLoading,
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
    clearError: () => update(state => ({ ...state, error: null }))
  };
};

export const loadingState = createLoadingStore(); 