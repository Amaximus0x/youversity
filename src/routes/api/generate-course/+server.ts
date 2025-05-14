import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import axios from 'axios';
import type { CourseStructure } from '$lib/types/course';
import { OPENAI_CONFIG } from '$lib/config/openai';
import { addCorsHeaders, handleCorsOptions } from '$lib/utils/cors';

// Add OPTIONS handler for CORS preflight requests
export const OPTIONS: RequestHandler = async ({ request }) => {
  return handleCorsOptions(request);
};

// Update HEAD handler with consistent CORS headers
export const HEAD: RequestHandler = async ({ request, locals }) => {
  console.log("API: HEAD request to /api/generate-course endpoint");
  
  // Create a basic response and apply CORS headers
  const response = new Response(null, { status: 200 });
  return addCorsHeaders(response, request);
};

export const POST: RequestHandler = async ({ request, locals }) => {
  console.log("API: /api/generate-course endpoint called");
  console.log("API: Request method:", request.method);
  console.log("API: Request headers:", Object.fromEntries([...request.headers.entries()]));
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
  
  // Get Firebase token header
  const firebaseTokenHeader = request.headers.get('X-Firebase-Token');
  console.log("API: X-Firebase-Token header:", firebaseTokenHeader ? `Found (length: ${firebaseTokenHeader.length})` : "None");
  
  // Debug request body for auth info
  let requestData: any;
  let serverAuthInfo: { uid?: string; isAuthenticated?: boolean } | null = null;
  let tokenFromBody: string | null = null;
  let userIdFromBody: string | null = null;
  
  try {
    // Clone request to read and then restore for later use
    const clonedRequest = request.clone();
    requestData = await clonedRequest.json();
    serverAuthInfo = requestData.serverAuthInfo || null;
    tokenFromBody = requestData.token || null;
    userIdFromBody = requestData.userId || null;
    
    console.log("API: Server auth info from request body:", serverAuthInfo ? JSON.stringify(serverAuthInfo) : "None");
    console.log("API: Token from request body:", tokenFromBody ? `Found (length: ${tokenFromBody.length})` : "None");
    console.log("API: User ID from request body:", userIdFromBody || "None");
  } catch (error) {
    console.error("API: Error parsing request data:", error);
  }

  // Use auth info from the best available source
  const userFromLocals = locals.user;
  const userFromServerAuth = serverAuthInfo?.uid ? { uid: serverAuthInfo.uid } : null;
  const userFromDirectId = userIdFromBody ? { uid: userIdFromBody } : null;
  
  // Combine auth sources (prefer locals)
  const authenticatedUser = userFromLocals || userFromServerAuth || userFromDirectId;
  
  if (!authenticatedUser) {
    console.log("API: Unauthorized - No authenticated user found from any source");
    // Detailed error response for debugging
    const errorResponse = json({ 
      success: false, 
      error: 'Unauthorized', 
      message: 'Authentication required to access this resource',
      authSources: {
        locals: !!userFromLocals,
        serverAuth: !!userFromServerAuth,
        directId: !!userFromDirectId,
        authHeader: !!authHeader,
        serverAuthHeader: !!serverAuthUID,
        firebaseTokenHeader: !!firebaseTokenHeader,
        tokenFromBody: !!tokenFromBody
      },
      help: 'Ensure you are signed in and the token is being correctly passed in the Authorization header, X-Firebase-Token header, request body, or cookie'
    }, { status: 401 });
    
    // Add CORS headers to the error response
    return addCorsHeaders(errorResponse, request);
  }
  
  console.log("API: Processing request from user:", authenticatedUser.uid);
  
  try {
    // Re-clone the request to get fresh body
    const freshRequest = request.clone();
    const { courseInput } = await freshRequest.json();

    if (!courseInput?.trim()) {
      const errorResponse = json({ 
        success: false, 
        error: 'Course input is required' 
      }, { status: 400 });
      
      // Add CORS headers to the error response
      return addCorsHeaders(errorResponse, request);
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
        const errorResponse = json({ 
          success: false, 
          error: 'Failed to generate a valid course structure' 
        }, { status: 500 });
        
        // Add CORS headers to the error response
        return addCorsHeaders(errorResponse, request);
      }

      const successResponse = json({ 
        success: true, 
        courseStructure 
      });
      
      // Add CORS headers to the success response
      return addCorsHeaders(successResponse, request);

    } catch (error: any) {
      console.error('Error generating course:', error);
      
      let errorResponse;
      if (error.response?.data?.error) {
        errorResponse = json({ 
          success: false, 
          error: `OpenAI API error: ${error.response.data.error.message}` 
        }, { status: 500 });
      } else {
        errorResponse = json({ 
          success: false, 
          error: error.message || 'Failed to generate course' 
        }, { status: 500 });
      }
      
      // Add CORS headers to the error response
      return addCorsHeaders(errorResponse, request);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    const errorResponse = json({ 
      success: false, 
      error: 'Invalid request data' 
    }, { status: 400 });
    
    // Add CORS headers to the error response
    return addCorsHeaders(errorResponse, request);
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