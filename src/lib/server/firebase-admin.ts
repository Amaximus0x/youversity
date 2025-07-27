import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '$env/dynamic/private';

// Add detailed debug logging
console.log('Firebase Admin Environment Variables:');
console.log('Project ID:', env.FIREBASE_PROJECT_ID);
console.log('Client Email:', env.FIREBASE_ADMIN_CLIENT_EMAIL?.substring(0, 10) + '...');
console.log('Private Key length:', env.FIREBASE_ADMIN_PRIVATE_KEY?.length);

// Add atob polyfill for Node.js environment
function safeAtob(base64: string) {
  try {
    // Add padding if needed
    const normalizedBase64 = base64
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    // For browser environments
    if (typeof atob === 'function') {
      return atob(normalizedBase64);
    }
    // For Node.js environments
    return Buffer.from(normalizedBase64, 'base64').toString('binary');
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '';
  }
}

let app;

try {
  if (getApps().length === 0) {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_ADMIN_CLIENT_EMAIL || !env.FIREBASE_ADMIN_PRIVATE_KEY) {
      const missingVars: string[] = [];
      if (!env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
      if (!env.FIREBASE_ADMIN_CLIENT_EMAIL) missingVars.push('FIREBASE_ADMIN_CLIENT_EMAIL');
      if (!env.FIREBASE_ADMIN_PRIVATE_KEY) missingVars.push('FIREBASE_ADMIN_PRIVATE_KEY');
      
      console.error('Missing required Firebase Admin environment variables:', missingVars);
      throw new Error(`Missing required Firebase Admin environment variables: ${missingVars.join(', ')}`);
    }

    const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log('Initializing Firebase Admin with config:', {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKeyLength: privateKey.length,
      privateKeyStart: privateKey.substring(0, 20) + '...'
    });

    try {
      console.log('Creating Firebase Admin app...');
      app = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey
        })
      });
      console.log('Firebase Admin app created:', !!app);
      console.log('Firebase Admin initialized successfully');
    } catch (initError) {
      console.error('Error during Firebase Admin initialization:', initError);
      throw initError;
    }
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase Admin app');
  }
  
  // Test Admin auth functionality
  console.log('Testing Firebase Admin auth...');
  const auth = app.auth ? app.auth() : null;
  console.log('Firebase Admin auth available:', !!auth);
  
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  if (error instanceof Error) {
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
  // In development, provide a mock app with functional auth method
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using mock Firebase Admin app for development');
    // Create a mock app with an auth function that returns a mock auth object
    app = {
      auth: () => ({
        verifyIdToken: async (token: string) => {
          console.log('MOCK ADMIN: Verifying token of length:', token.length);
          
          try {
            // Try to decode the token to extract user data (for development only)
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              // Use the safe atob function we defined
              const payload = JSON.parse(safeAtob(tokenParts[1]));
              console.log('MOCK ADMIN: Token payload:', payload);
              
              // Return a mock decoded token
              return {
                uid: payload.user_id || payload.sub || 'mock-user-id',
                email: payload.email || 'mock@example.com',
                email_verified: true,
                iat: Date.now() / 1000,
                exp: (Date.now() / 1000) + 3600,
                auth_time: Date.now() / 1000,
                ...payload
              };
            } else {
              throw new Error('Invalid token format');
            }
          } catch (error) {
            console.error('MOCK ADMIN: Token verification error:', error);
            throw new Error('Invalid token');
          }
        }
      }),
      // Add mock firestore for development
      firestore: () => ({
        collection: (name: string) => ({
          add: async (data: any) => {
            console.log('MOCK FIRESTORE: Adding document to collection:', name);
            console.log('MOCK FIRESTORE: Document data:', data);
            const mockId = 'mock-course-' + Date.now();
            console.log('MOCK FIRESTORE: Generated mock ID:', mockId);
            return { id: mockId };
          }
        })
      })
    };
    console.log('Mock Firebase Admin initialized with auth and firestore support');
  } else {
    throw error; // In production, we want to fail fast if Firebase Admin fails to initialize
  }
}

/**
 * Attempts to verify a Firebase token with detailed error logging
 * This is useful for debugging token verification issues
 */
export async function tryVerifyToken(token: string) {
  if (!token) {
    console.error('No token provided to tryVerifyToken');
    return null;
  }
  
  console.log('tryVerifyToken: Attempting to verify token of length:', token.length);
  console.log('tryVerifyToken: Token first 20 chars:', token.substring(0, 20));
  
  try {
    // Check if token is well-formed
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('tryVerifyToken: Token does not have 3 parts, invalid JWT format');
      return null;
    }
    
    // Try to decode payload for debugging
    try {
      const payload = JSON.parse(safeAtob(tokenParts[1]));
      console.log('tryVerifyToken: Token payload:', payload);
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.error('tryVerifyToken: Token expired', {
          expiration: new Date(payload.exp * 1000).toISOString(),
          currentTime: new Date(currentTime * 1000).toISOString(),
          difference: (payload.exp - currentTime) / 60 + ' minutes'
        });
      }
      
      if (!payload.user_id && !payload.sub) {
        console.error('tryVerifyToken: Token does not contain user ID (user_id or sub field)');
      }
    } catch (decodeError) {
      console.error('tryVerifyToken: Error decoding token payload:', decodeError);
    }
    
    // Attempt official verification
    if (app.auth) {
      const auth = app.auth();
      try {
        const decodedToken = await auth.verifyIdToken(token);
        console.log('tryVerifyToken: Token verification successful. User ID:', decodedToken.uid);
        return decodedToken;
      } catch (verifyError) {
        console.error('tryVerifyToken: Official verification failed:', verifyError);
        
        // If in development, try the mock verification as backup
        if (process.env.NODE_ENV === 'development') {
          console.log('tryVerifyToken: Trying mock verification for development...');
          try {
            // Parse the token payload again to use as mock data
            const payload = JSON.parse(safeAtob(tokenParts[1]));
            return {
              uid: payload.user_id || payload.sub || 'mock-user-id',
              email: payload.email || 'mock@example.com',
              email_verified: true,
              ...payload
            };
          } catch (mockError) {
            console.error('tryVerifyToken: Mock verification also failed:', mockError);
            return null;
          }
        }
        
        return null;
      }
    } else {
      console.error('tryVerifyToken: No auth method available on app');
      return null;
    }
  } catch (error) {
    console.error('tryVerifyToken: Unexpected error:', error);
    return null;
  }
}

export const adminApp = app;

// Export Firestore instance
export const adminDb = app ? (app.firestore ? app.firestore() : getFirestore(app)) : null; 