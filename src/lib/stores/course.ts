import { writable, type Writable, derived } from 'svelte/store';
import type { EnrollmentProgress } from '$lib/types/course';

function createCurrentModuleStore() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    set: (value: number) => set(value),
    reset: () => set(0),
  };
}

export const currentModuleStore = createCurrentModuleStore();

// Create a store for enrollment progress
export const enrollmentProgressStore: Writable<EnrollmentProgress | null> = writable(null);

// Derived store for progress percentage
export const courseProgressPercentage = derived(
  enrollmentProgressStore,
  ($progress) => {
    if (!$progress?.completedModules || !$progress.moduleProgress) return 0;
    return Math.round(
      ($progress.completedModules.length / $progress.moduleProgress.length) * 100
    );
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