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
    // First try to get token from cookie
    let token = event.cookies.get('firebase-token');
    let tokenSource = token ? 'cookie' : '';
    
    // If no cookie token, check for Authorization header with Bearer token
    if (!token) {
      const authHeader = event.request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        tokenSource = 'auth_header';
        console.log(`Using Bearer token from Authorization header for ${event.url.pathname}`);
      }
    } else {
      console.log(`Using token from cookie for ${event.url.pathname}`);
    }
    
    // If still no token, check for X-Firebase-Token header
    if (!token) {
      const firebaseTokenHeader = event.request.headers.get('X-Firebase-Token');
      if (firebaseTokenHeader) {
        token = firebaseTokenHeader;
        tokenSource = 'x_firebase_header';
        console.log(`Using token from X-Firebase-Token header for ${event.url.pathname}`);
      }
    }
    
    // Use development mode token if in development
    if (!token && isDevelopment) {
      console.log(`DEV MODE: Using mock token for ${event.url.pathname}`);
      // Create a mock token that won't be verified but will be recognized in dev
      token = 'dev-mode-mock-token';
      tokenSource = 'dev_mode_mock';
    }
    
    // If still no token and this is a POST request, check the request body
    if (!token && event.request.method === 'POST' && 
        event.request.headers.get('Content-Type')?.includes('application/json')) {
      try {
        // Clone the request to avoid consuming the body
        const clonedRequest = event.request.clone();
        const body = await clonedRequest.json();
        
        if (body.token) {
          token = body.token;
          tokenSource = 'request_body';
          console.log(`Using token from request body for ${event.url.pathname}`);
        }
      } catch (bodyReadError) {
        console.error(`Error reading request body for token: ${bodyReadError}`);
      }
    }
    
    if (token) {
      console.log(`Token found for ${event.url.pathname} from ${tokenSource}. Token length: ${token.length}`);
      
      // In development mode, skip token verification to avoid Firebase issues
      if (isDevelopment && tokenSource === 'dev_mode_mock') {
        console.log(`DEV MODE: Skipping token verification for ${event.url.pathname}`);
        event.locals.user = {
          uid: 'dev-default-user-id',
          email: 'dev-test@example.com',
          email_verified: true,
          aud: 'youversity-c8632',
          auth_time: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          firebase: { sign_in_provider: 'custom', identities: {} },
          iat: Math.floor(Date.now() / 1000),
          iss: 'https://securetoken.google.com/youversity-c8632',
          sub: 'dev-default-user-id'
        };
      } else {
        console.log('AdminApp type:', typeof adminApp);
        console.log('AdminApp has auth method:', !!adminApp.auth);
        
        if (adminApp.auth) {
          const auth = getAuth(adminApp);
          try {
            console.log(`Verifying token for ${event.url.pathname}...`);
            const decodedToken = await auth.verifyIdToken(token);
            event.locals.user = decodedToken;
            console.log(`User authenticated for ${event.url.pathname}:`, decodedToken.uid);
          } catch (tokenError) {
            console.error(`Token verification error for ${event.url.pathname}:`, tokenError);
            console.error(`Token that failed verification [first 20 chars]: ${token.substring(0, 20)}...`);
            
            // Try to parse the token to see if it's well-formed
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('Token payload:', payload);
                console.log('Token expiration timestamp:', payload.exp);
                console.log('Current timestamp:', Math.floor(Date.now() / 1000));
                console.log('Token expired:', payload.exp < Math.floor(Date.now() / 1000));
              } else {
                console.error('Token is not in correct JWT format');
              }
            } catch (parseError) {
              console.error('Error parsing token:', parseError);
            }
            
            event.locals.user = null;
          }
        } else {
          console.error(`Admin app auth not available for ${event.url.pathname}`);
          event.locals.user = null;
        }
      }
    } else {
      console.log(`No token found for ${event.url.pathname} from any source`);
      event.locals.user = null;
    }
  } catch (error) {
    console.error(`Auth error in hooks for ${event.url.pathname}:`, error);
    event.locals.user = null;
  }

  // Check if this is a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );
  
  // Check if this is a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => 
    event.url.pathname.startsWith(route)
  );
  
  // Special handling for development mode
  if (isDevelopment && event.url.pathname.startsWith('/api/')) {
    console.log(`DEV MODE: Special handling for API request to ${event.url.pathname}`);
    
    // Always set a dev user in locals when in development mode for API routes
    // This helps prevent Firestore auth issues in development
    if (!event.locals.user && isProtectedApiRoute) {
      const devTestUID = event.request.headers.get('X-Dev-Test-UID') || 'dev-default-user-id';
      console.log(`DEV MODE: Creating test user with UID ${devTestUID} for ${event.url.pathname}`);
      
      event.locals.user = {
        uid: devTestUID,
        email: 'dev-test@example.com',
        email_verified: true,
        aud: 'youversity-c8632',
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { sign_in_provider: 'custom', identities: {} },
        iat: Math.floor(Date.now() / 1000),
        iss: 'https://securetoken.google.com/youversity-c8632',
        sub: devTestUID
      };
      
      // Skip further token verification in development mode for API routes
      return await resolve(event);
    }
  }
  
  // For development, allow a dev-test-uid header for testing
  if (!event.locals.user && isDevelopment) {
    // Check for test UID header
    const devTestUID = event.request.headers.get('X-Dev-Test-UID');
    
    if (devTestUID) {
      console.log(`DEV MODE: Using test UID ${devTestUID} for ${event.url.pathname}`);
      event.locals.user = {
        uid: devTestUID,
        email: 'dev-test@example.com',
        email_verified: true,
        aud: 'mock-project-id',
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { sign_in_provider: 'custom', identities: {} },
        iat: Math.floor(Date.now() / 1000),
        iss: 'https://securetoken.google.com/mock-project-id',
        sub: devTestUID
      };
    } 
    // If we're in development mode and no X-Dev-Test-UID header, create a mock user for protected routes
    else if (isProtectedApiRoute) {
      console.log(`DEV MODE: Creating default test user for ${event.url.pathname}`);
      event.locals.user = {
        uid: 'dev-default-user-id',
        email: 'dev-test@example.com',
        email_verified: true,
        aud: 'mock-project-id',
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        firebase: { sign_in_provider: 'custom', identities: {} },
        iat: Math.floor(Date.now() / 1000),
        iss: 'https://securetoken.google.com/mock-project-id',
        sub: 'dev-default-user-id'
      };
    }
  }
  
  // If it's a protected API route and user is not authenticated, return 401
  if (isProtectedApiRoute && !isPublicApiRoute && !event.locals.user) {
    console.error(`Unauthorized access to ${event.url.pathname}`);
    return new Response(JSON.stringify({ 
      error: 'Unauthorized', 
      message: 'Authentication required to access this resource' 
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': event.request.headers.get('origin') || '',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }

  // Add CORS headers
  if (event.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Origin': event.request.headers.get('origin') || '',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }

  // Add CORS headers to all responses
  const response = await resolve(event);
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', event.request.headers.get('origin') || '');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID');
  newHeaders.set('Access-Control-Allow-Credentials', 'true');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};

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