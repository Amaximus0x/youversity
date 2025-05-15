import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { handleCorsOptions, logCorsRequest } from '$lib/utils/cors';

export const OPTIONS: RequestHandler = async ({ request }) => {
  return handleCorsOptions(request);
};

export const GET: RequestHandler = async ({ request, locals, url }) => {
  // Log detailed information about the request for debugging
  console.log('-------- Auth Status Request --------');
  console.log('Auth status request from origin:', request.headers.get('origin'));
  console.log('Headers:', Object.fromEntries([...request.headers.entries()]));
  console.log('User authenticated:', !!locals.user);
  console.log('------------------------------------');
  
  // Return auth status and request details
  return json({
    status: 'success',
    authenticated: !!locals.user,
    user: locals.user ? {
      uid: locals.user.uid,
      email: locals.user.email
    } : null,
    request: {
      origin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent'),
      host: url.host,
      protocol: url.protocol,
      method: request.method
    },
    message: 'CORS test successful for auth status check',
    timestamp: new Date().toISOString()
  });
}; 