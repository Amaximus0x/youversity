import { error } from "@sveltejs/kit";
import axios from "axios";
import { ProxyAgent } from "undici";
import { addCorsHeaders, handleCorsOptions } from '$lib/utils/cors';
import { Dispatcher } from "undici";

const proxyUrl =
  "http://kQdcMjN5Ls6E1DK3:gurktsM4S7wdOnUF@geo.iproyal.com:12321";
const proxyAgent = new ProxyAgent(proxyUrl);

// Add OPTIONS handler for CORS preflight requests
export const OPTIONS = async ({ request }) => {
  return handleCorsOptions(request);
};

async function fetchTranscriptFromYoutube(videoId: string): Promise<string> {
  console.log("=== Starting transcript fetch ===");
  console.log(`Video ID: ${videoId}`);

  try {
    // Step 1: Fetch the YouTube page with proxy
    console.log("Fetching YouTube page with proxy...");
    
    // Setup fetch options with proxy agent properly typed
    const fetchOptions: {
      headers: Record<string, string>;
      dispatcher: Dispatcher;
    } = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://www.youtube.com/",
      },
      dispatcher: proxyAgent,
    };

    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, fetchOptions);

    if (!response.ok) {
      throw new Error("Invalid response from YouTube");
    }

    const html = await response.text();
    console.log("Successfully fetched video page, length:", html.length);

    // Try multiple patterns to find caption data
    const patterns = [
      /ytInitialPlayerResponse\s*=\s*({.+?});/,
      /"captions":{("playerCaptionsTracklistRenderer":.*?})}/,
      /"captionTracks":(\[.*?\])/,
      /\{"playerCaptionsTracklistRenderer":({.*?})\}/,
    ];

    let captionTracks;
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          if (data.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
            captionTracks =
              data.captions.playerCaptionsTracklistRenderer.captionTracks;
            break;
          } else if (data.captionTracks) {
            captionTracks = data.captionTracks;
            break;
          } else if (Array.isArray(data)) {
            captionTracks = data;
            break;
          }
        } catch (e) {
          console.warn("Failed to parse match:", e);
          continue;
        }
      }
    }

    if (!captionTracks || !Array.isArray(captionTracks)) {
      // Try alternative method
      const altMatch = html.match(/"captionTracks":\[(.*?)\]}/);
      if (altMatch) {
        try {
          captionTracks = JSON.parse(`[${altMatch[1]}]`);
        } catch (e) {
          console.warn("Failed to parse alternative caption tracks:", e);
        }
      }
    }

    if (!captionTracks || !Array.isArray(captionTracks)) {
      throw new Error("No captions available");
    }

    const captionTrack = captionTracks.find(
      (track: any) =>
        (track.languageCode === "en" && !track.kind) ||
        (track.languageCode === "en" && track.kind === "asr") ||
        track.vssId?.includes("a.en") ||
        track.vssId?.includes("en"),
    );

    if (!captionTrack?.baseUrl) {
      throw new Error("No English captions found");
    }

    // Step 2: Fetch the transcript XML with proxy
    console.log("Fetching transcript XML with proxy...");
    const transcriptResponse = await fetch(captionTrack.baseUrl, {
      headers: {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: "https://www.youtube.com/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      dispatcher: proxyAgent, // Use the same proxy agent
    } as { headers: Record<string, string>; dispatcher: Dispatcher });

    if (!transcriptResponse.ok) {
      throw new Error(`Failed to fetch transcript XML: ${transcriptResponse.status}`);
    }

    return await transcriptResponse.text();
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}

async function parseTranscriptXml(transcriptXml: string): Promise<string> {
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

    const cleanTranscript = processedTranscript
      .replace(/<text[^>]*>/g, "")
      .replace(/<\/text>/g, " ")
      .replace(/start="[^"]*"/g, "")
      .replace(/dur="[^"]*"/g, "")
      .replace(/\s+/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    console.log("Transcript cleaning completed");
    console.log("Final transcript length:", cleanTranscript.length);
    console.log("Transcript preview:", cleanTranscript.substring(0, 200));

    return cleanTranscript || "No transcript available for this video";
  } catch (error) {
    console.error("Error parsing transcript:", error);
    return "No transcript available for this video";
  }
}

export async function GET({ url, request }) {
  try {
    const videoId = url.searchParams.get("videoId");

    if (!videoId) {
      const errorResponse = new Response(JSON.stringify({ error: "Video ID is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
      return addCorsHeaders(errorResponse, request);
    }

    console.log("Fetching transcript for video:", videoId);
    const transcriptResponse = await fetchTranscriptFromYoutube(videoId);
    const cleanTranscript = await parseTranscriptXml(transcriptResponse);

    const successResponse = new Response(JSON.stringify({ transcript: cleanTranscript }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return addCorsHeaders(successResponse, request);
  } catch (err: any) {
    console.error("Error in transcript endpoint:", err);
    const errorResponse = new Response(
      JSON.stringify({
        transcript: "No transcript available for this video",
        error: err.message,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return addCorsHeaders(errorResponse, request);
  }
}
