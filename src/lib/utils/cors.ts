/**
 * Utility function to add CORS headers to a Response
 * This is particularly important for Capacitor apps that load from native context but need to 
 * make cross-origin requests to the deployed API
 */
export function addCorsHeaders(response: Response, request: Request): Response {
  const origin = request.headers.get('origin') || '*';
  
  // Create a new response with the same body but with CORS headers added
  const corsResponse = new Response(response.body, response);
  
  // Add CORS headers
  corsResponse.headers.set('Access-Control-Allow-Origin', origin);
  corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  corsResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID');
  corsResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return corsResponse;
}

/**
 * Handler for OPTIONS requests (preflight CORS requests)
 * Returns a 204 No Content response with CORS headers
 */
export function handleCorsOptions(request: Request): Response {
  const origin = request.headers.get('origin') || '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
} 