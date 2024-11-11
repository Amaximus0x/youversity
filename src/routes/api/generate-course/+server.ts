import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { CourseStructure } from '$lib/types/course';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { courseInput } = await request.json();

    if (!courseInput) {
      return json({ 
        success: false, 
        error: 'Course input is required' 
      }, { status: 400 });
    }

    try {
      const courseStructure = await generateCourse(courseInput);
      return json({ 
        success: true, 
        courseStructure 
      });
    } catch (error) {
      console.error('Error generating course:', error);
      return json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return json({ 
      success: false, 
      error: 'Invalid request data' 
    }, { status: 400 });
  }
};

async function generateCourse(User_Course_Input: string): Promise<CourseStructure> {
  const prompt = `Build a 10 module course plan based on the input below, with course title and individual module titles. For each module, include one sentence search prompt for youtube to find the best video match for that module. Do not include "Search Prompt:" before each search prompt.

Here is the course objective - simplify if needed:

${User_Course_Input}

Course Title
Course Objective
Module 1 Title
Module 1 Search Prompt
Module 2 Title
Module 2 Search Prompt
.....`;

  try {
    console.log('Sending request to OpenAI API');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Received response from OpenAI API');
    const content = response.data.choices[0].message.content;
    const lines = content.split('\n').filter(line => line.trim() !== '');

    const courseStructure: CourseStructure = {
      OG_Course_Title: lines[0].replace(/^Course Title:\s*/, ''),
      OG_Course_Objective: lines[1].replace(/^Course Objective:\s*/, ''),
      OG_Module_Title: [],
      OG_Module_YouTube_Search_Prompt: [],
    };

    for (let i = 2; i < lines.length && courseStructure.OG_Module_Title.length < 10; i += 2) {
      const moduleTitle = lines[i]
        .replace(/^Module \d+ Title:\s*/, '')
        .replace(/^Module \d+:\s*/, '');
      const searchPrompt = lines[i + 1]
        .replace(/^Module \d+ Search Prompt:\s*/, '')
        .replace(/^Search Prompt:\s*/, '')
        .replace(/["\\\n]/g, '');
      
      courseStructure.OG_Module_Title.push(moduleTitle);
      courseStructure.OG_Module_YouTube_Search_Prompt.push(searchPrompt);
    }

    if (!courseStructure.OG_Course_Title || !courseStructure.OG_Course_Objective || courseStructure.OG_Module_Title.length === 0) {
      throw new Error('Invalid course structure generated');
    }

    return courseStructure;
  } catch (error) {
    console.error('Error in generateCourse:', error);
    if (error.response) {
      console.error('OpenAI API response:', error.response.data);
    }
    throw new Error(`Failed to generate course: ${error.message}`);
  }
}