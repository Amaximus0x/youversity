import type { Handle } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '$lib/server/firebase-admin';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    const token = event.cookies.get('firebase-token');
    if (token) {
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifyIdToken(token);
      event.locals.user = decodedToken;
    }
  } catch (error) {
    console.error('Auth error in hooks:', error);
    event.locals.user = null;
  }

  return resolve(event);
};
