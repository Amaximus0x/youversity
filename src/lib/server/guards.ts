import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '$lib/server/firebase-admin';

export async function requireAuth(event: RequestEvent) {
  try {
    const auth = getAuth(adminApp);
    const token = event.cookies.get('firebase-token');
    
    if (!token) {
      throw redirect(303, `/?redirectTo=${event.url.pathname}`);
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      
      // Check if token is about to expire (within 5 minutes)
      const tokenExp = decodedToken.exp * 1000; // Convert to milliseconds
      const fiveMinutes = 5 * 60 * 1000;
      
      if (Date.now() + fiveMinutes >= tokenExp) {
        throw new Error('Token about to expire');
      }
      
      return decodedToken;
    } catch (tokenError) {
      // Token is invalid or about to expire
      event.cookies.delete('firebase-token', { path: '/' });
      throw redirect(303, `/?redirectTo=${event.url.pathname}`);
    }
  } catch (error) {
    console.error('Auth error:', error);
    throw redirect(303, `/?redirectTo=${event.url.pathname}`);
  }
}
