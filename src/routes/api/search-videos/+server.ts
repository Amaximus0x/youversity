import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { GetListByKeyword, createPlaceholderVideo } from '$lib/services/youtubeUtils';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('query')?.trim();
  const moduleTitle = url.searchParams.get('moduleTitle');
  const moduleIndex = parseInt(url.searchParams.get('moduleIndex') || '0');
  const usedVideoIdsParam = url.searchParams.get('usedVideoIds');
  const usedVideoIdsSet = new Set(usedVideoIdsParam ? usedVideoIdsParam.split(',').filter(id => id) : []);

  if (!query) {
    return new Response(JSON.stringify({ 
      error: 'Query parameter is required',
      videos: Array(5).fill(createPlaceholderVideo())
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('Searching videos for:', { query, moduleTitle, moduleIndex, usedVideoIds: Array.from(usedVideoIdsSet) });
    const videos = await GetListByKeyword(query, moduleTitle || '', usedVideoIdsSet, moduleIndex);
    
    if (videos.every(v => !v.videoId)) {
      console.log('No videos found, retrying with simplified query...');
      const simplifiedQuery = query.split(' ').slice(0, 3).join(' ');
      const retryVideos = await GetListByKeyword(simplifiedQuery, moduleTitle || '', usedVideoIdsSet, moduleIndex);
      return json({ videos: retryVideos });
    }

    return json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return json({ 
      videos: Array(5).fill(createPlaceholderVideo())
    });
  }
};