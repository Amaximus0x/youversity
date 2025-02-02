import { writable, type Writable } from 'svelte/store';

// Create a writable store for the current module index
export const currentModuleStore: Writable<number> = writable(0);

// Course progress store
export const courseProgressStore: Writable<{
  completedModules: number[];
  currentModule: number;
  totalModules: number;
}> = writable({
  completedModules: [],
  currentModule: 0,
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