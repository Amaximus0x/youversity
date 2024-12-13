export async function getVideoTranscript(videoId: string, maxRetries = 5): Promise<string> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1}/${maxRetries} to fetch transcript for ${videoId}`);
      
      const response = await fetch(`/api/video-transcript?videoId=${videoId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for error in response
      if (data.error) {
        console.warn(`Server reported error: ${data.error}`);
        lastError = new Error(data.error);
        if (attempt < maxRetries - 1) {
          const waitTime = 2000 * Math.pow(2, attempt);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }
      }
      
      // Check for no transcript message
      if (data.transcript === 'No transcript available for this video') {
        console.log(`Attempt ${attempt + 1}: No transcript available for ${videoId}`);
        if (attempt < maxRetries - 1) {
          const waitTime = 2000 * Math.pow(2, attempt);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
          continue;
        }
      }

      // If we got a valid transcript, return it
      if (data.transcript && data.transcript !== 'No transcript available for this video') {
        console.log(`Successfully fetched transcript for ${videoId}`);
        return data.transcript;
      }

      // If we got here, we have an invalid transcript
      throw new Error('Invalid transcript data received');

    } catch (error) {
      console.error(`Attempt ${attempt + 1}: Error fetching transcript for ${videoId}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries - 1) {
        const waitTime = 2000 * Math.pow(2, attempt);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }
    }
  }
  
  // If we got here, all attempts failed
  console.error(`All ${maxRetries} attempts to fetch transcript failed for ${videoId}`);
  if (lastError) {
    console.error('Last error:', lastError);
  }
  
  return 'No transcript available after multiple attempts';
} 