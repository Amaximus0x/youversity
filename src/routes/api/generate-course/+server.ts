import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { CourseStructure } from '$lib/types/course';
import { OPENAI_CONFIG } from '$lib/config/openai';

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

Please format your response exactly as follows:

Course Title: [Course title]
ourse Objective: [Course objective]
Module 1 Title: [Clear, concise title]
earch Prompt: [YouTube search query]
Module 2 Title: [Clear, concise title]
earch Prompt: [YouTube search query]
[Continue this pattern for all 10 modules]
Course objective: ${User_Course_Input}`;

  try {
    console.log('Sending request to OpenAI API');
    const response = await axios.post('https://api.openai.com/v1/chat/completions', 
      {
        model: OPENAI_CONFIG.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: OPENAI_CONFIG.temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
    });

    console.log('Received response from OpenAI API');
    console.log('Response:', response.data);
    const content = response.data.choices[0].message.content;
   const lines = content.split('\n').filter(line => line.trim() !== '');
    const courseStructure: CourseStructure = {
     OG_Course_Title: '',
     OG_Course_Objective: '',
     OG_Module_Title: [],
     OG_Module_YouTube_Search_Prompt: [],
   };
    let currentModule = -1; // Track which module we're processing
    for (let i = 0; i < lines.length; i++) {
     const line = lines[i].trim();
      // Parse course title and objective
     if (line.startsWith('Course Title:')) {
       courseStructure.OG_Course_Title = line.replace('Course Title:', '').trim();
       continue;
     }
     if (line.startsWith('Course Objective:')) {
       courseStructure.OG_Course_Objective = line.replace('Course Objective:', '').trim();
       continue;
     }
      // Parse module titles and search prompts
     if (line.match(/^Module \d+ Title:/)) {
       currentModule++;
       const title = line.replace(/^Module \d+ Title:/, '').trim();
       if (title && !title.toLowerCase().includes('module') && !title.toLowerCase().includes('search prompt')) {
         courseStructure.OG_Module_Title[currentModule] = title;
       }
     } else if (line.startsWith('Search Prompt:')) {
       const prompt = line
         .replace('Search Prompt:', '')
         .trim()
         .replace(/['"\\]/g, ''); // Remove quotes and backslashes
       if (prompt && !prompt.toLowerCase().includes('module') && !prompt.toLowerCase().includes('title')) {
         courseStructure.OG_Module_YouTube_Search_Prompt[currentModule] = prompt;
       }
     }
   }
    // Validate the course structure
   if (!courseStructure.OG_Course_Title || 
       !courseStructure.OG_Course_Objective || 
       courseStructure.OG_Module_Title.length === 0 ||
       courseStructure.OG_Module_Title.length !== courseStructure.OG_Module_YouTube_Search_Prompt.length) {
     console.error('Invalid course structure:', courseStructure);
     throw new Error('Invalid course structure generated');
   }
    // Remove any null/undefined entries and ensure arrays are the same length
   courseStructure.OG_Module_Title = courseStructure.OG_Module_Title.filter(Boolean);
   courseStructure.OG_Module_YouTube_Search_Prompt = courseStructure.OG_Module_YouTube_Search_Prompt.filter(Boolean);
    // Ensure we have exactly 10 modules
   if (courseStructure.OG_Module_Title.length !== 10) {
     throw new Error('Invalid number of modules generated');
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