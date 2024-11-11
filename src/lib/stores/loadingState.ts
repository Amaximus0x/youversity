import { writable } from 'svelte/store';

type LoadingState = {
  isLoading: boolean;
  currentModule: number;
  totalModules: number;
};

const createLoadingStore = () => {
  const { subscribe, set, update } = writable<LoadingState>({
    isLoading: false,
    currentModule: 0,
    totalModules: 0,
  });

  return {
    subscribe,
    startLoading: () => update(state => ({ ...state, isLoading: true })),
    stopLoading: () => update(state => ({ ...state, isLoading: false, currentModule: 0 })),
    setCurrentModule: (module: number) => update(state => ({ ...state, currentModule: module })),
    setTotalModules: (total: number) => update(state => ({ ...state, totalModules: total })),
    reset: () => set({ isLoading: false, currentModule: 0, totalModules: 0 })
  };
};

export const loadingState = createLoadingStore(); 