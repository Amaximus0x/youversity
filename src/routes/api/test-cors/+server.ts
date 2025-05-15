import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addCorsHeaders, handleCorsOptions } from '$lib/utils/cors';

// Add OPTIONS handler for CORS preflight requests
export const OPTIONS: RequestHandler = async ({ request }) => {
  return handleCorsOptions(request);
};

export const GET: RequestHandler = async ({ request }) => {
  console.log("CORS test endpoint accessed from origin:", request.headers.get('origin'));
  
  const response = json({
    success: true,
    message: "CORS test successful",
    origin: request.headers.get('origin') || 'No origin header',
    timestamp: new Date().toISOString()
  });
  
  // Add CORS headers to the response
  return addCorsHeaders(response, request);
}; 