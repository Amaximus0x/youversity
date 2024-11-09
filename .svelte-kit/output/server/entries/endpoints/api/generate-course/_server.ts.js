import { j as json } from "../../../../chunks/index2.js";
import { d as private_env } from "../../../../chunks/shared-server.js";
import axios from "axios";
async function generateCourse(User_Course_Input) {
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
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: {
        "Authorization": `Bearer ${private_env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    const content = response.data.choices[0].message.content;
    const lines = content.split("\n").filter((line) => line.trim());
    const courseStructure = {
      OG_Course_Title: "",
      OG_Course_Objective: "",
      OG_Module_Title: [],
      OG_Module_YouTube_Search_Prompt: []
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || "";
      if (line.startsWith("Course Title:")) {
        courseStructure.OG_Course_Title = line.replace("Course Title:", "").trim();
      } else if (line.startsWith("Course Objective:")) {
        courseStructure.OG_Course_Objective = line.replace("Course Objective:", "").trim();
      } else if (line.match(/^Module \d+ Title:/)) {
        const moduleTitle = line.replace(/^Module \d+ Title:\s*/, "").trim();
        const nextLine = lines[i + 1]?.trim() || "";
        const searchPrompt = nextLine.replace(/^Module \d+ Search Prompt:\s*/, "").trim();
        if (moduleTitle) {
          courseStructure.OG_Module_Title.push(moduleTitle);
          courseStructure.OG_Module_YouTube_Search_Prompt.push(searchPrompt);
        }
        i++;
      }
    }
    return courseStructure;
  } catch (error) {
    console.error("Error generating course:", error);
    throw error;
  }
}
const POST = async ({ request }) => {
  try {
    const { objective } = await request.json();
    const courseStructure = await generateCourse(objective);
    return json(courseStructure);
  } catch (error) {
    console.error("Error generating course:", error);
    return json({ error: "Failed to generate course structure" }, { status: 500 });
  }
};
export {
  POST
};
