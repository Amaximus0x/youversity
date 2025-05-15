import { redirect, type Load } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { isAuthenticated, user } from '$lib/stores/auth';
import { browser } from '$app/environment';
import { tokenService } from '$lib/services/tokenService';
import { auth } from '$lib/firebase';
import { Capacitor } from '@capacitor/core';

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
  if (get(user) !== null) return true;
  if (get(isAuthenticated)) return true;
  if (auth.currentUser) {
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
  if (browser) {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'firebase-token' && value) {
        maxWaitTime = Math.max(maxWaitTime, 2500);
        break;
      }
    }
  }
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(get(isAuthenticated) || !!auth.currentUser);
    }, maxWaitTime);
    const unsubscribe = user.subscribe(currentUser => {
      if (currentUser !== null) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      }
    });
  });
};

// Define the initial route based on platform
const getInitialRoute = (isNativePlatform: boolean, isUserAuthenticated: boolean): string => {
  if (isNativePlatform) {
    return isUserAuthenticated ? '/dashboard' : '/login';
  }
  return '/'; // Default to landing page for web
};

export const load: Load = async ({ url, route }) => {
  const path = url.pathname;
  
  // SSR: skip browser logic
  if (!browser) {
    return {
      hideNav: path === '/'
    };
  }

  const platform = Capacitor.getPlatform();
  const isNative = platform === 'android' || platform === 'ios';

  // Wait for auth state to be initialized (shorter wait for initial determination)
  await waitForAuthState(1000);
  const isUserAuthenticated = get(isAuthenticated) || !!auth.currentUser;
  
  // On native platforms, when at root path, immediately navigate to appropriate starting route
  if (isNative && path === '/') {
    const initialRoute = getInitialRoute(isNative, isUserAuthenticated);
    redirect(302, initialRoute);
  }
  
  const isAuthRoute = authOnlyRoutes.some(route => path.startsWith(route));
  const isLoginPage = path === '/login';
  
  // Wait for auth state to be fully initialized for auth-dependent routes
  if (isAuthRoute || isLoginPage) {
    await waitForAuthState(isAuthRoute ? 3000 : 2000);
  }
    
  // Always refresh token if needed
  await tokenService.refreshTokenIfNeeded();

  // Re-check auth state after potential refresh
  const updatedIsUserAuthenticated = get(isAuthenticated) || !!auth.currentUser;

  // --- Improved Native Auth Guard ---
  if (isNative && isAuthRoute && !updatedIsUserAuthenticated) {
    // On native, always redirect to login for protected routes if not authenticated
    redirect(302, '/login');
  }
  // --- End Improved Native Auth Guard ---

  // Existing web auth guard
  if (isAuthRoute && !updatedIsUserAuthenticated) {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return {
        hideNav: path === '/',
        isAuthenticated: true
      };
    }
    if (browser) {
      const hasToken = localStorage.getItem('youversity_auth_token') || 
                       document.cookie.includes('firebase-token=');
      if (hasToken) {
        return {
          hideNav: path === '/',
          isAuthenticated: true
        };
      }
    }
    const redirectUrl = `/login?redirectTo=${encodeURIComponent(path)}`;
    redirect(302, redirectUrl);
  }
  
  // If user is on login page but is already authenticated, redirect to dashboard
  if (isLoginPage && updatedIsUserAuthenticated) {
    const redirectTo = url.searchParams.get('redirectTo');
    if (redirectTo) {
      redirect(302, redirectTo);
    } else {
      redirect(302, '/dashboard');
    }
  }
  
  return {
    hideNav: path === '/',
    isAuthenticated: updatedIsUserAuthenticated
  };
}; 

export const prerender = false;
export const ssr = true; 