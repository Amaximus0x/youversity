import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import axios from 'axios';

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
  try {
    const prompt = `Create a structured course outline for: "${User_Course_Input}"
    Format the response as follows:
    Course Title: [title]
    Course Objective: [objective]
    Module 1 Title: [title]
    Module 1 Search Prompt: [search prompt]
    Module 2 Title: [title]
    Module 2 Search Prompt: [search prompt]
    ... (continue for up to 10 modules)`;

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

    const content = response.data.choices[0].message.content;
    const lines = content.split('\n').filter(line => line.trim());

    const courseStructure: CourseStructure = {
      OG_Course_Title: '',
      OG_Course_Objective: '',
      OG_Module_Title: [],
      OG_Module_YouTube_Search_Prompt: [],
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || '';
      
      if (line.startsWith('Course Title:')) {
        courseStructure.OG_Course_Title = line.replace('Course Title:', '').trim();
      } else if (line.startsWith('Course Objective:')) {
        courseStructure.OG_Course_Objective = line.replace('Course Objective:', '').trim();
      } else if (line.match(/^Module \d+ Title:/)) {
        const moduleTitle = line.replace(/^Module \d+ Title:\s*/, '').trim();
        const nextLine = lines[i + 1]?.trim() || '';
        const searchPrompt = nextLine.replace(/^Module \d+ Search Prompt:\s*/, '').trim();
        
        if (moduleTitle) {
          courseStructure.OG_Module_Title.push(moduleTitle);
          courseStructure.OG_Module_YouTube_Search_Prompt.push(searchPrompt);
        }
        i++; // Skip the search prompt line
      }
    }

    if (!courseStructure.OG_Course_Title || !courseStructure.OG_Course_Objective || courseStructure.OG_Module_Title.length === 0) {
      throw new Error('Invalid course structure generated');
    }

    return courseStructure;
  } catch (error) {
    console.error('Error generating course:', error);
    throw new Error('Failed to generate course structure');
  }
}