// src/routes/api/create-final-course/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { RequestHandler } from './$types';
import type { CourseStructure, FinalCourseStructure, VideoItem, Quiz, QuizQuestion } from '$lib/types/course';
import { getVideoTranscript } from '$lib/services/transcriptUtils';
import pLimit from 'p-limit';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const openAIRateLimit = pLimit(3); // Limit concurrent requests

const RPM_LIMIT = 200; // requests per minute
const DELAY_BETWEEN_REQUESTS = Math.ceil((60 * 1000) / RPM_LIMIT); // ~300ms between requests

async function makeOpenAIRequest(prompt: string, retries = 2) {
  return openAIRateLimit(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          },
          {
            headers: {
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            timeout: 30000
          }
        );

        return JSON.parse(response.data.choices[0].message.content);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  });
}

async function generateQuiz(transcript: string, moduleTitle: string, isFinalQuiz: boolean = false): Promise<Quiz> {
  try {
    if (typeof transcript !== 'string') {
      console.error('Invalid transcript type:', typeof transcript);
      return generateFallbackQuiz(moduleTitle);
    }

    console.log(`Starting quiz generation for: ${moduleTitle}`);
    console.log(`Transcript preview: ${transcript.substring(0, 100)}...`);
    console.log(`Generating quiz for ${moduleTitle} with transcript length: ${transcript.length}`);

    const prompt = `You are an AI language model tasked with creating a 5-question quiz based on the provided YouTube video transcript. The quiz should be in a rigid JSON format for coding purposes.

Instructions:

Quiz Structure:

The quiz must contain exactly 5 questions.
Each question can be either:
Multiple Choice: Up to 4 options labeled "a", "b", "c", "d".
True/False: Options labeled "a" (True) and "b" (False).
JSON Format:

The output must be a JSON object with the following structure:
{
  "quiz": [
    {
      "question": "Question text here",
      "type": "multiple-choice" or "true/false",
      "options": {
        "a": "Option A text",
        "b": "Option B text",
        "c": "Option C text",
        "d": "Option D text"
      },
      "answer": "Correct option key (e.g., 'a', 'b', 'c', 'd')"
    }
  ]
}
Note: For True/False questions, include only options "a" and "b".
Content Guidelines:

Base all questions and answers strictly on the information provided in the transcript.
Ensure that the correct answer ("answer" field) matches the content of the transcript.
Do not include any external information or assumptions.
Skip any promotions in the video, of the creator of the video or the sponsors.

Formatting Rules:

Do not include any additional text outside the JSON object.
Ensure the JSON is properly formatted, with correct syntax (e.g., commas, brackets).
Do not include comments or placeholders (e.g., no "// Repeat for questions 2 to 5").
Language and Clarity:

Use clear and concise language suitable for a general audience.
Avoid ambiguous or misleading questions and options.

Transcript:
${transcript.substring(0, 4000)}`;

    try {
      const quiz = await makeOpenAIRequest(prompt);
      
      if (!quiz.quiz || !Array.isArray(quiz.quiz) || quiz.quiz.length !== 5) {
        console.error(`Invalid quiz structure for ${moduleTitle}`);
        return generateFallbackQuiz(moduleTitle);
      }

      return quiz;
    } catch (error) {
      console.error(`Error generating quiz for ${moduleTitle}:`, error);
      return generateFallbackQuiz(moduleTitle);
    }
  } catch (error) {
    console.error(`Error in quiz generation for ${moduleTitle}:`, error);
    return generateFallbackQuiz(moduleTitle);
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

async function generateConclusion(courseOverview: any, moduleDetails: any[]) {
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

  return makeOpenAIRequest(conclusionPrompt);
}

async function generateFinalCourse(
  courseStructure: CourseStructure,
  selectedVideos: VideoItem[],
  moduleTranscripts: string[]
): Promise<FinalCourseStructure> {
  try {
    // Run course overview and module details generation in parallel
    const [courseOverview, moduleDetails] = await Promise.all([
      generateCourseOverview(courseStructure),
      generateModuleDetails(courseStructure, selectedVideos)
    ]);

    // Generate quizzes
    const { moduleQuizzes, finalQuiz } = await generateAllQuizzes(moduleTranscripts, courseStructure);

    // Generate conclusion after we have all other data
    const conclusion = await generateConclusion(courseOverview, moduleDetails);

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

async function generateCourseOverview(courseStructure: CourseStructure) {
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

  return makeOpenAIRequest(courseOverviewPrompt);
}

async function generateModuleDetails(courseStructure: CourseStructure, selectedVideos: VideoItem[]) {
  // Process modules in parallel batches of 3
  const batchSize = 3;
  const moduleDetails = [];
  
  for (let i = 0; i < courseStructure.OG_Module_Title.length; i += batchSize) {
    const batch = courseStructure.OG_Module_Title
      .slice(i, i + batchSize)
      .map(async (title, index) => {
        const moduleIndex = i + index;
        const modulePrompt = `
          Based on the following module information, generate a refined module title and objective:
          Module Title: ${title}
          Video Title: ${selectedVideos[moduleIndex].title}
          Video Description: ${selectedVideos[moduleIndex].description}

          Provide the response in JSON format with the following keys:
          {
            "Final_Module_Title": "refined module title",
            "Final_Module_Objective": "refined module objective"
          }
        `;

        return makeOpenAIRequest(modulePrompt);
      });

    const batchResults = await Promise.all(batch);
    moduleDetails.push(...batchResults);
  }

  return moduleDetails;
}

async function generateAllQuizzes(moduleTranscripts: string[], courseStructure: CourseStructure) {
  const moduleQuizzes = [];
  let allTranscripts = '';

  console.log('Starting quiz generation for all modules...');

  for (let i = 0; i < moduleTranscripts.length; i++) {
    const transcript = moduleTranscripts[i];
    console.log(`Processing module ${i + 1} of ${moduleTranscripts.length}`);

    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }

    try {
      const quiz = await generateQuiz(transcript, courseStructure.OG_Module_Title[i]);
      moduleQuizzes.push(quiz);
      allTranscripts += `Module ${i + 1} Content:\n${transcript}\n\n`;
      console.log(`Successfully generated quiz for module ${i + 1}`);
    } catch (error) {
      console.error(`Error processing module ${i + 1}:`, error);
      moduleQuizzes.push(generateFallbackQuiz(courseStructure.OG_Module_Title[i]));
    }
  }

  console.log(`Generated ${moduleQuizzes.length} module quizzes`);
  
  await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
  
  console.log('Generating final course quiz...');
  try {
    const finalTranscript = allTranscripts.substring(0, 4000);
    const finalQuiz = await generateQuiz(finalTranscript, courseStructure.OG_Course_Title, true);
    return { moduleQuizzes, finalQuiz };
  } catch (error) {
    console.error('Error generating final quiz:', error);
    return { 
      moduleQuizzes, 
      finalQuiz: generateFallbackQuiz(courseStructure.OG_Course_Title) 
    };
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    try {
      const finalCourse = await generateFinalCourse(
        data.courseStructure,
        data.selectedVideos,
        data.moduleTranscripts
      );

      return json({
        success: true,
        course: finalCourse
      });
    } catch (error) {
      console.error('Error in course generation:', error);
      if (error.response?.status === 429) {
        return json({
          success: false,
          error: 'Rate limit exceeded. Please try again in a few minutes.'
        }, { status: 429 });
      }
      return json({
        success: false,
        error: 'Error generating course content'
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