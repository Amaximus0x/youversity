import { writable, type Writable } from 'svelte/store';

function createCurrentModuleStore() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    set: (value: number) => set(value),
    reset: () => set(0),
  };
}

export const currentModuleStore = createCurrentModuleStore();

// Course progress store
export const courseProgressStore: Writable<{
  completedModules: number[];
  // currentModule: number;
  totalModules: number;
}> = writable({
  completedModules: [],
  // currentModule: 0,
  totalModules: 0
});

// Enrollment status store
export const enrollmentStatusStore: Writable<boolean> = writable(false);

// Course details store
export const courseDetailsStore: Writable<any> = writable(null);

// Optional: Add other course-related stores here if needed
// For example:
// export const courseProgressStore = writable<any>(null);
// export const enrollmentStatusStore = writable<boolean>(false); 