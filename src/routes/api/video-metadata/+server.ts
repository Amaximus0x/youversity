import { json } from '@sveltejs/kit';
import axios from 'axios';

export async function GET({ url }) {
  const videoId = url.searchParams.get('videoId');
  
  if (!videoId) {
    return json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    const html = response.data;
    
    // First try to extract data from ytInitialData
    const ytInitialDataMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
    let title = '';
    let durationSeconds = 0;

    if (ytInitialDataMatch) {
      try {
        const ytInitialData = JSON.parse(ytInitialDataMatch[1]);
        const videoDetails = ytInitialData?.videoDetails || 
                           ytInitialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer;
        
        if (videoDetails) {
          title = videoDetails.title?.runs?.[0]?.text || videoDetails.title?.simpleText || '';
          durationSeconds = parseInt(videoDetails.lengthSeconds) || 0;
        }
      } catch (e) {
        console.error('Error parsing ytInitialData:', e);
      }
    }

    // If not found in ytInitialData, try other patterns
    if (!title || !durationSeconds) {
      // Try to find title in meta tags
      const titlePatterns = [
        /<meta\s+name="title"\s+content="([^"]+)"/i,
        /<meta\s+property="og:title"\s+content="([^"]+)"/i,
        /<title>([^<]+)<\/title>/i,
        /videoDetails":\{"videoId":"[^"]+","title":"([^"]+)"/,
        /"title":"([^"]+)"/
      ];

      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          title = match[1].replace(/\\"/g, '"').replace(/\+/g, ' ').trim();
          if (title.endsWith(' - YouTube')) {
            title = title.slice(0, -10).trim();
          }
          break;
        }
      }

      // Try to find duration
      const durationPatterns = [
        /"lengthSeconds":"(\d+)"/,
        /"lengthSeconds":(\d+)/,
        /approxDurationMs":"(\d+)"/,
        /"duration":"PT(\d+)M(\d+)S"/
      ];

      for (const pattern of durationPatterns) {
        const match = html.match(pattern);
        if (match) {
          if (match[2]) { // PT{M}M{S}S format
            durationSeconds = parseInt(match[1]) * 60 + parseInt(match[2]);
          } else if (match[1].length > 4) { // approxDurationMs
            durationSeconds = Math.round(parseInt(match[1]) / 1000);
          } else { // lengthSeconds
            durationSeconds = parseInt(match[1]);
          }
          break;
        }
      }
    }

    if (!title) {
      return json({ error: 'Could not fetch video title' }, { status: 500 });
    }

    if (!durationSeconds) {
      return json({ error: 'Could not fetch video duration' }, { status: 500 });
    }

    // Convert seconds to minutes with 2 decimal places
    const durationMinutes = parseFloat((durationSeconds / 60).toFixed(2));

    return json({
      success: true,
      data: {
        title,
        duration: durationMinutes
      }
    });
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch video metadata'
    }, { status: 500 });
  }
} 