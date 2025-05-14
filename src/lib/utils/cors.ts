/**
 * Utility function to add CORS headers to a Response
 * This is particularly important for applications that need to 
 * make cross-origin requests to the deployed API
 */
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
  const origin = request.headers.get('origin');
  const headers = new Headers();
  
  // For native apps or requests without origin, we need to allow '*'
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID, X-Requested-With, Accept');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  return new Response(null, {
    status: 204,
    headers
  });
} 