import { redirect, type Load } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { isAuthenticated, user } from '$lib/stores/auth';
import { browser } from '$app/environment';
import { tokenService } from '$lib/services/tokenService';
import { auth } from '$lib/firebase';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/about', '/contact'];

// List of auth-only routes that require authentication
const authOnlyRoutes = [
  '/dashboard',
  '/trending',
  '/my-courses',
  '/bookmarks',
  '/create-course',
  '/settings',
  '/course',
  '/search'
];

// Helper function to wait for auth state to be fully initialized
const waitForAuthState = async (maxWaitTime = 2000): Promise<boolean> => {
  // If we already have a user, no need to wait
  if (get(user) !== null) {
    console.log('Auth state check: User found in store');
    return true;
  }
  
  // We're already authenticated via the store
  if (get(isAuthenticated)) {
    console.log('Auth state check: isAuthenticated is true');
    return true;
  }
  
  // Check if Firebase auth has a current user but the store hasn't updated yet
  if (auth.currentUser) {
    console.log('Auth state check: User found in Firebase but not in store');
    // Set a small timeout to allow the store to update
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
  
  console.log('Auth state check: Waiting for auth state to resolve...');
  
  // Check token in cookie as a fallback
  if (browser) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'firebase-token' && value) {
        console.log('Auth state check: Token found in cookie, waiting for auth state to catch up');
        // If we find a token in cookie, we should give more time for auth to initialize
        maxWaitTime = Math.max(maxWaitTime, 2500);
        break;
      }
    }
  }
  
  // Wait for auth state to resolve with Promise
  return new Promise(resolve => {
    // Set up a timeout for max wait time
    const timeout = setTimeout(() => {
      // Clean up listener
      unsubscribe();
      console.log(`Auth state check: Wait timed out after ${maxWaitTime}ms`);
      
      // Final check after timeout
      const finalAuthCheck = get(isAuthenticated) || !!auth.currentUser;
      console.log(`Auth state check: Final check after timeout: ${finalAuthCheck}`);
      resolve(finalAuthCheck);
    }, maxWaitTime);
    
    // Listen for auth state changes
    const unsubscribe = user.subscribe(currentUser => {
      if (currentUser !== null) {
        console.log('Auth state check: User detected in subscription');
        clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      }
    });
  });
};

export const load: Load = async ({ url, route }) => {
  const path = url.pathname;
  
  // Skip auth check for non-browser environments (SSR)
  if (!browser) {
    return {
      hideNav: path === '/'
    };
  }

  console.log(`Route load: ${path}`);

  // Check if this is an auth route
  const isAuthRoute = authOnlyRoutes.some(route => path.startsWith(route));
  const isLoginPage = path === '/login';
  
  try {
    // Always wait for auth state to be initialized, but wait longer for auth-required routes
    if (isAuthRoute) {
      console.log(`Auth required route detected: ${path}`);
      // Wait for auth state to be fully initialized with longer timeout
      await waitForAuthState(2500);
    } else if (isLoginPage) {
      // For login page we need to know auth state to redirect if already logged in
      await waitForAuthState(2000);
    } else {
      // For other routes, shorter wait time is fine
      await waitForAuthState(1000);
    }
    
    // Now refresh token if needed
    await tokenService.refreshTokenIfNeeded();
  } catch (error) {
    console.error('Error during auth initialization:', error);
  }

  // Get the current auth state after waiting
  const isUserAuthenticated = get(isAuthenticated) || !!auth.currentUser;
  console.log(`Auth state for ${path}: authenticated = ${isUserAuthenticated}`);
  
  // Additional safety check for auth state
  if (isAuthRoute && !isUserAuthenticated) {
    // Check Firebase directly one more time
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      console.log(`Firebase auth user found directly: ${currentUser.uid}`);
      return {
        hideNav: path === '/',
        isAuthenticated: true
      };
    }
    
    // If authenticated route but user is not authenticated, redirect to login
    const redirectUrl = `/login?redirectTo=${encodeURIComponent(path)}`;
    console.log(`Auth guard: Redirecting unauthenticated user from ${path} to ${redirectUrl}`);
    redirect(302, redirectUrl);
  }
  
  // If user is on login page but is already authenticated, redirect to dashboard
  if (isLoginPage && isUserAuthenticated) {
    console.log('Auth guard: Redirecting authenticated user from login to dashboard');
    redirect(302, '/dashboard');
  }
  
  // Return data for the layout
  return {
    hideNav: path === '/',
    isAuthenticated: isUserAuthenticated
  };
}; 