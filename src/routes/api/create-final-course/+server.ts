// src/routes/api/create-final-course/+server.ts
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { RequestHandler } from './$types';
import type { CourseStructure, FinalCourseStructure, VideoItem, Quiz, QuizQuestion } from '$lib/types/course';
import { getVideoTranscript } from '$lib/services/transcriptUtils';
import pLimit from 'p-limit';
import { OPENAI_CONFIG } from '$lib/config/openai';
import { db } from '$lib/server/firebase-admin'; 
import { v4 as uuidv4 } from 'uuid';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function preprocessTranscript(transcript: string): string {
  if (!transcript) return '';
  
  return transcript
    // Remove multiple consecutive spaces
    .replace(/\s+/g, ' ')
    // Remove timestamps if present (common in YouTube transcripts)
    .replace(/\[\d{1,2}:\d{2}\]/g, '')
    // Remove speaker labels if present
    .replace(/^[A-Za-z]+:\s*/gm, '')
    // Remove any HTML tags if present
    .replace(/<[^>]*>/g, '')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove redundant newlines while preserving paragraph structure
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    // Remove any remaining special characters
    .replace(/[^\w\s.,!?;:'"()\n-]/g, '')
    // Trim the final result
    .trim();
}

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
            model: OPENAI_CONFIG.model,
            messages: [{ role: "user", content: prompt }],
            temperature: OPENAI_CONFIG.temperature,
          },
          {
            headers: {
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            timeout: 60000,
            transformResponse: [(data) => {
              // Remove XSSI prefix if present
              const cleanData = typeof data === 'string' ? data.replace(/^\)\]\}\'/, '') : data;
              try {
                return JSON.parse(cleanData);
              } catch (e) {
                return cleanData;
              }
            }]
          }
        );

        const content = response.data.choices[0].message.content;
        
        // Clean up markdown formatting if present
        const cleanedContent = content
          .replace(/```json\n?|\n?```/g, '')
          .trim();
        
        try {
          return JSON.parse(cleanedContent);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.error('Raw content:', content);
          console.error('Cleaned content:', cleanedContent);
          throw new Error('Invalid JSON response from OpenAI');
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  });
}

async function generateQuiz(transcript: string, moduleTitle: string, isFinalQuiz: boolean = false): Promise<Quiz | null> {
  try {
    if (typeof transcript !== 'string') {
      console.error('Invalid transcript type:', typeof transcript);
      return null;
    }

    // Preprocess the transcript
    const processedTranscript = preprocessTranscript(transcript);
    
    if (!processedTranscript) {
      console.error(`Empty transcript after processing for: ${moduleTitle}`);
      return null;
    }

    console.log(`Starting quiz generation for: ${moduleTitle}`);
    console.log(`Processed transcript length: ${processedTranscript.length} characters`);

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
${processedTranscript.substring(0, 4000)}`;

    try {
      const quiz = await makeOpenAIRequest(prompt);
      
      if (!quiz.quiz || !Array.isArray(quiz.quiz) || quiz.quiz.length !== 5) {
        console.error(`Invalid quiz structure for ${moduleTitle}`);
        return null;
      }

      return quiz;
    } catch (error) {
      console.error(`Error generating quiz for ${moduleTitle}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`Error in quiz generation for ${moduleTitle}:`, error);
    return null;
  }
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

function createYouTubePlaylist(course: Partial<FinalCourseStructure>): string {
  try {
    if (!course.Final_Module_YouTube_Video_URL || course.Final_Module_YouTube_Video_URL.length === 0) {
      return '';
    }

    // Extract video IDs from URLs
    const videoIds = course.Final_Module_YouTube_Video_URL.map(url => {
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i);
      return match ? match[1] : null;
    }).filter(id => id !== null);

    if (videoIds.length === 0) {
      return '';
    }

    // Create a YouTube playlist URL with the video IDs and course title
    const playlistTitle = encodeURIComponent(course.Final_Course_Title || '');
    const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}&title=${playlistTitle}`;
    return playlistUrl;
  } catch (error) {
    console.error('Error creating YouTube playlist URL:', error);
    return '';
  }
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

    // Check if we have any valid quizzes
    const hasValidQuizzes = moduleQuizzes.some(quiz => quiz !== null);

    // Generate conclusion after we have all other data
    const conclusion = await generateConclusion(courseOverview, moduleDetails);

    // Get video URLs
    const videoUrls = selectedVideos.map(video => video.videoUrl);
    const videoDurations = selectedVideos.map(video => video.length);
    const videoThumbnails = selectedVideos.map(video => video.thumbnailUrl);

    // Calculate total course duration
    const totalDuration = videoDurations.reduce((sum, duration) => sum + duration, 0);

    // Use first video thumbnail as course thumbnail if not provided
    let thumbnailUrl = videoThumbnails[0] || "";

    // Create a note about missing transcripts if no quizzes were generated
    let courseConclusion = conclusion.Final_Course_Conclusion;
    if (!hasValidQuizzes) {
      courseConclusion += '\n\nNote: This course does not include quizzes as transcripts were not available for the video content. You can still learn from the video materials, but self-assessment through quizzes is not available.';
    }

    return {
      Final_Course_Title: courseOverview.Final_Course_Title,
      Final_Course_Objective: courseOverview.Final_Course_Objective,
      Final_Course_Introduction: courseOverview.Final_Course_Introduction,
      Final_Module_Title: moduleDetails.map(module => module.Final_Module_Title),
      Final_Module_Objective: moduleDetails.map(module => module.Final_Module_Objective),
      Final_Module_YouTube_Video_URL: videoUrls,
      Final_Module_Video_Duration: videoDurations,
      Final_Module_Thumbnails: videoThumbnails,
      Final_Module_Quiz: moduleQuizzes,
      Final_Course_Quiz: finalQuiz,
      Final_Course_Conclusion: courseConclusion,
      Final_Course_Thumbnail: thumbnailUrl,
      Final_Course_Duration: totalDuration
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
          Based on the following module information, generate a refined module title and objective. Do not include any asterisks (*) in the title:
          Module Title: ${title}
          Video Title: ${selectedVideos[moduleIndex].title}
          Video Description: ${selectedVideos[moduleIndex].description}

          Provide the response in JSON format with the following keys:
          {
            "Final_Module_Title": "refined module title (no asterisks)",
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
  const moduleQuizzes: (Quiz | null)[] = [];
  let validTranscripts = '';
  let validTranscriptCount = 0;
  const batchSize = 3; // Process 3 quizzes in parallel

  console.log('Starting quiz generation for all modules...');

  // Process module quizzes in batches
  for (let i = 0; i < moduleTranscripts.length; i += batchSize) {
    const batch = moduleTranscripts
      .slice(i, i + batchSize)
      .map(async (transcript, index) => {
        const moduleIndex = i + index;
        try {
          // Check if transcript is missing or invalid
          if (!transcript || 
              transcript === 'No transcript available for this video' || 
              transcript === 'No transcript available after multiple attempts') {
            console.log(`Skipping quiz generation for module ${moduleIndex + 1} - No valid transcript`);
            return null;
          }

          // Pre-process transcript before quiz generation
          const processedTranscript = preprocessTranscript(transcript);
          const quiz = await generateQuiz(processedTranscript, courseStructure.OG_Module_Title[moduleIndex]);
          if (quiz) {
            validTranscripts += `Module ${moduleIndex + 1} Content:\n${processedTranscript}\n\n`;
            validTranscriptCount++;
          }
          console.log(`Successfully generated quiz for module ${moduleIndex + 1}`);
          return quiz;
        } catch (error) {
          console.error(`Error processing module ${moduleIndex + 1}:`, error);
          return null;
        }
      });

    const batchResults = await Promise.all(batch);
    moduleQuizzes.push(...batchResults);

    // Add a small delay between batches to prevent rate limiting
    if (i + batchSize < moduleTranscripts.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }

  console.log(`Generated ${moduleQuizzes.length} module quizzes`);
  console.log(`Found ${validTranscriptCount} valid transcripts`);
  
  // Generate final course quiz only if there are valid transcripts
  if (validTranscriptCount > 0) {
    console.log('Generating final course quiz...');
    try {
      const finalTranscript = preprocessTranscript(validTranscripts).substring(0, 4000);
      const finalQuiz = await generateQuiz(finalTranscript, courseStructure.OG_Course_Title, true);
      return { moduleQuizzes, finalQuiz };
    } catch (error) {
      console.error('Error generating final quiz:', error);
      return { 
        moduleQuizzes, 
        finalQuiz: null 
      };
    }
  } else {
    console.log('No valid transcripts found - skipping final quiz generation');
    return {
      moduleQuizzes,
      finalQuiz: null
    };
  }
}

function validateCourseStructure(data: any): data is CourseStructure {
    // Basic structure validation
    if (!data || typeof data !== 'object') return false;
    
    // Check required fields exist and are not empty
    const requiredFields = [
        'OG_Course_Title',
        'OG_Course_Objective',
        'OG_Module_Title',
        'OG_Module_YouTube_Search_Prompt'
    ];
    
    for (const field of requiredFields) {
        if (!(field in data) || !data[field] || 
            (typeof data[field] === 'string' && data[field].trim() === '')) {
            console.error(`Missing or empty required field: ${field}`);
            return false;
        }
    }
    
    // Validate arrays have same length and no empty/undefined elements
    if (!Array.isArray(data.OG_Module_Title) || 
        !Array.isArray(data.OG_Module_YouTube_Search_Prompt)) {
        console.error('Module titles or search prompts are not arrays');
        return false;
    }
    
    if (data.OG_Module_Title.length !== data.OG_Module_YouTube_Search_Prompt.length) {
        console.error('Mismatch in length between module titles and search prompts');
        return false;
    }
    
    // Check for empty or malformed entries
    const hasValidEntries = data.OG_Module_Title.every((title, index) => {
        const isValidTitle = typeof title === 'string' && title.trim() !== '';
        const isValidPrompt = typeof data.OG_Module_YouTube_Search_Prompt[index] === 'string' 
            && data.OG_Module_YouTube_Search_Prompt[index].trim() !== '';
        
        if (!isValidTitle) {
            console.error(`Invalid module title at index ${index}`);
        }
        if (!isValidPrompt) {
            console.error(`Invalid search prompt at index ${index}`);
        }
        
        return isValidTitle && isValidPrompt;
    });
    
    if (!hasValidEntries) {
        return false;
    }

    // Validate course objective specifically
    if (typeof data.OG_Course_Objective !== 'string' || 
        data.OG_Course_Objective.trim().length < 10) {
        console.error('Course objective is missing or too short');
        return false;
    }
    
    return true;
}

// Add a HEAD handler
export const HEAD: RequestHandler = async ({ request, locals }) => {
  console.log("API: HEAD request to /api/create-final-course endpoint");
  
  // Return a simple 200 OK response with CORS headers
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-Token, X-Server-Auth-UID',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
};

export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        console.log("API: /api/create-final-course endpoint called");
        console.log("API: User in locals:", locals.user ? `User ${locals.user.uid} authenticated` : "No user in locals");
        
        // DEVELOPMENT MODE SHORTCUT - Allow all requests in development mode if desired
        if (process.env.NODE_ENV === 'development' && !locals.user) {
            console.log("API: Development mode - creating mock user authentication");
            
            // Check if there's a test header first
            const devTestUID = request.headers.get('X-Dev-Test-UID');
            const now = Math.floor(Date.now() / 1000);
            
            if (devTestUID) {
                console.log(`API: Using X-Dev-Test-UID header value: ${devTestUID}`);
                locals.user = { 
                    uid: devTestUID,
                    email: 'dev-test@example.com',
                    email_verified: true,
                    aud: 'mock-project-id',
                    auth_time: now,
                    exp: now + 3600,
                    firebase: { sign_in_provider: 'custom', identities: {} },
                    iat: now,
                    iss: 'https://securetoken.google.com/mock-project-id',
                    sub: devTestUID
                };
            } else {
                console.log("API: Using default development test user");
                locals.user = { 
                    uid: 'dev-test-user',
                    email: 'dev-test@example.com',
                    email_verified: true,
                    aud: 'mock-project-id',
                    auth_time: now,
                    exp: now + 3600,
                    firebase: { sign_in_provider: 'custom', identities: {} },
                    iat: now,
                    iss: 'https://securetoken.google.com/mock-project-id',
                    sub: 'dev-test-user'
                };
            }
        }
        
        // Debug cookies and headers
        const authHeader = request.headers.get('Authorization');
        console.log("API: Authorization header:", authHeader ? `${authHeader.substring(0, 20)}...` : "None");
        
        // Get custom server auth header
        const serverAuthUID = request.headers.get('X-Server-Auth-UID');
        console.log("API: Server Auth UID header:", serverAuthUID || "None");
        
        // Clone request to read auth info
        const clonedRequest = request.clone();
        let requestJson;
        let serverAuthInfo = null;
        
        try {
            requestJson = await clonedRequest.json();
            serverAuthInfo = requestJson.serverAuthInfo;
            console.log("API: Server auth info from request body:", serverAuthInfo ? JSON.stringify(serverAuthInfo) : "None");
        } catch (error) {
            console.error("API: Error parsing request data:", error);
        }

        // Use auth info from the best available source
        const userFromLocals = locals.user;
        const userFromServerAuth = serverAuthInfo?.uid ? { uid: serverAuthInfo.uid } : null;
        
        // Combine auth sources (prefer locals)
        const authenticatedUser = userFromLocals || userFromServerAuth;
        
        if (!authenticatedUser) {
            console.log("API: Unauthorized - No authenticated user found from any source");
            // Detailed error response for debugging
            return json({ 
                success: false, 
                error: 'Unauthorized', 
                message: 'Authentication required to access this resource',
                authSources: {
                    locals: !!userFromLocals,
                    serverAuth: !!userFromServerAuth,
                    authHeader: !!authHeader,
                    serverAuthHeader: !!serverAuthUID
                },
                help: 'Ensure you are signed in and the token is being correctly passed'
            }, { status: 401 });
        }
        
        console.log("API: Processing request from user:", authenticatedUser.uid);
        
        // Fresh request for data
        const freshRequest = request.clone();
        const data = await freshRequest.json();
        
        // Continue with original code:
        // Log the received data for debugging
        console.log('Received course structure:', JSON.stringify(data.courseStructure, null, 2));
        
        // Validate required fields
        if (!data.courseStructure || !data.selectedVideos || !data.moduleTranscripts) {
            const missingFields = [];
            if (!data.courseStructure) missingFields.push('courseStructure');
            if (!data.selectedVideos) missingFields.push('selectedVideos');
            if (!data.moduleTranscripts) missingFields.push('moduleTranscripts');
            
            return json({
                success: false,
                error: `Missing required data: ${missingFields.join(', ')}`
            }, { status: 400 });
        }

        if (!validateCourseStructure(data.courseStructure)) {
            return json({
                success: false,
                error: 'Invalid course structure format or missing required fields. Check server logs for details.'
            }, { status: 400 });
        }

        try {
            const finalCourse = await generateFinalCourse(
                data.courseStructure,
                data.selectedVideos,
                data.moduleTranscripts
            );

            // Validate the generated course
            if (!finalCourse || !finalCourse.Final_Course_Title) {
                throw new Error('Invalid course generation result');
            }

            return json({
                success: true,
                course: finalCourse
            });
            
        } catch (error: any) {
            console.error('Error in course generation:', error);
            
            // Handle rate limit errors
            if (error.response?.status === 429) {
                return json({
                    success: false,
                    error: 'Rate limit exceeded. Please try again in a few minutes.'
                }, { status: 429 });
            }

            // Handle OpenAI API errors
            if (error.response?.data?.error) {
                return json({
                    success: false,
                    error: error.response.data.error.message || 'OpenAI API error'
                }, { status: 500 });
            }

            return json({
                success: false,
                error: error.message || 'Error generating course content'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Error processing request:', error);
        return json({
            success: false,
            error: 'Invalid request data'
        }, { status: 400 });
    }
};