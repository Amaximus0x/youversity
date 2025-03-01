import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a writable store with initial value based on browser's online status
// Default to true if not in browser environment
const initialOnlineStatus = browser ? navigator.onLine : true;

// Create the store
export const isOnline = writable<boolean>(initialOnlineStatus);

// Function to update the online status
export function updateOnlineStatus() {
  if (browser) {
    isOnline.set(navigator.onLine);
  }
}

// Set up event listeners if in browser environment
if (browser) {
  // Update the store when the online status changes
  window.addEventListener('online', () => isOnline.set(true));
  window.addEventListener('offline', () => isOnline.set(false));
} 