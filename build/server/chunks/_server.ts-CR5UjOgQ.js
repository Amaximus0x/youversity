import { j as json } from './index-DzcLzHBX.js';
import axios from 'axios';

const youtubeEndpoint = "https://www.youtube.com";
const GetListByKeyword = async (keyword, moduleTitle, usedVideoIds, moduleIndex) => {
  try {
    const cleanKeyword = keyword.replace(/^Search \d+:\s*/i, "").trim();
    const cleanModuleTitle = moduleTitle.replace(/^Module \d+:\s*/i, "").trim();
    const searchQueries = [
      cleanKeyword,
      `${cleanKeyword} tutorial`,
      cleanModuleTitle,
      `${cleanModuleTitle} tutorial`
    ];
    let allVideos = [];
    for (const query of searchQueries) {
      try {
        const endpoint = `${youtubeEndpoint}/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D&hl=en&gl=US`;
        const response = await axios.get(endpoint, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Cookie": "PREF=hl=en&gl=US"
          },
          timeout: 5e3
        });
        const ytInitialData = response.data.split("var ytInitialData = ")[1];
        if (!ytInitialData) continue;
        const dataString = ytInitialData.split("<\/script>")[0].slice(0, -1);
        const data = JSON.parse(dataString);
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        if (!contents) continue;
        for (const content of contents) {
          if (!content.itemSectionRenderer?.contents) continue;
          const videos = content.itemSectionRenderer.contents.filter((item) => item.videoRenderer).map((item) => {
            const video = item.videoRenderer;
            const lengthText = video.lengthText?.simpleText;
            const durationInMinutes = parseFloat(formatDuration(lengthText));
            return {
              videoId: video.videoId,
              videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
              title: video.title.runs[0].text,
              description: video.descriptionSnippet?.runs[0]?.text || "",
              length: durationInMinutes,
              thumbnailUrl: video.thumbnail.thumbnails[0].url
            };
          }).filter(
            (video) => video && // Ensure video exists
            isEnglishVideo(video) && // Filter for English videos
            !usedVideoIds.has(video.videoId) && // Check for duplicates using videoId
            !allVideos.some((v) => v.videoId === video.videoId) && // Double-check against current results
            video.length >= 3 && video.length <= 20
          );
          for (const video of videos) {
            if (allVideos.length >= 5) break;
            if (!allVideos.some((v) => v.videoId === video.videoId) && !usedVideoIds.has(video.videoId)) {
              allVideos.push(video);
              usedVideoIds.add(video.videoId);
            }
          }
          if (allVideos.length >= 5) break;
        }
        if (allVideos.length >= 5) break;
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    }
    if (allVideos.length < 5) {
      const lastResortQuery = `${cleanKeyword} how to`;
      try {
        const endpoint = `${youtubeEndpoint}/results?search_query=${encodeURIComponent(lastResortQuery)}&sp=EgIQAQ%3D%3D`;
        const response = await axios.get(endpoint, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
          },
          timeout: 5e3
        });
      } catch (error) {
        console.error("Error in last resort search:", error);
      }
    }
    return allVideos.length > 0 ? allVideos.slice(0, 5) : Array(5).fill(createPlaceholderVideo());
  } catch (error) {
    console.error("Error in GetListByKeyword:", error);
    return Array(5).fill(createPlaceholderVideo());
  }
};
const formatDuration = (durationText) => {
  if (!durationText) return "0";
  const parts = durationText.split(":").map(Number);
  if (parts.length === 2) {
    return (parts[0] + parts[1] / 60).toFixed(2);
  } else if (parts.length === 3) {
    return (parts[0] * 60 + parts[1] + parts[2] / 60).toFixed(2);
  }
  return "0";
};
const createPlaceholderVideo = () => ({
  videoId: "",
  videoUrl: "",
  title: "No relevant video found",
  description: "Please try regenerating the course or selecting a different topic.",
  length: 0,
  thumbnailUrl: "https://placehold.co/120x90/lightgray/darkgray.png?text=No+Video"
});
function isEnglishVideo(video) {
  const text = `${video.title} ${video.description}`.toLowerCase();
  const nonEnglishIndicators = [
    "[한국어]",
    "[日本語]",
    "[中文]",
    "[español]",
    "[français]",
    "[deutsch]",
    "(한국어)",
    "(日本語)",
    "(中文)",
    "(español)",
    "(français)",
    "(deutsch)",
    "subtitles",
    "субтитры",
    "مترجم",
    "字幕"
  ];
  if (nonEnglishIndicators.some((indicator) => text.includes(indicator))) {
    return false;
  }
  const latinCharRegex = /^[\x00-\x7F\s]*$/;
  const nonLatinCharPercentage = video.title.split("").filter((char) => !latinCharRegex.test(char)).length / video.title.length;
  return nonLatinCharPercentage < 0.15;
}
const GET = async ({ url }) => {
  const query = url.searchParams.get("query")?.trim();
  const moduleTitle = url.searchParams.get("moduleTitle");
  const moduleIndex = parseInt(url.searchParams.get("moduleIndex") || "0");
  if (!query) {
    return new Response(JSON.stringify({
      error: "Query parameter is required",
      videos: Array(5).fill(createPlaceholderVideo())
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    console.log("Searching videos for:", { query, moduleTitle, moduleIndex });
    const videos = await GetListByKeyword(query, moduleTitle || "", /* @__PURE__ */ new Set(), moduleIndex);
    if (videos.every((v) => !v.videoId)) {
      console.log("No videos found, retrying with simplified query...");
      const simplifiedQuery = query.split(" ").slice(0, 3).join(" ");
      const retryVideos = await GetListByKeyword(simplifiedQuery, moduleTitle || "", /* @__PURE__ */ new Set(), moduleIndex);
      return json({ videos: retryVideos });
    }
    return json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return json({
      videos: Array(5).fill(createPlaceholderVideo())
    });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-CR5UjOgQ.js.map
