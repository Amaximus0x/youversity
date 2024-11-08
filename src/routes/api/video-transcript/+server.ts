import { error } from '@sveltejs/kit';
import { YoutubeTranscript } from 'youtube-transcript';

export async function GET({ url }) {
  try {
    const videoId = url.searchParams.get('videoId');
    
    if (!videoId) {
      throw error(400, 'Video ID is required');
    }

    console.log('Fetching transcript for video:', videoId);

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
      country: 'US'
    });

    if (!transcriptItems || transcriptItems.length === 0) {
      console.log('No transcript found for video:', videoId);
      return new Response(JSON.stringify({
        transcript: 'No transcript available for this video'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('Successfully fetched transcript, length:', transcript.length);

    return new Response(JSON.stringify({ transcript }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('Error in transcript endpoint:', err);
    
    return new Response(JSON.stringify({
      transcript: 'No transcript available for this video',
      error: err.message
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 