import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import type { CourseStructure, FinalCourseStructure, VideoItem } from '$lib/types/course';
import { addCorsHeaders, handleCorsOptions } from '$lib/utils/cors';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add OPTIONS handler for CORS preflight requests
export const OPTIONS: RequestHandler = async ({ request }) => {
  return handleCorsOptions(request);
};

export const POST: RequestHandler = async ({ request }) => {
  // Move your course service logic here
  // This will run on the server side where it's safe to use private env variables
  const response = json({ status: 'ok' });
  return addCorsHeaders(response, request);
}; 