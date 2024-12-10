import { writable } from 'svelte/store';
import { browser } from '$app/environment';

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
    isCreateCourse: false
  };
};

const createLoadingStore = () => {
  const { subscribe, set, update } = writable<LoadingState>(getInitialState());
  let minimizeTimeout: ReturnType<typeof setTimeout> | null = null;

  if (browser) {
    subscribe(state => {
      localStorage.setItem('loadingState', JSON.stringify(state));
    });
  }

  return {
    subscribe,
    startLoading: (courseTitle: string = '', isInitialBuild: boolean = false, isCreateCourse: boolean = false) => {
      // Clear any existing timeout
      if (minimizeTimeout) {
        clearTimeout(minimizeTimeout);
        minimizeTimeout = null;
      }

      update(state => ({
        ...state,
        isLoading: true,
        currentModule: 0,
        progress: 0,
        courseTitle,
        isInitialBuild,
        isCreateCourse,
        minimized: false // Reset minimized state when starting
      }));

      // Set up auto-minimize only for create-course
      if (isCreateCourse && browser) {
        minimizeTimeout = setTimeout(() => {
          update(state => ({ ...state, minimized: true }));
        }, 3000);
      }
    },
    stopLoading: (courseId: string | null = null) => {
      // Clear timeout if it exists
      if (minimizeTimeout) {
        clearTimeout(minimizeTimeout);
        minimizeTimeout = null;
      }

      update(state => ({
        ...state,
        isLoading: false,
        currentModule: 0,
        currentStep: '',
        progress: 100,
        courseId,
        isCreateCourse: false
      }));
    },
    setMinimized: (minimized: boolean) => update(state => ({ ...state, minimized })),
    clearState: () => {
      if (minimizeTimeout) {
        clearTimeout(minimizeTimeout);
        minimizeTimeout = null;
      }
      if (browser) localStorage.removeItem('loadingState');
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
      isLoading: error ? true : state.isLoading
    })),
    clearError: () => update(state => ({ ...state, error: null }))
  };
};

export const loadingState = createLoadingStore(); 