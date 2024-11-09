import { error } from '@sveltejs/kit';
import axios from 'axios';

async function fetchTranscriptFromYoutube(videoId: string) {
  try {
    const response = await axios.get(`https://youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.youtube.com/'
      },
      timeout: 10000 // 10 second timeout
    });

    const html = response.data;
    
    // Extract the ytInitialPlayerResponse
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!match) {
      throw new Error('Could not find player response');
    }

    const playerResponse = JSON.parse(match[1]);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No captions available');
    }

    // First try to get manual English captions
    let captionTrack = captionTracks.find(
      (track: any) => track.languageCode === 'en' && !track.kind
    );

    // Fall back to auto-generated captions
    if (!captionTrack) {
      captionTrack = captionTracks.find(
        (track: any) => track.languageCode === 'en' && track.kind === 'asr'
      );
    }

    if (!captionTrack?.baseUrl) {
      throw new Error('No English captions found');
    }

    // Fetch the actual transcript
    const transcriptResponse = await axios.get(captionTrack.baseUrl);
    const transcript = transcriptResponse.data;
    
    // Parse the XML transcript
    const textContent = transcript.replace(/<text[^>]*>(.*?)<\/text>/g, '$1 ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return textContent;
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