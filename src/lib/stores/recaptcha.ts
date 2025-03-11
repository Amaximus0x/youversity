import { writable } from 'svelte/store';

export const recaptchaToken = writable<string | null>(null);

// Initialize reCAPTCHA
export const initRecaptcha = (siteKey: string): Promise<void> => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (typeof window !== 'undefined' && window.grecaptcha) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      resolve();
    };
    
    // Add script to document
    document.head.appendChild(script);
  });
}; 