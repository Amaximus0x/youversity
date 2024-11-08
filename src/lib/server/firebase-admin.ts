import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { env } from '$env/dynamic/private';

if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_ADMIN_CLIENT_EMAIL || !env.FIREBASE_ADMIN_PRIVATE_KEY) {
  throw new Error('Missing Firebase Admin environment variables');
}

export const adminApp = getApps().length === 0 
  ? initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    })
  : getApps()[0]; 