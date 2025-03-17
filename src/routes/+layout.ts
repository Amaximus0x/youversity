import { redirect, type Load } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { isAuthenticated } from '$lib/stores/auth';
import { browser } from '$app/environment';
import { tokenService } from '$lib/services/tokenService';

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

export const load: Load = async ({ url, route }) => {
  const path = url.pathname;
  
  // Skip auth check for non-browser environments (SSR)
  if (!browser) {
    return {
      hideNav: path === '/'
    };
  }

  try {
    // Refresh auth token if needed (important for automatic token refresh)
    await tokenService.refreshTokenIfNeeded();
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Token refresh failed, continue with potentially invalid token
  }

  // Get the current auth state
  const isUserAuthenticated = get(isAuthenticated);
  
  // Check if the current route requires authentication
  const isAuthRoute = authOnlyRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route));
  
  // Handle auth redirection
  if (isAuthRoute && !isUserAuthenticated) {
    // If authenticated route but user is not authenticated, redirect to login
    const redirectUrl = `/login?redirectTo=${encodeURIComponent(path)}`;
    console.log(`Auth guard: Redirecting unauthenticated user from ${path} to ${redirectUrl}`);
    redirect(302, redirectUrl);
  }
  
  // If user is on login page but is already authenticated, redirect to dashboard
  if (path === '/login' && isUserAuthenticated) {
    console.log('Auth guard: Redirecting authenticated user from login to dashboard');
    redirect(302, '/dashboard');
  }
  
  // Return data for the layout
  return {
    hideNav: path === '/',
    isAuthenticated: isUserAuthenticated
  };
}; 