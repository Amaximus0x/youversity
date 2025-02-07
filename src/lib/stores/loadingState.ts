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
    startLoading: (title: string, showProgress = true, isInitialBuild = true) => 
      update(state => ({
        ...state,
        isLoading: true,
        courseTitle: title,
        isInitialBuild,
        progress: 0
      })),
    stopLoading: (courseId?: string) => 
      update(state => ({
        ...state,
        courseId: courseId || null,
        isLoading: false
      })),
    setMinimized: (minimized: boolean) => update(state => ({ ...state, minimized })),
    clearState: () => update(state => {
      const newState = {
        isLoading: false,
        progress: 0,
        currentStep: '',
        error: null,
        currentModule: 0,
        totalModules: 0,
        courseId: state.courseId,
        courseTitle: state.courseTitle,
        isInitialBuild: true
      };
      
      if (!state.minimized) {
        newState.courseId = null;
        newState.courseTitle = '';
      }
      
      return newState;
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