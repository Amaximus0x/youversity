import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getVideoTranscript } from '$lib/services/transcriptUtils';
import { OPENAI_CONFIG } from '$lib/config/openai';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function preprocessTranscript(transcript: string): string {
  if (!transcript || transcript === 'No transcript available for this video' || 
      transcript === 'No transcript available after multiple attempts') {
    return '';
  }
  
  return transcript
    .replace(/\[.*?\]/g, '') // Remove [Music], [Applause], etc.
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 15000); // Limit to 15k characters for API
}

async function makeOpenAIRequest(prompt: string, retries = OPENAI_CONFIG.maxRetries) {
  // Check if OpenAI API key is available
  if (!env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful educational content creator. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: OPENAI_CONFIG.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error(`OpenAI request attempt ${attempt + 1} failed:`, error);
      if (attempt < retries - 1) {
        await delay(2000 * Math.pow(2, attempt));
      } else {
        throw error;
      }
    }
  }
}

async function generateModuleObjective(videoTitle: string, videoDescription: string): Promise<string> {
  const prompt = `
    Based on the following video information, generate a clear and concise learning objective for this module:
    Video Title: ${videoTitle}
    Video Description: ${videoDescription}

    The objective should start with "By the end of this module, you will..." and be specific about what the learner will achieve.

    Provide the response in JSON format:
    {
      "objective": "your generated objective here"
    }
  `;

  try {
    const result = await makeOpenAIRequest(prompt);
    return result.objective || `By the end of this module, you will understand the key concepts covered in ${videoTitle}.`;
  } catch (error) {
    console.error('Error generating module objective:', error);
    return `By the end of this module, you will understand the key concepts covered in ${videoTitle}.`;
  }
}

async function generateModuleSummary(transcript: string, videoTitle: string): Promise<string> {
  if (!transcript) {
    return `This module covers the topic of ${videoTitle}. Please watch the video to learn more about this subject.`;
  }

  const prompt = `
    Based on the following video transcript, generate a comprehensive summary of the key points covered:
    Video Title: ${videoTitle}
    Transcript: ${transcript}

    The summary should be 2-3 paragraphs highlighting the main concepts, key takeaways, and important information covered in the video.

    Provide the response in JSON format:
    {
      "summary": "your generated summary here"
    }
  `;

  try {
    const result = await makeOpenAIRequest(prompt);
    return result.summary || `This module covers the topic of ${videoTitle}. The video provides detailed information about this subject matter.`;
  } catch (error) {
    console.error('Error generating module summary:', error);
    return `This module covers the topic of ${videoTitle}. The video provides detailed information about this subject matter.`;
  }
}

async function generateModuleQuiz(transcript: string, videoTitle: string): Promise<any> {
  if (!transcript) {
    // Return a basic quiz if no transcript is available
    return {
      title: `Quiz: ${videoTitle}`,
      quiz: [
        {
          question: `What is the main topic covered in the video "${videoTitle}"?`,
          type: 'multiple-choice',
          options: {
            A: videoTitle.split(' ').slice(0, 3).join(' '),
            B: 'General information',
            C: 'Not specified',
            D: 'Other topics'
          },
          answer: 'A'
        }
      ]
    };
  }

  const prompt = `
    Based on the following video transcript, generate a quiz with 3-5 multiple choice questions that test understanding of the key concepts:
    Video Title: ${videoTitle}
    Transcript: ${transcript}

    Each question should:
    - Test understanding of important concepts from the video
    - Have 4 answer options (A, B, C, D)
    - Have one clearly correct answer
    - Be educational and meaningful

    Provide the response in JSON format:
    {
      "title": "Quiz: ${videoTitle}",
      "quiz": [
        {
          "question": "question text here",
          "type": "multiple-choice",
          "options": {
            "A": "option A text",
            "B": "option B text", 
            "C": "option C text",
            "D": "option D text"
          },
          "answer": "A"
        }
      ]
    }
  `;

  try {
    const result = await makeOpenAIRequest(prompt);
    return result || {
      title: `Quiz: ${videoTitle}`,
      quiz: [
        {
          question: `What is the main topic covered in "${videoTitle}"?`,
          type: 'multiple-choice',
          options: {
            A: 'The topic covered in the video',
            B: 'Something else',
            C: 'Not covered',
            D: 'Unknown topic'
          },
          answer: 'A'
        }
      ]
    };
  } catch (error) {
    console.error('Error generating module quiz:', error);
    return {
      title: `Quiz: ${videoTitle}`,
      quiz: [
        {
          question: `What is the main topic covered in "${videoTitle}"?`,
          type: 'multiple-choice',
          options: {
            A: 'The topic covered in the video',
            B: 'Something else',
            C: 'Not covered',
            D: 'Unknown topic'
          },
          answer: 'A'
        }
      ]
    };
  }
}

async function getVideoMetadata(videoId: string): Promise<{ title: string; duration: number }> {
  try {
    const response = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://youversity.vercel.app'}/api/video-metadata?videoId=${videoId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video metadata: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        title: data.data.title,
        duration: data.data.duration
      };
    } else {
      throw new Error('Invalid metadata response');
    }
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return {
      title: 'Unknown Video Title',
      duration: 5 // Default 5 minutes
    };
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function POST({ request }) {
  try {
    const { videoUrl, videoTitle, videoDescription } = await request.json();

    if (!videoUrl) {
      return json({ error: 'Video URL is required' }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
      return json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    console.log('Enhancing video module for:', videoId);

    // Fetch video metadata, transcript, and generate content in parallel
    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      getVideoTranscript(videoId, 2)
    ]);

    // Use provided title/description or fallback to metadata
    const finalTitle = videoTitle || metadata.title;
    const finalDescription = videoDescription || '';

    // Process transcript
    const processedTranscript = preprocessTranscript(transcript);

    // Generate enhanced content in parallel
    const [objective, summary, quiz] = await Promise.all([
      generateModuleObjective(finalTitle, finalDescription),
      generateModuleSummary(processedTranscript, finalTitle),
      generateModuleQuiz(processedTranscript, finalTitle)
    ]);

    const enhancedModule = {
      title: finalTitle,
      objective,
      summary,
      duration: metadata.duration,
      quiz,
      hasTranscript: !!processedTranscript,
      transcriptLength: processedTranscript.length
    };

    console.log('Successfully enhanced video module:', {
      title: finalTitle,
      duration: metadata.duration,
      hasTranscript: !!processedTranscript,
      transcriptLength: processedTranscript.length
    });

    return json({
      success: true,
      data: enhancedModule
    });

  } catch (error) {
    console.error('Error enhancing video module:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enhance video module'
    }, { status: 500 });
  }
} 