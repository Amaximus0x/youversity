import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface ModalState {
  isMinimized: boolean;
}

function getStoredModalState(): ModalState {
  if (browser) {
    const stored = localStorage.getItem('modalState');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return { isMinimized: false };
}

function createModalState() {
  const { subscribe, set, update } = writable<ModalState>(getStoredModalState());

  if (browser) {
    subscribe(state => {
      localStorage.setItem('modalState', JSON.stringify(state));
    });
  }

  return {
    subscribe,
    setMinimized: (value: boolean) => update(state => ({ ...state, isMinimized: value })),
    reset: () => {
      const newState = { isMinimized: false };
      set(newState);
      if (browser) {
        localStorage.removeItem('modalState');
      }
    }
  };
}

export const modalState = createModalState(); 