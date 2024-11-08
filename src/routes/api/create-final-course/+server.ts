// src/routes/api/create-final-course/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { courseStructure, selectedVideos } = await request.json();

    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Based on the following course structure and selected videos...`;

    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const data = response.data.choices[0].message.content;
    
    return json({
      success: true,
      outline: data
    });

  } catch (error) {
    console.error('Error creating course:', error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};