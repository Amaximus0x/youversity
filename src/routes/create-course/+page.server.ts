import type { PageServerLoad } from './$types';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, tryVerifyToken } from '$lib/server/firebase-admin';

export const load: PageServerLoad = async ({ cookies, request, locals }) => {
  console.log('SERVER: +page.server.ts load function called for create-course');
  console.log('SERVER: URL:', request.url);
  console.log('SERVER: Method:', request.method);
  console.log('SERVER: Headers:', Object.fromEntries([...request.headers.entries()]));
  console.log('SERVER: Request cookies:', cookies.getAll().map(c => c.name).join(', '));
  console.log('SERVER: User in locals:', locals.user ? `User ${locals.user.uid} authenticated` : 'No user in locals');
  
  // DEVELOPMENT MODE SHORTCUT - In development, always return authenticated data
  if (process.env.NODE_ENV === 'development') {
    console.log('SERVER: Using development mode authentication');
    
    // Use locals if available, otherwise create mock user
    const userData = locals.user ? {
      uid: locals.user.uid,
      email: locals.user.email || '',
      isAuthenticated: true
    } : {
      uid: 'dev-user-id',
      email: 'dev-user@example.com',
      isAuthenticated: true
    };
    
    const resultData = {
      serverAuth: {
        user: userData,
        tokenFound: true,
        isAuthenticated: true
      }
    };
    
    console.log('SERVER: Returning development mode auth data:', JSON.stringify(resultData));
    return resultData;
  }
  
  // PRODUCTION MODE - Normal authentication flow below
  // Get token from cookie
  const token = cookies.get('firebase-token');
  console.log('SERVER: Token from cookie:', token ? `Found (length: ${token.length})` : 'Not found');
  
  // Also check Authorization header
  const authHeader = request.headers.get('Authorization');
  console.log('SERVER: Authorization header:', authHeader ? `Found (starts with: ${authHeader.substring(0, 15)}...)` : 'Not found');
  
  let userData = null;
  
  // Check if we already have a user in locals
  if (locals.user) {
    console.log('SERVER: Using user from locals:', locals.user.uid);
    userData = {
      uid: locals.user.uid,
      email: locals.user.email || '',
      isAuthenticated: true
    };
  }
  // If no user in locals, try to verify the token
  else if (token) {
    try {
      console.log('SERVER: Verifying token directly...');
      const decodedToken = await tryVerifyToken(token);
      
      if (decodedToken) {
        console.log('SERVER: Token verified successfully. User:', decodedToken.uid);
        userData = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          isAuthenticated: true
        };
      } else {
        console.error('SERVER: Token verification failed with tryVerifyToken');
      }
    } catch (error) {
      console.error('SERVER: Token verification error:', error);
    }
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const headerToken = authHeader.substring(7);
      console.log('SERVER: Verifying token from Authorization header...');
      const decodedToken = await tryVerifyToken(headerToken);
      
      if (decodedToken) {
        console.log('SERVER: Authorization header token verified successfully. User:', decodedToken.uid);
        userData = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          isAuthenticated: true
        };
      } else {
        console.error('SERVER: Authorization header token verification failed');
      }
    } catch (error) {
      console.error('SERVER: Authorization header token verification error:', error);
    }
  } else {
    console.error('SERVER: No token found in cookie, headers, or locals');
  }
  
  const resultData = {
    serverAuth: {
      user: userData,
      tokenFound: !!token || !!(authHeader && authHeader.startsWith('Bearer ')),
      isAuthenticated: !!userData
    }
  };
  
  console.log('SERVER: Returning data from load function:', JSON.stringify(resultData));
  return resultData;
};