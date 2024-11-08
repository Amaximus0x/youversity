import { j as json } from "../../../../chunks/index2.js";
import axios from "axios";
const GET = async ({ url }) => {
  const videoId = url.searchParams.get("videoId");
  if (!videoId) {
    return new Response("Video ID is required", { status: 400 });
  }
  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    const html = response.data;
    const titleMatch = html.match(/"title":"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : "Untitled Video";
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : 0;
    const durationMinutes = durationSeconds / 60;
    return json({
      title,
      duration: parseFloat(durationMinutes.toFixed(2))
    });
  } catch (error) {
    console.error("Error fetching video metadata:", error);
    return new Response("Failed to fetch video metadata", { status: 500 });
  }
};
export {
  GET
};
