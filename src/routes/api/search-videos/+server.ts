import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { GetListByKeyword, createPlaceholderVideo } from '$lib/services/youtubeUtils';
import { addCorsHeaders, handleCorsOptions } from '$lib/utils/cors';

// Add OPTIONS handler for CORS preflight requests
export const OPTIONS: RequestHandler = async ({ request }) => {
  return handleCorsOptions(request);
};

export const GET: RequestHandler = async ({ url, request }) => {
  const query = url.searchParams.get('query')?.trim();
  const moduleTitle = url.searchParams.get('moduleTitle');
  const moduleIndex = parseInt(url.searchParams.get('moduleIndex') || '0');
  const usedVideoIdsParam = url.searchParams.get('usedVideoIds');
  const usedVideoIdsSet = new Set(usedVideoIdsParam ? usedVideoIdsParam.split(',').filter(id => id) : []);

  if (!query) {
    const errorResponse = new Response(JSON.stringify({ 
      error: 'Query parameter is required',
      videos: Array(5).fill(createPlaceholderVideo())
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return addCorsHeaders(errorResponse, request);
  }

  try {
    console.log('Searching videos for:', { query, moduleTitle, moduleIndex, usedVideoIds: Array.from(usedVideoIdsSet) });
    const videos = await GetListByKeyword(query, moduleTitle || '', usedVideoIdsSet, moduleIndex);
    
    if (videos.every(v => !v.videoId)) {
      console.log('No videos found, retrying with simplified query...');
      const simplifiedQuery = query.split(' ').slice(0, 3).join(' ');
      const retryVideos = await GetListByKeyword(simplifiedQuery, moduleTitle || '', usedVideoIdsSet, moduleIndex);
      const successResponse = json({ videos: retryVideos });
      return addCorsHeaders(successResponse, request);
    }

    const successResponse = json({ videos });
    return addCorsHeaders(successResponse, request);
  } catch (error) {
    console.error('Error fetching videos:', error);
    const errorResponse = json({ 
      videos: Array(5).fill(createPlaceholderVideo())
    });
    return addCorsHeaders(errorResponse, request);
  }
};