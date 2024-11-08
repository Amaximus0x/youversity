import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import axios from 'axios';

  async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const html = response.data;
    
    // Extract player response data which contains captions
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!playerResponseMatch) {
      throw new Error('Could not find player response');
    }

    const playerData = JSON.parse(playerResponseMatch[1]);
    const captions = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captions || captions.length === 0) {
      throw new Error('No captions available');
    }

    // Try to find manual English captions first
    let captionTrack = captions.find((track: any) => 
      track.languageCode === 'en' && !track.kind && track.baseUrl
    );

    // If no manual captions, try auto-generated
    if (!captionTrack) {
      captionTrack = captions.find((track: any) => 
        track.languageCode === 'en' && track.kind === 'asr' && track.baseUrl
      );
    }

    if (!captionTrack?.baseUrl) {
      throw new Error('No English captions found');
    }

    // Fetch the actual transcript
    const transcriptResponse = await axios.get(captionTrack.baseUrl);
    const transcriptXml = transcriptResponse.data;

    // Parse the XML transcript
    const textSegments = transcriptXml.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    const transcript = textSegments
      .map((segment: string) => {
        const text = segment.match(/<text[^>]*>(.*?)<\/text>/)?.[1] || '';
        return text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\n/g, ' ');
      })
      .filter(Boolean)
      .join(' ');

    if (!transcript) {
      throw new Error('Empty transcript');
    }

    return transcript;

  } catch (error) {
    console.error(`Error fetching transcript for video ${videoId}:`, error);
    throw error;
  }
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const videoId = url.searchParams.get('videoId');
    
    if (!videoId) {
      return new Response('Video ID is required', { status: 400 });
    }

    const transcript = await fetchTranscript(videoId);
    return json({ transcript });

  } catch (error) {
    console.error('Error in transcript endpoint:', error);
    return json({ 
      transcript: 'No transcript available for this video'
    }, { status: 200 });
  }
}; 