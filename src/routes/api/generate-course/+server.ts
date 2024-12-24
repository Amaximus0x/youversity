import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { CourseStructure } from '$lib/types/course';
import { OPENAI_CONFIG } from '$lib/config/openai';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { courseInput } = await request.json();

    if (!courseInput?.trim()) {
      return json({ 
        success: false, 
        error: 'Course input is required' 
      }, { status: 400 });
    }

    try {
      const courseStructure = await generateCourse(courseInput);
      
      // Validate course structure
      if (!courseStructure || 
          !courseStructure.OG_Course_Title || 
          !courseStructure.OG_Course_Objective || 
          !Array.isArray(courseStructure.OG_Module_Title) ||
          !Array.isArray(courseStructure.OG_Module_YouTube_Search_Prompt) ||
          courseStructure.OG_Module_Title.length !== 10 ||
          courseStructure.OG_Module_YouTube_Search_Prompt.length !== 10) {
        console.error('Invalid course structure:', courseStructure);
        return json({ 
          success: false, 
          error: 'Failed to generate a valid course structure' 
        }, { status: 500 });
      }

      return json({ 
        success: true, 
        courseStructure 
      });

    } catch (error: any) {
      console.error('Error generating course:', error);
      
      if (error.response?.data?.error) {
        return json({ 
          success: false, 
          error: `OpenAI API error: ${error.response.data.error.message}` 
        }, { status: 500 });
      }

      return json({ 
        success: false, 
        error: error.message || 'Failed to generate course' 
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
  const prompt = `Create a structured 10-module course plan based on this objective: "${User_Course_Input}"

Please format your response exactly as follows:
Course Title: [The main course title]
Course Objective: [A clear course objective]
Module 1 Title: [First module title]
Module 1 Search Prompt: [YouTube search query for module 1]
Module 2 Title: [Second module title]
Module 2 Search Prompt: [YouTube search query for module 2]
[Continue this exact pattern for all 10 modules]`;

  try {
    console.log('Sending request to OpenAI API');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: OPENAI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: OPENAI_CONFIG.temperature,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0].message.content;
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    const courseStructure: CourseStructure = {
      OG_Course_Title: '',
      OG_Course_Objective: '',
      OG_Module_Title: [],
      OG_Module_YouTube_Search_Prompt: []
    };

    // First, get course title and objective
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('Course Title:')) {
        courseStructure.OG_Course_Title = line.replace('Course Title:', '').trim();
      } else if (line.startsWith('Course Objective:')) {
        courseStructure.OG_Course_Objective = line.replace('Course Objective:', '').trim();
      } else if (line.match(/^Module \d+ Title:/)) {
        // Process module title and its corresponding search prompt
        const moduleTitle = line.replace(/^Module \d+ Title:/, '').trim();
        const searchPrompt = lines[i + 1]
          .replace(/^Module \d+ Search Prompt:/, '')
          .replace(/^Search Prompt:/, '')
          .replace(/["\\\n]/g, '') // Remove quotes and other special characters
          .trim();
        
        courseStructure.OG_Module_Title.push(moduleTitle);
        courseStructure.OG_Module_YouTube_Search_Prompt.push(searchPrompt);
        
        // Skip the next line since we've already processed it
        i++;
      }
    }

    // Validate the structure before returning
    if (!courseStructure.OG_Course_Title || 
        !courseStructure.OG_Course_Objective || 
        courseStructure.OG_Module_Title.length !== 10 ||
        courseStructure.OG_Module_YouTube_Search_Prompt.length !== 10) {
      throw new Error('Invalid course structure generated');
    }

    return courseStructure;
  } catch (error) {
    console.error('Error in generateCourse:', error);
    throw error;
  }
}