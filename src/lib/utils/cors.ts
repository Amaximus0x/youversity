/**
 * Utility function to add CORS headers to a Response
 * This is particularly important for applications that need to 
 * make cross-origin requests to the deployed API
 */
import type { RequestEvent } from '@sveltejs/kit';

export function addCorsHeaders(response: Response, request: Request): Response {
  const origin = request.headers.get('origin');
  
  // Create a new response with the same body but with CORS headers added
  const corsResponse = new Response(response.body, response);
  
  // For native apps or requests without origin, we need to allow '*'
  // But when credentials are included, we must specify an exact origin
  if (origin) {
    corsResponse.headers.set('Access-Control-Allow-Origin', origin);
    corsResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    corsResponse.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID, X-Requested-With, Accept');
  
  // Add cache control headers to avoid preflight caching issues
  corsResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  return corsResponse;
}

/**
 * Handler for OPTIONS requests (preflight CORS requests)
 * Returns a 204 No Content response with CORS headers
 */
export function handleCorsOptions(request: Request): Response {
  // Create headers for OPTIONS response
  const headers = new Headers({
    'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '3600', // Cache preflight for 1 hour
  });

  return new Response(null, {
    status: 204,
    headers,
  });
}

// Log and handle CORS request details (debugging helper)
export function logCorsRequest(event: RequestEvent) {
  console.log('-------- CORS Request Details --------');
  console.log('Request URL:', event.url.toString());
  console.log('Request method:', event.request.method);
  console.log('Origin header:', event.request.headers.get('origin'));
  console.log('User-Agent:', event.request.headers.get('user-agent'));
  console.log('Credentials mode:', event.request.credentials);
  console.log('Access-Control-Request-Method:', event.request.headers.get('access-control-request-method'));
  console.log('Access-Control-Request-Headers:', event.request.headers.get('access-control-request-headers'));
  console.log('X-Forwarded-For:', event.request.headers.get('x-forwarded-for'));
  console.log('--------------------------------------');
} 