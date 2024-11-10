// src/routes/api/create-final-course/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { RequestHandler } from './$types';
import type { CourseStructure, FinalCourseStructure, VideoItem, Quiz, QuizQuestion } from '$lib/types/course';
import { getVideoTranscript } from '$lib/services/transcriptUtils';

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

async function generateQuiz(transcript: string, moduleTitle: string, isFinalQuiz: boolean = false): Promise<Quiz> {
  try {
    const prompt = `You are an AI language model tasked with creating a 5-question quiz based on the provided YouTube video transcript. The quiz should be in a rigid JSON format for coding purposes.

Instructions:

Quiz Structure:
- The quiz must contain exactly 5 questions.
- Each question can be either:
  - Multiple Choice: Up to 4 options labeled "a", "b", "c", "d".
  - True/False: Options labeled "a" (True) and "b" (False).

Content Guidelines:
- Base all questions and answers strictly on the information provided in the transcript.
- Ensure that the correct answer ("answer" field) matches the content of the transcript.
- Do not include any external information or assumptions.
- Skip any promotions in the video, of the creator of the video or the sponsors.

Formatting Rules:
- Do not include any additional text outside the JSON object.
- Ensure the JSON is properly formatted, with correct syntax.
- Do not include comments or placeholders.

Language and Clarity:
- Use clear and concise language suitable for a general audience.
- Avoid ambiguous or misleading questions and options.

${isFinalQuiz ? 'This is the final comprehensive quiz for the entire course.' : `This quiz is for the module: ${moduleTitle}`}

Transcript:
${transcript.substring(0, 3000)}...`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
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
    console.error('Error generating quiz:', error);
    // Fallback quiz in case of error
    return {
      quiz: [
        {
          question: `What is the main topic covered in ${moduleTitle}?`,
          type: "multiple-choice",
          options: {
            "a": moduleTitle,
            "b": "General Knowledge",
            "c": "Basic Concepts",
            "d": "Advanced Topics"
          },
          answer: "a"
        }
      ]
    };
  }
}

function generateFallbackQuiz(moduleTitle: string): Quiz {
  return {
    quiz: [
      {
        question: `What is the main topic covered in ${moduleTitle}?`,
        type: "multiple-choice",
        options: {
          "a": moduleTitle,
          "b": "General Knowledge",
          "c": "Basic Concepts",
          "d": "Advanced Topics"
        },
        answer: "a"
      },
      {
        question: "Is this module part of a structured learning course?",
        type: "true/false",
        options: {
          "a": "True",
          "b": "False"
        },
        answer: "a"
      },
      {
        question: "What best describes this module's content?",
        type: "multiple-choice",
        options: {
          "a": "Introductory Material",
          "b": "Advanced Concepts",
          "c": "Practical Examples",
          "d": "Theoretical Framework"
        },
        answer: "a"
      },
      {
        question: "This module is designed for:",
        type: "multiple-choice",
        options: {
          "a": "Beginners",
          "b": "Intermediate Learners",
          "c": "Advanced Users",
          "d": "All Skill Levels"
        },
        answer: "d"
      },
      {
        question: "The content in this module is educational.",
        type: "true/false",
        options: {
          "a": "True",
          "b": "False"
        },
        answer: "a"
      }
    ]
  };
}

async function generateFinalCourse(
  courseStructure: CourseStructure,
  selectedVideos: VideoItem[],
  moduleTranscripts: string[]
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

    console.log('Generating quizzes for modules...');
    const moduleQuizzes: Quiz[] = [];
    let allTranscripts = '';

    for (let i = 0; i < selectedVideos.length; i++) {
      try {
        console.log(`Generating quiz for module ${i + 1} with transcript length:`, moduleTranscripts[i]?.length);
        const transcript = moduleTranscripts[i];
        
        if (!transcript || transcript === 'Failed to fetch transcript') {
          console.error(`No valid transcript for module ${i + 1}`);
          throw new Error('No transcript available');
        }

        // Clean up the transcript - remove XML/HTML tags
        const cleanTranscript = transcript.replace(/<[^>]*>/g, ' ')
                                       .replace(/\s+/g, ' ')
                                       .trim();

        allTranscripts += `Module ${i + 1}: ${cleanTranscript}\n\n`;
        const quiz = await generateQuiz(cleanTranscript, courseStructure.OG_Module_Title[i]);
        await delay(2000); // Rate limiting
        
        moduleQuizzes.push(quiz);
      } catch (error) {
        console.error(`Error generating quiz for module ${i + 1}:`, error);
        const fallbackQuiz = generateFallbackQuiz(courseStructure.OG_Module_Title[i]);
        moduleQuizzes.push(fallbackQuiz);
      }
    }

    console.log('Generating final course quiz...');
    const finalQuiz = await generateQuiz(allTranscripts, courseStructure.OG_Course_Title, true);

    return {
      Final_Course_Title: courseOverview.Final_Course_Title,
      Final_Course_Objective: courseOverview.Final_Course_Objective,
      Final_Course_Introduction: courseOverview.Final_Course_Introduction,
      Final_Module_Title: moduleDetails.map(module => module.Final_Module_Title),
      Final_Module_Objective: moduleDetails.map(module => module.Final_Module_Objective),
      Final_Module_YouTube_Video_URL: selectedVideos.map(video => video.videoUrl),
      Final_Module_Quiz: moduleQuizzes,
      Final_Course_Quiz: finalQuiz,
      Final_Course_Conclusion: conclusion.Final_Course_Conclusion,
      YouTube_Playlist_URL: ''
    };
  } catch (error) {
    console.error('Error in generateFinalCourse:', error);
    throw error;
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { courseStructure, selectedVideos, moduleTranscripts } = await request.json();
    const finalCourse = await generateFinalCourse(courseStructure, selectedVideos, moduleTranscripts);
    
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