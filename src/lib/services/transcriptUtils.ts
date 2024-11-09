export async function getVideoTranscript(videoId: string, maxRetries = 3): Promise<string> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`/api/video-transcript?videoId=${videoId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.transcript === 'No transcript available for this video') {
        console.log(`Attempt ${attempt + 1}: No transcript for ${videoId}`);
        if (attempt < maxRetries - 1) {
          await delay(2000 * Math.pow(2, attempt));
          continue;
        }
      }

      return data.transcript;
    } catch (error) {
      console.error(`Attempt ${attempt + 1}: Error fetching transcript for ${videoId}:`, error);
      if (attempt < maxRetries - 1) {
        await delay(2000 * Math.pow(2, attempt));
        continue;
      }
    }
  }
  
  return 'No transcript available after multiple attempts';
} 