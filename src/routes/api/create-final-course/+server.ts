// src/routes/api/create-final-course/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { RequestHandler } from './$types';
import type { CourseStructure, FinalCourseStructure, VideoItem } from '$lib/types/course';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function makeOpenAIRequest(prompt: string) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

async function generateQuiz(transcript: string, moduleTitle: string) {
  const quizPrompt = `
    Based on the following video transcript and module title, generate 3 multiple-choice questions:
    Module Title: ${moduleTitle}
    Transcript: ${transcript.substring(0, 2000)}... // Truncate for token limit

    Generate the response in JSON format with an array of questions:
    [
      {
        "question": "Question text",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correctAnswer": "Correct option"
      }
    ]
  `;

  return await makeOpenAIRequest(quizPrompt);
}

async function generateFinalCourse(
  courseStructure: CourseStructure,
  selectedVideos: VideoItem[]
): Promise<FinalCourseStructure> {
  try {
    console.log('Generating final course structure');

    const courseOverviewPrompt = `
      Based on the following course structure, generate a refined course title, objective, and introduction:
      Original Title: ${courseStructure.OG_Course_Title}
      Original Objective: ${courseStructure.OG_Course_Objective}
      Modules: ${courseStructure.OG_Module_Title.join(', ')}

      Provide the response in JSON format with the following keys:
      {
        "Final_Course_Title": "refined title",
        "Final_Course_Objective": "refined objective",
        "Final_Course_Introduction": "engaging introduction"
      }
    `;

    const courseOverview = await makeOpenAIRequest(courseOverviewPrompt);
    await delay(2000);

    const moduleDetails = [];
    for (let i = 0; i < courseStructure.OG_Module_Title.length; i++) {
      const modulePrompt = `
        Based on the following module information, generate a refined module title and objective:
        Module Title: ${courseStructure.OG_Module_Title[i]}
        Video Title: ${selectedVideos[i].title}
        Video Description: ${selectedVideos[i].description}

        Provide the response in JSON format with the following keys:
        {
          "Final_Module_Title": "refined module title",
          "Final_Module_Objective": "refined module objective"
        }
      `;

      const moduleDetail = await makeOpenAIRequest(modulePrompt);
      moduleDetails.push(moduleDetail);
      await delay(2000);
    }

    const conclusionPrompt = `
      Based on the course structure and modules, generate a conclusion for the course:
      Course Title: ${courseOverview.Final_Course_Title}
      Course Objective: ${courseOverview.Final_Course_Objective}
      Modules: ${moduleDetails.map(m => m.Final_Module_Title).join(', ')}

      Provide the response in JSON format with the following key:
      {
        "Final_Course_Conclusion": "engaging conclusion"
      }
    `;

    await delay(2000);
    const conclusion = await makeOpenAIRequest(conclusionPrompt);

    console.log('Starting quiz generation for modules...');
    const moduleQuizzes = [];
    for (let i = 0; i < selectedVideos.length; i++) {
      try {
        console.log(`Generating quiz for module ${i + 1}`);
        const transcript = await getVideoTranscript(selectedVideos[i].videoId);
        await delay(1000);
        
        const quiz = await generateQuiz(transcript, courseStructure.OG_Module_Title[i]);
        await delay(2000);
        
        moduleQuizzes.push(quiz);
      } catch (error) {
        console.error(`Error generating quiz for module ${i + 1}:`, error);
        moduleQuizzes.push([{
          question: `What is the main topic of ${courseStructure.OG_Module_Title[i]}?`,
          options: [
            courseStructure.OG_Module_Title[i],
            'General Knowledge',
            'Basic Concepts',
            'Introduction'
          ],
          correctAnswer: courseStructure.OG_Module_Title[i]
        }]);
      }
    }

    return {
      Final_Course_Title: courseOverview.Final_Course_Title,
      Final_Course_Objective: courseOverview.Final_Course_Objective,
      Final_Course_Introduction: courseOverview.Final_Course_Introduction,
      Final_Module_Title: moduleDetails.map(module => module.Final_Module_Title),
      Final_Module_Objective: moduleDetails.map(module => module.Final_Module_Objective),
      Final_Module_YouTube_Video_URL: selectedVideos.map(video => video.videoUrl),
      Final_Module_Quiz: moduleQuizzes,
      Final_Course_Conclusion: conclusion.Final_Course_Conclusion,
      YouTube_Playlist_URL: '' // Implement playlist creation if needed
    };
  } catch (error) {
    console.error('Error in generateFinalCourse:', error);
    throw error;
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { courseStructure, selectedVideos } = await request.json();
    const finalCourse = await generateFinalCourse(courseStructure, selectedVideos);
    
    return json({
      success: true,
      course: finalCourse
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
};