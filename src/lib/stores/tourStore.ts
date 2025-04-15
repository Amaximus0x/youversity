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
}

// --- Helper functions for localStorage persistence ---

function getTourKey(): string | null {
  let currentUserId: string | null = null;
  // Need to synchronously get user ID if possible, or handle async loading
  user.subscribe(u => { currentUserId = u?.uid ?? null; })(); // Get current value, assign null if undefined
  return currentUserId ? `tour-completed-${currentUserId}` : null;
}

function hasCompletedTour(): boolean {
  if (!browser) return true; // Assume completed server-side
  const key = getTourKey();
  if (!key) return true; // Assume completed if no user key
  return localStorage.getItem(key) === 'fully-completed';
}

function markTourAsCompleted(status: 'fully-completed' | 'partially-completed') {
  if (!browser) return;
  const key = getTourKey();
  if (key) {
    localStorage.setItem(key, status);
    console.log(`[TourStore] Marked tour as ${status}`);
  }
}

// --- Store Creation ---

const initialState: TourState = {
  isTourActive: false,
  currentStepIndex: -1,
  steps: [],
};

const { subscribe, set, update }: Writable<TourState> = writable(initialState);

// --- Store Actions ---

function startTour(definedSteps: TourStep[]) {
  if (hasCompletedTour()) {
    console.log('[TourStore] Tour already completed, not starting.');
    return;
  }
  if (definedSteps.length === 0) {
    console.warn('[TourStore] Start called with no steps defined.');
    return;
  }
  console.log('[TourStore] Starting tour...');
  update(state => ({
    ...state,
    steps: definedSteps,
    currentStepIndex: 0,
    isTourActive: true,
  }));
}

function nextStep() {
  update(state => {
    const nextIndex = state.currentStepIndex + 1;
    if (nextIndex >= state.steps.length) {
      // Reached the end, complete the tour
      markTourAsCompleted('fully-completed');
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
  console.log('[TourStore] Cancelling tour.');
  markTourAsCompleted('partially-completed');
  set(initialState); // Reset state
}

function completeTour() {
  console.log('[TourStore] Completing tour.');
  markTourAsCompleted('fully-completed');
  set(initialState);
}

// Export the store and actions
export const tourStore = {
  subscribe,
  startTour,
  nextStep,
  prevStep,
  goToStep,
  cancelTour,
  completeTour,
  // Expose completion check if needed elsewhere
  hasCompletedTour,
};
