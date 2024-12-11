import { e as error } from "../../../../chunks/index.js";
import axios from "axios";
async function fetchTranscriptFromYoutube(videoId) {
  console.log("=== Starting transcript fetch ===");
  console.log(`Video ID: ${videoId}`);
  try {
    const response = await axios.get(`https://youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://www.youtube.com/",
        "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1"
      },
      timeout: 15e3,
      maxRedirects: 5
    });
    const html = response.data;
    console.log("Successfully fetched video page");
    const patterns = [
      /ytInitialPlayerResponse\s*=\s*({.+?});/,
      /\"captions\":{\"playerCaptionsTracklistRenderer\":(.+?)}}/,
      /\"captionTracks\":(\[.+?\])/
    ];
    let captionTracks;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          if (data.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
            captionTracks = data.captions.playerCaptionsTracklistRenderer.captionTracks;
            console.log(`Found caption tracks using pattern: ${pattern}`);
            break;
          } else if (Array.isArray(data)) {
            captionTracks = data;
            console.log(`Found caption tracks array using pattern: ${pattern}`);
            break;
          }
        } catch (e) {
          console.warn("Failed to parse match:", e);
          continue;
        }
      }
    }
    if (!captionTracks || captionTracks.length === 0) {
      console.error("No caption tracks found");
      throw new Error("No captions available");
    }
    console.log(`Found ${captionTracks.length} caption tracks`);
    const captionTrack = captionTracks.find(
      (track) => track.languageCode === "en" && !track.kind || track.languageCode === "en" && track.kind === "asr" || track.vssId?.includes("en")
    );
    if (!captionTrack?.baseUrl) {
      console.error("No English caption track found");
      throw new Error("No English captions found");
    }
    console.log("Found English caption track:", {
      languageCode: captionTrack.languageCode,
      kind: captionTrack.kind,
      vssId: captionTrack.vssId
    });
    const transcriptResponse = await axios.get(captionTrack.baseUrl, {
      timeout: 1e4,
      maxRedirects: 5
    });
    console.log("Successfully fetched transcript XML");
    return transcriptResponse.data;
  } catch (error2) {
    console.error("Error fetching transcript:", error2);
    throw error2;
  }
}
async function parseTranscriptXml(transcriptXml) {
  console.log("=== Starting transcript parsing ===");
  console.log("Raw transcript length:", transcriptXml.length);
  try {
    let processedTranscript = transcriptXml;
    if (transcriptXml.includes("<?xml")) {
      console.log("Detected XML format, extracting transcript content");
      const match = transcriptXml.match(/<transcript>(.*?)<\/transcript>/s);
      if (match && match[1]) {
        processedTranscript = match[1];
        console.log("Successfully extracted transcript content from XML");
      }
    }
    const cleanTranscript = processedTranscript.replace(/<text[^>]*>/g, "").replace(/<\/text>/g, " ").replace(/start="[^"]*"/g, "").replace(/dur="[^"]*"/g, "").replace(/\s+/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    console.log("Transcript cleaning completed");
    console.log("Final transcript length:", cleanTranscript.length);
    console.log("Transcript preview:", cleanTranscript.substring(0, 200));
    return cleanTranscript;
  } catch (error2) {
    console.error("Error parsing transcript:", error2);
    return "No transcript available for this video";
  }
}
async function GET({ url }) {
  try {
    const videoId = url.searchParams.get("videoId");
    if (!videoId) {
      throw error(400, "Video ID is required");
    }
    console.log("Fetching transcript for video:", videoId);
    const transcriptResponse = await fetchTranscriptFromYoutube(videoId);
    const cleanTranscript = await parseTranscriptXml(transcriptResponse);
    return new Response(JSON.stringify({ transcript: cleanTranscript }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Error in transcript endpoint:", err);
    return new Response(JSON.stringify({
      transcript: "No transcript available for this video",
      error: err.message
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
export {
  GET
};
