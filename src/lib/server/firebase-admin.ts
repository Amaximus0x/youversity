import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { env } from '$env/dynamic/private';

// Add debug logging
console.log('Firebase Admin Environment Variables:');
console.log('Project ID exists:', !!env.FIREBASE_PROJECT_ID);
console.log('Client Email exists:', !!env.FIREBASE_ADMIN_CLIENT_EMAIL);
console.log('Private Key exists:', !!env.FIREBASE_ADMIN_PRIVATE_KEY);

let app;

try {
  if (getApps().length === 0) {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_ADMIN_CLIENT_EMAIL || !env.FIREBASE_ADMIN_PRIVATE_KEY) {
      throw new Error('Missing required Firebase Admin environment variables');
    }

    app = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  // Provide a fallback for build time
  app = {} as any;
}

export const adminApp = app; 