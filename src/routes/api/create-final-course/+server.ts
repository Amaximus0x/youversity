// src/routes/api/create-final-course/+server.ts
import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';
import axios from 'axios';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { courseStructure, selectedVideos } = await request.json();

    const prompt = `Based on the following course structure and selected videos, generate a refined course with introduction and conclusion:

Course Title: ${courseStructure.OG_Course_Title}
Course Objective: ${courseStructure.OG_Course_Objective}

${courseStructure.OG_Module_Title.map((title, i) => `
Module ${i + 1}: ${title}
Video: ${selectedVideos[i].title}
`).join('\n')}

Provide a response in JSON format with:
- Final_Course_Title
- Final_Course_Objective
- Final_Course_Introduction (2-3 sentences)
- Final_Module_Title (array)
- Final_Module_Objective (array)
- Final_Course_Conclusion (2-3 sentences)`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const finalCourse = JSON.parse(response.data.choices[0].message.content);

    return json({
      ...finalCourse,
      Final_Module_YouTube_Video_URL: selectedVideos.map(video => video.videoUrl),
      completed_modules: new Array(courseStructure.OG_Module_Title.length).fill(false)
    });
  } catch (error) {
    console.error('Error creating final course:', error);
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
    }
    return new Response(JSON.stringify({ error: 'Failed to create final course' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};