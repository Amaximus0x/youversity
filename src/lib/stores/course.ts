import { writable } from 'svelte/store';

// Create a writable store for the current module index
export const currentModuleStore = writable<number>(0);

// Optional: Add other course-related stores here if needed
// For example:
// export const courseProgressStore = writable<any>(null);
// export const enrollmentStatusStore = writable<boolean>(false); 