import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { GetListByKeyword, createPlaceholderVideo } from '$lib/services/youtubeUtils';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('query');
  const moduleTitle = url.searchParams.get('moduleTitle');
  const moduleIndex = parseInt(url.searchParams.get('moduleIndex') || '0');

  if (!query) {
    return new Response('Query parameter is required', { status: 400 });
  }

  try {
    console.log('Searching videos for:', { query, moduleTitle, moduleIndex });
    const videos = await GetListByKeyword(query, moduleTitle || '', new Set<string>(), moduleIndex);
    
    if (videos.every(v => !v.videoId)) {
      console.log('No videos found, retrying with simplified query...');
      // Try one more time with a simplified query
      const simplifiedQuery = query.split(' ').slice(0, 3).join(' ');
      const retryVideos = await GetListByKeyword(simplifiedQuery, moduleTitle || '', new Set<string>(), moduleIndex);
      return json({ videos: retryVideos });
    }

    return json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return json({ 
      videos: Array(3).fill(createPlaceholderVideo())
    });
  }
};