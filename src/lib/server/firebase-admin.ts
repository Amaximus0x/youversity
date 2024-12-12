import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { env } from '$env/dynamic/private';

// Add detailed debug logging
console.log('Firebase Admin Environment Variables:');
console.log('Project ID:', env.FIREBASE_PROJECT_ID);
console.log('Client Email:', env.FIREBASE_ADMIN_CLIENT_EMAIL);
console.log('Private Key length:', env.FIREBASE_ADMIN_PRIVATE_KEY?.length);

let app;

try {
  if (getApps().length === 0) {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_ADMIN_CLIENT_EMAIL || !env.FIREBASE_ADMIN_PRIVATE_KEY) {
      const missingVars = [];
      if (!env.FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
      if (!env.FIREBASE_ADMIN_CLIENT_EMAIL) missingVars.push('FIREBASE_ADMIN_CLIENT_EMAIL');
      if (!env.FIREBASE_ADMIN_PRIVATE_KEY) missingVars.push('FIREBASE_ADMIN_PRIVATE_KEY');
      
      throw new Error(`Missing required Firebase Admin environment variables: ${missingVars.join(', ')}`);
    }

    const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log('Initializing Firebase Admin with config:', {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKeyLength: privateKey.length
    });

    app = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey
      })
    });
    
    console.log('Firebase Admin initialized successfully');
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase Admin app');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  if (error instanceof Error) {
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
  // In development, provide a mock app to allow the server to start
  if (process.env.NODE_ENV === 'development') {
    console.warn('Using mock Firebase Admin app for development');
    app = {} as any;
  } else {
    throw error; // In production, we want to fail fast if Firebase Admin fails to initialize
  }
}

export const adminApp = app; 