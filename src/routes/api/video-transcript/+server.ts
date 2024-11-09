import { error } from '@sveltejs/kit';
import axios from 'axios';

async function fetchTranscriptFromYoutube(videoId: string) {
  try {
    const response = await axios.get(`https://youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.youtube.com/',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const html = response.data;
    
    // Try multiple patterns to extract player response
    const patterns = [
      /ytInitialPlayerResponse\s*=\s*({.+?});/,
      /\"captions\":{\"playerCaptionsTracklistRenderer\":(.+?)}}/,
      /\"captionTracks\":(\[.+?\])/
    ];

    let playerResponse;
    let captionTracks;

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          if (data.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
            captionTracks = data.captions.playerCaptionsTracklistRenderer.captionTracks;
            break;
          } else if (Array.isArray(data)) {
            captionTracks = data;
            break;
          }
        } catch (e) {
          console.warn('Failed to parse match:', e);
          continue;
        }
      }
    }

    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No captions available');
    }

    // Try multiple caption types
    const captionTrack = captionTracks.find(
      (track: any) => (track.languageCode === 'en' && !track.kind) ||
                     (track.languageCode === 'en' && track.kind === 'asr') ||
                     track.vssId?.includes('en')
    );

    if (!captionTrack?.baseUrl) {
      throw new Error('No English captions found');
    }

    const transcriptResponse = await axios.get(captionTrack.baseUrl, {
      timeout: 10000,
      maxRedirects: 5
    });

    return transcriptResponse.data;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
}

async function parseTranscriptXml(transcriptXml: string): string {
  try {
    // Check if the response is XML
    if (transcriptXml.includes('<?xml')) {
      // Extract text content between <transcript> tags
      const match = transcriptXml.match(/<transcript>(.*?)<\/transcript>/s);
      if (match && match[1]) {
        return match[1].trim()
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
      }
    }
    // If not XML, return the original text
    return transcriptXml;
  } catch (error) {
    console.error('Error parsing transcript XML:', error);
    return transcriptXml;
  }
}

export async function GET({ url }) {
  try {
    const videoId = url.searchParams.get('videoId');
    
    if (!videoId) {
      throw error(400, 'Video ID is required');
    }

    console.log('Fetching transcript for video:', videoId);
    const transcriptResponse = await fetchTranscriptFromYoutube(videoId);
    const cleanTranscript = await parseTranscriptXml(transcriptResponse);

    return new Response(JSON.stringify({ transcript: cleanTranscript }), {
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