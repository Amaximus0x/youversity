export async function getVideoTranscript(videoId: string, maxRetries = 3): Promise<string> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`/api/video-transcript?videoId=${videoId}`);
      const data = await response.json();

      if (data.error) {
        console.log(`Attempt ${attempt + 1}: Transcript error for ${videoId}:`, data.error);
        if (attempt < maxRetries - 1) {
          await delay(1000 * (attempt + 1)); // Exponential backoff
          continue;
        }
        return `No transcript available: ${data.details || data.error}`;
      }

      if (!data.transcript || data.transcript === 'No transcript available for this video') {
        console.log(`Attempt ${attempt + 1}: No transcript for ${videoId}`);
        if (attempt < maxRetries - 1) {
          await delay(1000 * (attempt + 1));
          continue;
        }
      }

      return data.transcript || 'No transcript available';
    } catch (error) {
      console.error(`Attempt ${attempt + 1}: Error fetching transcript for ${videoId}:`, error);
      if (attempt < maxRetries - 1) {
        await delay(1000 * (attempt + 1));
        continue;
      }
      return 'Failed to fetch transcript';
    }
  }
  
  return 'No transcript available after multiple attempts';
} 