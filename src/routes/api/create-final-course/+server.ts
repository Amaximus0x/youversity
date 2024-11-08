// src/routes/api/create-final-course/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { transcripts, title } = await request.json();

    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates course outlines."
          },
          {
            role: "user",
            content: `Create a detailed course outline from these video transcripts: ${transcripts.join('\n\n')}`
          }
        ]
      })
    });

    const data = await response.json();
    
    return json({
      success: true,
      outline: data.choices[0].message.content
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};