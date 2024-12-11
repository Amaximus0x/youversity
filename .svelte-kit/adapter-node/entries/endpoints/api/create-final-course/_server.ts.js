import { j as json } from "../../../../chunks/index.js";
import { d as private_env } from "../../../../chunks/shared-server.js";
import axios from "axios";
import pLimit from "p-limit";
import { O as OPENAI_CONFIG } from "../../../../chunks/openai.js";
function preprocessTranscript(transcript) {
  if (!transcript) return "";
  return transcript.replace(/\s+/g, " ").replace(/\[\d{1,2}:\d{2}\]/g, "").replace(/^[A-Za-z]+:\s*/gm, "").replace(/<[^>]*>/g, "").replace(/https?:\/\/[^\s]+/g, "").split("\n").map((line) => line.trim()).filter((line) => line.length > 0).join("\n").replace(/[^\w\s.,!?;:'"()\n-]/g, "").trim();
}
const openAIRateLimit = pLimit(3);
const RPM_LIMIT = 200;
const DELAY_BETWEEN_REQUESTS = Math.ceil(60 * 1e3 / RPM_LIMIT);
async function makeOpenAIRequest(prompt, retries = 2) {
  return openAIRateLimit(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: OPENAI_CONFIG.model,
            messages: [{ role: "user", content: prompt }],
            temperature: OPENAI_CONFIG.temperature
          },
          {
            headers: {
              "Authorization": `Bearer ${private_env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            timeout: 3e4,
            transformResponse: [(data) => {
              const cleanData = typeof data === "string" ? data.replace(/^\)\]\}\'/, "") : data;
              try {
                return JSON.parse(cleanData);
              } catch (e) {
                return cleanData;
              }
            }]
          }
        );
        const content = response.data.choices[0].message.content;
        const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
        try {
          return JSON.parse(cleanedContent);
        } catch (parseError) {
          console.error("JSON Parse Error:", parseError);
          console.error("Raw content:", content);
          console.error("Cleaned content:", cleanedContent);
          throw new Error("Invalid JSON response from OpenAI");
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1e3 * (i + 1)));
      }
    }
  });
}
async function generateQuiz(transcript, moduleTitle, isFinalQuiz = false) {
  try {
    if (typeof transcript !== "string") {
      console.error("Invalid transcript type:", typeof transcript);
      return null;
    }
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
${processedTranscript.substring(0, 4e3)}`;
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
async function generateConclusion(courseOverview, moduleDetails) {
  const conclusionPrompt = `
    Based on the course structure and modules, generate a conclusion for the course:
    Course Title: ${courseOverview.Final_Course_Title}
    Course Objective: ${courseOverview.Final_Course_Objective}
    Modules: ${moduleDetails.map((m) => m.Final_Module_Title).join(", ")}

    Provide the response in JSON format with the following key:
    {
      "Final_Course_Conclusion": "engaging conclusion"
    }
  `;
  return makeOpenAIRequest(conclusionPrompt);
}
async function generateFinalCourse(courseStructure, selectedVideos, moduleTranscripts) {
  try {
    const [courseOverview, moduleDetails] = await Promise.all([
      generateCourseOverview(courseStructure),
      generateModuleDetails(courseStructure, selectedVideos)
    ]);
    const { moduleQuizzes, finalQuiz } = await generateAllQuizzes(moduleTranscripts, courseStructure);
    const conclusion = await generateConclusion(courseOverview, moduleDetails);
    const videoUrls = selectedVideos.map((video) => video.videoUrl);
    let thumbnailUrl = "";
    if (selectedVideos[0]?.videoUrl) {
      const videoId = new URL(selectedVideos[0].videoUrl).searchParams.get("v");
      if (videoId) {
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }
    return {
      Final_Course_Title: courseOverview.Final_Course_Title,
      Final_Course_Objective: courseOverview.Final_Course_Objective,
      Final_Course_Introduction: courseOverview.Final_Course_Introduction,
      Final_Module_Title: moduleDetails.map((module) => module.Final_Module_Title),
      Final_Module_Objective: moduleDetails.map((module) => module.Final_Module_Objective),
      Final_Module_YouTube_Video_URL: videoUrls,
      Final_Module_Quiz: moduleQuizzes,
      Final_Course_Quiz: finalQuiz,
      Final_Course_Conclusion: conclusion.Final_Course_Conclusion,
      Final_Course_Thumbnail: thumbnailUrl
    };
  } catch (error) {
    console.error("Error in generateFinalCourse:", error);
    throw error;
  }
}
async function generateCourseOverview(courseStructure) {
  const courseOverviewPrompt = `
    Based on the following course structure, generate a refined course title, objective, and introduction:
    Original Title: ${courseStructure.OG_Course_Title}
    Original Objective: ${courseStructure.OG_Course_Objective}
    Modules: ${courseStructure.OG_Module_Title.join(", ")}

    Provide the response in JSON format with the following keys:
    {
      "Final_Course_Title": "refined title",
      "Final_Course_Objective": "refined objective",
      "Final_Course_Introduction": "engaging introduction"
    }
  `;
  return makeOpenAIRequest(courseOverviewPrompt);
}
async function generateModuleDetails(courseStructure, selectedVideos) {
  const batchSize = 3;
  const moduleDetails = [];
  for (let i = 0; i < courseStructure.OG_Module_Title.length; i += batchSize) {
    const batch = courseStructure.OG_Module_Title.slice(i, i + batchSize).map(async (title, index) => {
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
async function generateAllQuizzes(moduleTranscripts, courseStructure) {
  const moduleQuizzes = [];
  let allTranscripts = "";
  const batchSize = 3;
  console.log("Starting quiz generation for all modules...");
  for (let i = 0; i < moduleTranscripts.length; i += batchSize) {
    const batch = moduleTranscripts.slice(i, i + batchSize).map(async (transcript, index) => {
      const moduleIndex = i + index;
      try {
        const processedTranscript = preprocessTranscript(transcript);
        const quiz = await generateQuiz(processedTranscript, courseStructure.OG_Module_Title[moduleIndex]);
        if (quiz) {
          allTranscripts += `Module ${moduleIndex + 1} Content:
${processedTranscript}

`;
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
    if (i + batchSize < moduleTranscripts.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }
  console.log(`Generated ${moduleQuizzes.length} module quizzes`);
  console.log("Generating final course quiz...");
  try {
    const finalTranscript = preprocessTranscript(allTranscripts).substring(0, 4e3);
    const finalQuiz = await generateQuiz(finalTranscript, courseStructure.OG_Course_Title, true);
    return { moduleQuizzes, finalQuiz };
  } catch (error) {
    console.error("Error generating final quiz:", error);
    return {
      moduleQuizzes,
      finalQuiz: null
    };
  }
}
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data.courseStructure || !data.selectedVideos || !data.moduleTranscripts) {
      return json({
        success: false,
        error: "Missing required data"
      }, { status: 400 });
    }
    try {
      const finalCourse = await generateFinalCourse(
        data.courseStructure,
        data.selectedVideos,
        data.moduleTranscripts
      );
      if (!finalCourse || !finalCourse.Final_Course_Title) {
        throw new Error("Invalid course generation result");
      }
      return new Response(JSON.stringify({
        success: true,
        course: finalCourse
      }), {
        headers: {
          "Content-Type": "application/json",
          // Prevent browsers from doing XSSI protection
          "X-Content-Type-Options": "nosniff"
        }
      });
    } catch (error) {
      console.error("Error in course generation:", error);
      if (error.response?.status === 429) {
        return json({
          success: false,
          error: "Rate limit exceeded. Please try again in a few minutes."
        }, { status: 429 });
      }
      if (error.response?.data?.error) {
        return json({
          success: false,
          error: error.response.data.error.message || "OpenAI API error"
        }, { status: 500 });
      }
      return json({
        success: false,
        error: error.message || "Error generating course content"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return json({
      success: false,
      error: "Invalid request data"
    }, { status: 400 });
  }
};
export {
  POST
};
