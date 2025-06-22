import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { OPENAI_CONFIG } from '$lib/config/openai';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

  async function generateVideoTag(title: string): Promise<string> {
    const prompt = `
      Based on the following video title, suggest the most appropriate single tag/category for this content:
      Video Title: ${title}

      Choose from these categories: technology, education, entertainment, music, business, health, science, art, cooking, sports, travel, news, lifestyle, gaming, tutorial, review, comedy, documentary, or general.

      Provide the response in JSON format:
      {
        "tag": "selected_category"
      }
    `;

    try {
      const result = await makeOpenAIRequest(prompt);
      return result.tag || 'general';
    } catch (error) {
      console.error('Error generating video tag:', error);
      return 'general';
    }
  }

  async function generateVideoSummary(title: string): Promise<string> {
    const prompt = `
      Based on the following video title, generate a comprehensive summary of what this video likely covers:
      Video Title: ${title}

      The summary should be 2-3 paragraphs highlighting the main concepts and potential key takeaways based on the title. Make it informative and engaging while acknowledging that it's based on the title.

      Provide the response in JSON format:
      {
        "summary": "your generated summary here"
      }
    `;

    try {
      const result = await makeOpenAIRequest(prompt);
      return result.summary || `This video covers the topic of ${title}. The video provides detailed information about this subject matter.`;
    } catch (error) {
      console.error('Error generating video summary:', error);
      return `This video covers the topic of ${title}. The video provides detailed information about this subject matter.`;
    }
  }

export async function POST({ request }) {
  try {
    const { videoId, title } = await request.json();

    if (!videoId || !title) {
      return json({ error: 'Video ID and title are required' }, { status: 400 });
    }

    console.log('Processing video:', videoId, title);

    // Generate tag and summary in parallel
    const [tag, summary] = await Promise.all([
      generateVideoTag(title),
      generateVideoSummary(title)
    ]);

    console.log('Successfully processed video:', {
      videoId,
      title,
      tag,
      summaryLength: summary.length
    });

    return json({
      success: true,
      data: {
        tag,
        summary,
        hasTranscript: false,
        transcriptLength: 0
      }
    });

  } catch (error) {
    console.error('Error processing video:', error);
    return json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process video'
    }, { status: 500 });
  }
} 