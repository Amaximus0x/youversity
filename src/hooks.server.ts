import type { Handle } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '$lib/server/firebase-admin';

// Define API routes that require authentication
const protectedApiRoutes = [
  '/api/courses',
  '/api/user',
  '/api/bookmarks',
  '/api/enrollments',
  '/api/likes',
  '/api/notifications',
  '/api/comments',
  '/api/search',
  '/api/search-videos',
  '/api/generate-course',
  '/api/create-final-course'
];

// Define routes that are always public
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/public'
];

// Define if we're in development mode for easier checks
const isDevelopment = process.env.NODE_ENV === 'development';

export const handle: Handle = async ({ event, resolve }) => {
  // Handle health checks
  if (event.url.pathname === '/health') {
    return new Response('OK', { status: 200 });
  }
  
  // Handle authentication
  try {
    // Extract the token using a centralized approach (cookie first, then headers)
    const token = getAuthToken(event);
    const tokenSource = token ? (token === 'dev-mode-mock-token' ? 'dev_mode' : 'valid_token') : 'no_token';
    
    if (token) {
      // In development mode with mock token, create a fake user
      if (isDevelopment && token === 'dev-mode-mock-token') {
        event.locals.user = createDevUser('dev-default-user-id');
      } 
      // In all other cases, verify the token with Firebase Admin
      else {
        try {
          const auth = getAuth(adminApp);
          const decodedToken = await auth.verifyIdToken(token);
          event.locals.user = decodedToken;
        } catch (tokenError) {
          console.error(`Token verification failed for ${event.url.pathname}:`, tokenError);
          event.locals.user = null;
        }
      }
    } else {
      event.locals.user = null;
    }
    
    // Special handling for development
    if (isDevelopment && !event.locals.user) {
      // Handle X-Dev-Test-UID header for development testing
      const devTestUID = event.request.headers.get('X-Dev-Test-UID');
      
      if (devTestUID) {
        event.locals.user = createDevUser(devTestUID);
      }
      // Auto-create a dev user for protected API routes in development
      else if (isProtectedApiEndpoint(event.url.pathname) && !isPublicApiEndpoint(event.url.pathname)) {
        event.locals.user = createDevUser('dev-default-user-id');
      }
    }

    // Handle unauthorized access to protected endpoints
    if (isProtectedApiEndpoint(event.url.pathname) && 
        !isPublicApiEndpoint(event.url.pathname) && 
        !event.locals.user) {
      return createErrorResponse(401, 'Authentication required to access this resource');
    }
  } catch (error) {
    console.error(`Auth error in hooks for ${event.url.pathname}:`, error);
    event.locals.user = null;
    
    // If this is a protected route and auth failed, return 401
    if (isProtectedApiEndpoint(event.url.pathname) && !isPublicApiEndpoint(event.url.pathname)) {
      return createErrorResponse(401, 'Authentication failed');
    }
  }

  // Handle CORS preflight requests
  if (event.request.method === 'OPTIONS') {
    return createCorsResponse(null);
  }

  // Add CORS headers to all responses
  const response = await resolve(event);
  return addCorsHeaders(response, event);
};

// Helper function to extract auth token from various sources
function getAuthToken(event: any): string | null {
  // Try cookie first (most secure)
  const cookieToken = event.cookies.get('firebase-token');
  if (cookieToken) {
    return cookieToken;
  }
  
  // Try Authorization header
  const authHeader = event.request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try custom header
  const customTokenHeader = event.request.headers.get('X-Firebase-Token');
  if (customTokenHeader) {
    return customTokenHeader;
  }
  
  // For development mode only
  if (isDevelopment) {
    return 'dev-mode-mock-token';
  }
  
  // No token found
  return null;
}

// Helper function to create a development user
function createDevUser(uid: string) {
  return {
    uid,
    email: 'dev-test@example.com',
    email_verified: true,
    aud: 'youversity-c8632',
    auth_time: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    firebase: { sign_in_provider: 'custom', identities: {} },
    iat: Math.floor(Date.now() / 1000),
    iss: 'https://securetoken.google.com/youversity-c8632',
    sub: uid
  };
}

// Check if a route is a protected API endpoint
function isProtectedApiEndpoint(pathname: string): boolean {
  return protectedApiRoutes.some(route => pathname.startsWith(route));
}

// Check if a route is a public API endpoint
function isPublicApiEndpoint(pathname: string): boolean {
  return publicApiRoutes.some(route => pathname.startsWith(route));
}

// Create a standardized error response with CORS headers
function createErrorResponse(status: number, message: string): Response {
  return createCorsResponse(JSON.stringify({ 
    error: status === 401 ? 'Unauthorized' : 'Error', 
    message 
  }), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

// Create a response with CORS headers
function createCorsResponse(body: any, options: ResponseInit = {}): Response {
  return new Response(body, {
    ...options,
    headers: {
      ...options.headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID, X-Dev-Test-UID',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}

// Add CORS headers to an existing response
function addCorsHeaders(response: Response, event: any): Response {
  const origin = event.request.headers.get('origin') || '*';
  const newHeaders = new Headers(response.headers);
  
  newHeaders.set('Access-Control-Allow-Origin', origin);
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID, X-Dev-Test-UID');
  newHeaders.set('Access-Control-Allow-Credentials', 'true');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// Set port for production
if (process.env.NODE_ENV === 'production') {
  process.env.PORT = '3000';
  process.env.HOST = '0.0.0.0';
}

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Performing graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Performing graceful shutdown...');
  process.exit(0);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Perform any necessary cleanup
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Perform any necessary cleanup
  process.exit(1);
});