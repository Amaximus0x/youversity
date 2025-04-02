import { json } from '@sveltejs/kit';
import axios from 'axios';

export async function GET({ url }) {
  const videoId = url.searchParams.get('videoId');
  
  if (!videoId) {
    return json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    // Try to fetch from Invidious API first (more reliable)
    try {
      const invidiousResponse = await axios.get(`https://invidious.protokolla.fi/api/v1/videos/${videoId}`, {
        timeout: 8000
      });
      
      if (invidiousResponse.data && invidiousResponse.data.title) {
        const title = invidiousResponse.data.title;
        const durationSeconds = invidiousResponse.data.lengthSeconds || 0;
        
        if (title && durationSeconds) {
          // Convert seconds to minutes with 2 decimal places
          const durationMinutes = parseFloat((durationSeconds / 60).toFixed(2));
          
          return json({
            success: true,
            data: {
              title,
              duration: durationMinutes
            }
          });
        }
      }
    } catch (invidiousError) {
      console.log('Failed to fetch from Invidious, falling back to scraping:', invidiousError.message);
    }

    // Fallback to scraping YouTube directly
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000
    });

    const html = response.data;
    let title = '';
    let durationSeconds = 0;

    // Try to extract data from ytInitialPlayerResponse first
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (playerResponseMatch) {
      try {
        const playerResponse = JSON.parse(playerResponseMatch[1]);
        const videoDetails = playerResponse?.videoDetails;
        if (videoDetails) {
          title = videoDetails.title || '';
          durationSeconds = parseInt(videoDetails.lengthSeconds) || 0;
        }
      } catch (e) {
        console.error('Error parsing ytInitialPlayerResponse:', e);
      }
    }

    // If not found, try ytInitialData
    if (!title || !durationSeconds) {
      const ytInitialDataMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
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
    }

    // If still not found, try meta tags and other patterns
    if (!title || !durationSeconds) {
      // Try to find title in meta tags
      const titlePatterns = [
        /<meta\s+name="title"\s+content="([^"]+)"/i,
        /<meta\s+property="og:title"\s+content="([^"]+)"/i,
        /<title>([^<]+)<\/title>/i,
        /videoDetails":\{"videoId":"[^"]+","title":"([^"]+)"/,
        /"title":"([^"]+)"/,
        /"videoTitle":"([^"]+)"/,
        /"videoTitle":\{"runs":\[\{"text":"([^"]+)"\}\]}/
      ];

      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          title = match[1]
            .replace(/\\"/g, '"')
            .replace(/\+/g, ' ')
            .replace(/\\u0026/g, '&')
            .trim();
          if (title.endsWith(' - YouTube')) {
            title = title.slice(0, -10).trim();
          }
          break;
        }
      }

      // Try to find duration with more patterns
      const durationPatterns = [
        /"lengthSeconds":"(\d+)"/,
        /"lengthSeconds":(\d+)/,
        /approxDurationMs":"(\d+)"/,
        /"duration":"PT(\d+)M(\d+)S"/,
        /"duration":"PT(\d+)H(\d+)M(\d+)S"/,
        /"duration":"PT(\d+)S"/,
        /"duration":"PT(\d+)M"/,
        /"duration":"PT(\d+)H"/
      ];

      for (const pattern of durationPatterns) {
        const match = html.match(pattern);
        if (match) {
          if (match[3]) { // PT{H}H{M}M{S}S format
            durationSeconds = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
          } else if (match[2]) { // PT{M}M{S}S format
            durationSeconds = parseInt(match[1]) * 60 + parseInt(match[2]);
          } else if (match[1].length > 4) { // approxDurationMs
            durationSeconds = Math.round(parseInt(match[1]) / 1000);
          } else { // lengthSeconds or other formats
            durationSeconds = parseInt(match[1]);
          }
          break;
        }
      }
    }

    // Try embed page as another fallback
    if (!title || !durationSeconds) {
      try {
        const embedResponse = await axios.get(`https://www.youtube.com/embed/${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          },
          timeout: 5000
        });

        const embedHtml = embedResponse.data;
        
        // Try to find title in embed page
        const embedTitleMatch = embedHtml.match(/<title>([^<]+)<\/title>/i);
        if (embedTitleMatch && !title) {
          title = embedTitleMatch[1].replace(' - YouTube', '').trim();
        }

        // Try to find duration in embed page
        const embedDurationMatch = embedHtml.match(/"lengthSeconds":"(\d+)"/);
        if (embedDurationMatch && !durationSeconds) {
          durationSeconds = parseInt(embedDurationMatch[1]);
        }
      } catch (e) {
        console.error('Error fetching embed page:', e);
      }
    }

    // If we still don't have the duration but have the title, use a default duration
    if (!durationSeconds && title) {
      console.log('Could not fetch duration for video. Using default duration.');
      durationSeconds = 300; // Default to 5 minutes
    }

    if (!title) {
      return json({ error: 'Could not fetch video title' }, { status: 500 });
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