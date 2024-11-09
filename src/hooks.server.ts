import type { Handle } from '@sveltejs/kit';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '$lib/server/firebase-admin';

export const handle: Handle = async ({ event, resolve }) => {
  try {
    const token = event.cookies.get('firebase-token');
    
    if (token && adminApp.auth) {  // Check if auth is available
      const auth = getAuth(adminApp);
      try {
        const decodedToken = await auth.verifyIdToken(token);
        event.locals.user = decodedToken;
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        event.locals.user = null;
      }
    }
  } catch (error) {
    console.error('Auth error in hooks:', error);
    event.locals.user = null;
  }

  // Add CORS headers
  if (event.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      }
    });
  }

  // Add CORS headers to all responses
  const response = await resolve(event);
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
};
