import { API_CONFIG } from "$lib/config/api";

export interface EnhancedVideoData {
  title: string;
  objective: string;
  summary: string;
  duration: number;
  quiz: any;
  hasTranscript: boolean;
  transcriptLength: number;
}

export async function enhanceVideoForCourse(
  videoUrl: string,
  videoTitle?: string,
  videoDescription?: string
): Promise<EnhancedVideoData | null> {
  try {
    console.log('Enhancing video for course:', { videoUrl, videoTitle, videoDescription });
    
    const response = await fetch(`${API_CONFIG.baseURL}/api/enhance-video-module`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl,
        videoTitle,
        videoDescription
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to enhance video: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('Successfully enhanced video:', result.data);
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to enhance video');
    }
  } catch (error) {
    console.error('Error enhancing video:', error);
    return null;
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function createYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
} 