import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { user } from '$lib/stores/auth'; // Assuming your auth store is here

// Define the structure for a single tour step
export interface TourStep {
  id: string;
  target?: string; // Optional: CSS selector for highlighting/positioning later
  content: string; // HTML content for the step
  placement?: 'center' | 'top' | 'bottom' | 'left' | 'right'; // Hint for positioning
  disableOverlay?: boolean;
  isInteractive?: boolean; // Flag for special handling like input fields
  // Add other properties as needed (e.g., beforeShow, afterShow callbacks)
}

// Define the store's state structure
interface TourState {
  isTourActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
  activeTourId: string | null; // ID of the currently active tour
}

// --- Helper functions for localStorage persistence ---

function getTourKey(tourId: string): string | null {
  let currentUserId: string | null = null;
  // Need to synchronously get user ID if possible, or handle async loading
  user.subscribe(u => { currentUserId = u?.uid ?? null; })(); // Get current value, assign null if undefined
  return currentUserId ? `tour-completed-${tourId}-${currentUserId}` : null;
}

function hasCompletedTour(tourId: string): boolean {
  if (!browser) return true; // Assume completed server-side
  const key = getTourKey(tourId);
  if (!key) return true; // Assume completed if no user key
  return localStorage.getItem(key) === 'fully-completed';
}

function markTourAsCompleted(tourId: string | null, status: 'fully-completed' | 'partially-completed') {
  if (!browser) return;
  if (!tourId) {
    console.warn('[TourStore] Attempted to mark tour completed with no activeTourId.');
    return;
  }
  const key = getTourKey(tourId);
  if (key) {
    localStorage.setItem(key, status);
    console.log(`[TourStore] Marked tour ${tourId} as ${status}`);
  }
}

// --- Store Creation ---

const initialState: TourState = {
  isTourActive: false,
  currentStepIndex: -1,
  steps: [],
  activeTourId: null,
};

const { subscribe, set, update }: Writable<TourState> = writable(initialState);

// --- Store Actions ---

function startTour(definedSteps: TourStep[], tourId: string) {
  if (hasCompletedTour(tourId)) {
    console.log(`[TourStore] Tour "${tourId}" already completed, not starting.`);
    return;
  }
  if (definedSteps.length === 0) {
    console.warn('[TourStore] Start called with no steps defined.');
    return;
  }
  console.log(`[TourStore] Starting tour "${tourId}"...`);
  update(state => ({
    ...state,
    steps: definedSteps,
    currentStepIndex: 0,
    isTourActive: true,
    activeTourId: tourId,
  }));
}

function nextStep() {
  update(state => {
    const nextIndex = state.currentStepIndex + 1;
    if (nextIndex >= state.steps.length) {
      // Reached the end, complete the tour
      markTourAsCompleted(state.activeTourId, 'fully-completed');
      return { ...initialState }; // Reset state
    } else {
      return { ...state, currentStepIndex: nextIndex };
    }
  });
}

function prevStep() {
  update(state => {
    const prevIndex = state.currentStepIndex - 1;
    if (prevIndex < 0) {
      return state; // Can't go before the first step
    }
    return { ...state, currentStepIndex: prevIndex };
  });
}

function goToStep(index: number) {
  update(state => {
    if (index >= 0 && index < state.steps.length) {
      return { ...state, currentStepIndex: index };
    }
    return state; // Invalid index
  });
}

function cancelTour() {
  update(state => {
    console.log(`[TourStore] Cancelling tour "${state.activeTourId}".`);
    markTourAsCompleted(state.activeTourId, 'partially-completed');
    return { ...initialState }; // Reset state including activeTourId
  });
}

function completeTour() {
  update(state => {
    console.log(`[TourStore] Completing tour "${state.activeTourId}".`);
    markTourAsCompleted(state.activeTourId, 'fully-completed');
    return { ...initialState }; // Reset state including activeTourId
  });
}

// --- Action to go to a specific step by ID ---
function goToStepById(id: string) {
  update(state => {
    const targetIndex = state.steps.findIndex(step => step.id === id);
    if (targetIndex !== -1) {
      console.log(`[TourStore] Jumping to step ID "${id}" (index ${targetIndex})`);
      return { ...state, currentStepIndex: targetIndex };
    } else {
      console.warn(`[TourStore] Step with ID "${id}" not found.`);
      return state; // No change if ID not found
    }
  });
}

// Export the store and actions
export const tourStore = {
  subscribe,
  startTour,
  nextStep,
  prevStep,
  goToStep,
  goToStepById,
  cancelTour,
  completeTour,
  // Expose completion check if needed elsewhere
  hasCompletedTour,
};
