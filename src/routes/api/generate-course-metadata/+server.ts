import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { OPENAI_CONFIG } from '$lib/config/openai';
import { addCorsHeaders, handleCorsOptions } from '$lib/utils/cors';

// Add OPTIONS handler for CORS preflight requests
export const OPTIONS: RequestHandler = async ({ request }) => {
  return handleCorsOptions(request);
};

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
          max_tokens: 500,
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

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt, videoTitles, videoDescriptions } = await request.json();

    if (!videoTitles || !Array.isArray(videoTitles) || videoTitles.length === 0) {
      const errorResponse = json({
        success: false,
        error: 'Video titles are required'
      }, { status: 400 });
      
      return addCorsHeaders(errorResponse, request);
    }

    // Create a comprehensive prompt for course metadata generation
    const fullPrompt = `
      Based on the following video information, generate a compelling course title and description:
      
      Video Titles: ${videoTitles.join(', ')}
      ${videoDescriptions && videoDescriptions.length > 0 ? `Video Descriptions: ${videoDescriptions.join('. ')}` : ''}
      
      Requirements:
      - Course title should be clear, engaging, and comprehensive (max 80 characters)
      - Description should be 2-3 sentences explaining what the course covers and what learners will gain
      - Make it sound professional and educational
      
      Provide the response in JSON format:
      {
        "title": "Generated course title",
        "description": "Generated course description"
      }
    `;

    try {
      const result = await makeOpenAIRequest(fullPrompt);
      
      const successResponse = json({
        success: true,
        title: result.title || `Course: ${videoTitles[0]}`,
        description: result.description || 'A comprehensive course covering various topics.'
      });
      
      return addCorsHeaders(successResponse, request);
      
    } catch (error: any) {
      console.error('Error generating course metadata:', error);
      
      // Handle rate limit errors
      if (error.response?.status === 429) {
        const errorResponse = json({
          success: false,
          error: 'Rate limit exceeded. Please try again in a few minutes.'
        }, { status: 429 });
        
        return addCorsHeaders(errorResponse, request);
      }

      // Handle OpenAI API errors
      if (error.response?.data?.error) {
        const errorResponse = json({
          success: false,
          error: error.response.data.error.message || 'OpenAI API error'
        }, { status: 500 });
        
        return addCorsHeaders(errorResponse, request);
      }

      // Fallback response
      const fallbackResponse = json({
        success: true,
        title: videoTitles.length === 1 
          ? videoTitles[0] 
          : `Multi-Topic Course: ${videoTitles.length} Modules`,
        description: videoTitles.length === 1
          ? 'Learn about this topic in detail through comprehensive video content.'
          : `A comprehensive course covering ${videoTitles.length} different topics and modules.`
      });
      
      return addCorsHeaders(fallbackResponse, request);
    }

  } catch (error: any) {
    console.error('Error processing request:', error);
    const errorResponse = json({
      success: false,
      error: 'Invalid request data'
    }, { status: 400 });
    
    return addCorsHeaders(errorResponse, request);
  }
}; 