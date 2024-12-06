import axios from 'axios';
import type { VideoItem } from '$lib/types/course';

const youtubeEndpoint = 'https://www.youtube.com';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isRelevantVideo(video: VideoItem, keyword: string, moduleTitle: string): boolean {
  const videoText = `${video.title} ${video.description}`.toLowerCase();
  
  // Clean and prepare search terms
  const keywordTerms = keyword.toLowerCase()
    .split(' ')
    .filter(term => term.length > 2)
    .filter(term => !['the', 'and', 'for', 'with', 'how', 'to', 'of', 'in', 'on', 'at'].includes(term));

  const moduleTitleTerms = moduleTitle.toLowerCase()
    .split(' ')
    .filter(term => term.length > 2)
    .filter(term => !['the', 'and', 'for', 'with', 'how', 'to', 'of', 'in', 'on', 'at'].includes(term));

  // Calculate matches
  const keywordMatches = keywordTerms.filter(term => videoText.includes(term));
  const titleMatches = moduleTitleTerms.filter(term => videoText.includes(term));

  // Video must match at least one term from each category
  return keywordMatches.length > 0 && titleMatches.length > 0;
}

function calculateVideoRelevanceScore(video: VideoItem, keyword: string, moduleTitle: string, moduleIndex: number): number {
  const videoText = `${video.title} ${video.description}`.toLowerCase();
  const mainTopic = keyword.toLowerCase().split(' ')[0];
  
  // Ensure main topic is in the video title or description
  if (!videoText.includes(mainTopic)) {
    return -1; // Negative score for off-topic videos
  }

  const keywordTerms = keyword.toLowerCase().split(' ');
  const moduleTitleTerms = moduleTitle.toLowerCase().split(' ');

  // Basic term matching
  const keywordMatches = keywordTerms.filter(term => videoText.includes(term)).length;
  const titleMatches = moduleTitleTerms.filter(term => videoText.includes(term)).length;

  // Check for difficulty level indicators
  const beginnerTerms = ['basic', 'beginner', 'introduction', 'start', 'fundamental'];
  const intermediateTerms = ['intermediate', 'improve', 'practice', 'technique'];
  const advancedTerms = ['advanced', 'expert', 'master', 'professional'];

  let difficultyScore = 0;
  const moduleProgress = moduleIndex / 9;

  if (moduleProgress < 0.3) {
    difficultyScore = beginnerTerms.some(term => videoText.includes(term)) ? 2 : 0;
  } else if (moduleProgress < 0.7) {
    difficultyScore = intermediateTerms.some(term => videoText.includes(term)) ? 2 : 0;
  } else {
    difficultyScore = advancedTerms.some(term => videoText.includes(term)) ? 2 : 0;
  }

  return (keywordMatches / keywordTerms.length) * 3 +
         (titleMatches / moduleTitleTerms.length) * 5 +
         difficultyScore;
}

export const GetListByKeyword = async (
  keyword: string, 
  moduleTitle: string, 
  usedVideoIds: Set<string>,
  moduleIndex: number
): Promise<VideoItem[]> => {
  try {
    // Clean up the search query
    const cleanKeyword = keyword.replace(/^Search \d+:\s*/i, '').trim();
    const cleanModuleTitle = moduleTitle.replace(/^Module \d+:\s*/i, '').trim();

    // Create simple, direct search queries
    const searchQueries = [
      cleanKeyword,
      `${cleanKeyword} tutorial`,
      cleanModuleTitle,
      `${cleanModuleTitle} tutorial`
    ];

    let allVideos: VideoItem[] = [];

    for (const query of searchQueries) {
      try {
        const endpoint = `${youtubeEndpoint}/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D&hl=en&gl=US`;
        
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': 'PREF=hl=en&gl=US'
          },
          timeout: 5000
        });

        const ytInitialData = response.data.split('var ytInitialData = ')[1];
        if (!ytInitialData) continue;

        const dataString = ytInitialData.split('</script>')[0].slice(0, -1);
        const data = JSON.parse(dataString);

        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents;

        if (!contents) continue;

        for (const content of contents) {
          if (!content.itemSectionRenderer?.contents) continue;

          const videos = content.itemSectionRenderer.contents
            .filter(item => item.videoRenderer)
            .map(item => {
              const video = item.videoRenderer;
              const lengthText = video.lengthText?.simpleText;
              const durationInMinutes = parseFloat(formatDuration(lengthText));

              return {
                videoId: video.videoId,
                videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
                title: video.title.runs[0].text,
                description: video.descriptionSnippet?.runs[0]?.text || '',
                length: durationInMinutes,
                thumbnailUrl: video.thumbnail.thumbnails[0].url
              };
            })
            .filter(video => 
              video && // Ensure video exists
              isEnglishVideo(video) && // Filter for English videos
              !usedVideoIds.has(video.videoId) && // Check for duplicates using videoId
              !allVideos.some(v => v.videoId === video.videoId) && // Double-check against current results
              video.length >= 3 && 
              video.length <= 20
            );

          // Filter out duplicates and add new videos
          for (const video of videos) {
            if (allVideos.length >= 5) break;
            if (!allVideos.some(v => v.videoId === video.videoId) && !usedVideoIds.has(video.videoId)) {
              allVideos.push(video);
              usedVideoIds.add(video.videoId);
            }
          }

          if (allVideos.length >= 5) break;
        }

        if (allVideos.length >= 5) break;
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    }

    // If we don't have enough videos, try one last broad search
    if (allVideos.length < 5) {
      const lastResortQuery = `${cleanKeyword} how to`;
      try {
        const endpoint = `${youtubeEndpoint}/results?search_query=${encodeURIComponent(lastResortQuery)}&sp=EgIQAQ%3D%3D`;
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 5000
        });

        // Process response similar to above...
        // (Add similar video extraction code here)
      } catch (error) {
        console.error('Error in last resort search:', error);
      }
    }

    // Return the best 3 videos or placeholders if needed
    return allVideos.length > 0 
      ? allVideos.slice(0, 5)
      : Array(5).fill(createPlaceholderVideo());
  } catch (error) {
    console.error('Error in GetListByKeyword:', error);
    return Array(5).fill(createPlaceholderVideo());
  }
};

export const formatDuration = (durationText: string): string => {
  if (!durationText) return "0";
  const parts = durationText.split(':').map(Number);
  if (parts.length === 2) {
    return (parts[0] + parts[1] / 60).toFixed(2);
  } else if (parts.length === 3) {
    return (parts[0] * 60 + parts[1] + parts[2] / 60).toFixed(2);
  }
  return "0";
};

export const createPlaceholderVideo = (): VideoItem => ({
  videoId: '',
  videoUrl: '',
  title: 'No relevant video found',
  description: 'Please try regenerating the course or selecting a different topic.',
  length: 0,
  thumbnailUrl: 'https://placehold.co/120x90/lightgray/darkgray.png?text=No+Video'
});

export const GetYoutubeInitData = async (url: string) => {
  try {
    const page = await axios.get(encodeURI(url));
    const ytInitData = page.data.split("var ytInitialData =");
    if (ytInitData && ytInitData.length > 1) {
      const data = ytInitData[1].split("</script>")[0].slice(0, -1);
      const apiToken = page.data
        .split("innertubeApiKey")[1]
        .trim()
        .split(",")[0]
        .split('"')[2];
      const context = JSON.parse(
        page.data.split("INNERTUBE_CONTEXT")[1].trim().slice(2, -2)
      );
      const initdata = JSON.parse(data);
      return { initdata, apiToken, context };
    } else {
      throw new Error("cannot_get_init_data");
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

export const GetVideoDetails = async (videoId: string) => {
  const endpoint = `${youtubeEndpoint}/watch?v=${videoId}`;
  try {
    const page = await GetYoutubeInitData(endpoint);
    const playerData = await GetYoutubePlayerDetail(endpoint);

    const result = page.initdata.contents.twoColumnWatchNextResults;
    const firstContent = result.results.results.contents[0].videoPrimaryInfoRenderer;
    
    return {
      id: playerData.videoId,
      title: firstContent.title.runs[0].text,
      description: playerData.shortDescription,
      length: firstContent.viewCount.videoViewCountRenderer.hasOwnProperty("isLive")
        ? "Live"
        : playerData.lengthSeconds
    };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetYoutubePlayerDetail = async (url: string) => {
  try {
    const page = await axios.get(encodeURI(url));
    const ytInitData = page.data.split("var ytInitialPlayerResponse =");
    if (ytInitData && ytInitData.length > 1) {
      const data = ytInitData[1].split("</script>")[0].slice(0, -1);
      const initdata = JSON.parse(data);
      return { ...initdata.videoDetails };
    } else {
      throw new Error("cannot_get_player_data");
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

async function findVideosWithFallback(
  keyword: string,
  moduleTitle: string,
  moduleIndex: number,
  usedVideoIds: Set<string>
): Promise<VideoItem[]> {
  const searchStrategies = [
    // Strategy 1: Exact search
    [`${keyword} ${moduleTitle}`],
    
    // Strategy 2: Broader module-based search
    [
      `${keyword} ${moduleTitle} tutorial`,
      `${keyword} ${moduleTitle} guide`,
      `learn ${keyword} ${moduleTitle}`
    ],
    
    // Strategy 3: Topic-focused search
    moduleTitle.split(' ')
      .filter(term => term.length > 3)
      .filter(term => !['the', 'and', 'for', 'with'].includes(term.toLowerCase()))
      .map(term => `${keyword} ${term} tutorial`),
    
    // Strategy 4: Difficulty-based search
    [
      `${keyword} ${moduleIndex < 3 ? 'beginner' : moduleIndex > 6 ? 'advanced' : 'intermediate'} tutorial`,
      `${keyword} ${moduleIndex < 3 ? 'basic' : moduleIndex > 6 ? 'expert' : 'practice'} guide`
    ],
    
    // Strategy 5: Very broad topic search (last resort)
    [`${keyword} programming tutorial`, `${keyword} course`, `${keyword} learn`]
  ];

  let allVideos: VideoItem[] = [];

  for (const queries of searchStrategies) {
    if (allVideos.length >= 5) break;

    const videos = await searchWithStrategy(
      queries,
      keyword,
      moduleTitle,
      moduleIndex,
      usedVideoIds
    );

    // Filter out duplicates and add new videos
    for (const video of videos) {
      if (allVideos.length >= 5) break;
      if (!allVideos.some(v => v.videoId === video.videoId) && !usedVideoIds.has(video.videoId)) {
        allVideos.push(video);
        usedVideoIds.add(video.videoId);
      }
    }

    // Add delay between strategies to avoid rate limiting
    await delay(1000);
  }

  // If we still don't have enough videos, try one final broad search
  if (allVideos.length < 5) {
    console.log('Using final fallback search...');
    const finalVideos = await searchWithStrategy(
      [`${keyword} tutorial`],
      keyword,
      moduleTitle,
      moduleIndex,
      usedVideoIds
    );
    
    finalVideos.forEach(video => {
      if (!allVideos.some(v => v.videoId === video.videoId)) {
        allVideos.push(video);
      }
    });
  }

  return allVideos.slice(0, 5);
}

function generateAlternativeQueries(keyword: string, moduleTitle: string, moduleIndex: number): string[] {
  const synonyms = {
    'beginner': ['basic', 'start', 'introduction', 'fundamental'],
    'intermediate': ['medium', 'improve', 'practice'],
    'advanced': ['expert', 'master', 'professional']
  };

  const level = moduleIndex < 3 ? 'beginner' : moduleIndex > 6 ? 'advanced' : 'intermediate';
  const levelTerms = synonyms[level as keyof typeof synonyms];

  return levelTerms.map(term => `${keyword} ${term} tutorial`);
}

async function searchWithStrategy(
  searchQueries: string[],
  keyword: string,
  moduleTitle: string,
  moduleIndex: number,
  usedVideoIds: Set<string>
): Promise<VideoItem[]> {
  let allVideos: VideoItem[] = [];
  const maxRetries = 2;

  for (const query of searchQueries) {
    if (allVideos.length >= 5) break;

    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        const endpoint = `${youtubeEndpoint}/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
        const response = await axios.get(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 5000 // 5 second timeout
        });

        const ytInitialData = response.data.split('var ytInitialData = ')[1];
        if (!ytInitialData) {
          if (retry === maxRetries) continue;
          await delay(1000);
          continue;
        }

        const dataString = ytInitialData.split('</script>')[0].slice(0, -1);
        const data = JSON.parse(dataString);
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents;

        if (!contents) continue;

        for (const content of contents) {
          if (allVideos.length >= 5) break;
          if (!content.itemSectionRenderer?.contents) continue;

          const videos = content.itemSectionRenderer.contents
            .filter(item => item.videoRenderer)
            .map(item => {
              const video = item.videoRenderer;
              const lengthText = video.lengthText?.simpleText;
              const durationInMinutes = parseFloat(formatDuration(lengthText));

              if (durationInMinutes < 3 || durationInMinutes > 20) return null;
              if (usedVideoIds.has(video.videoId)) return null;

              return {
                videoId: video.videoId,
                videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
                title: video.title.runs[0].text,
                description: video.descriptionSnippet?.runs[0]?.text || '',
                length: durationInMinutes,
                thumbnailUrl: video.thumbnail.thumbnails[0].url
              };
            })
            .filter(Boolean);

          for (const video of videos) {
            if (allVideos.length >= 5) break;
            const relevanceScore = calculateVideoRelevanceScore(video, keyword, moduleTitle, moduleIndex);
            if (relevanceScore > 0) {
              allVideos.push(video);
              usedVideoIds.add(video.videoId);
            }
          }
        }

        break; // Break retry loop if successful
      } catch (error) {
        console.error(`Error in searchWithStrategy (attempt ${retry + 1}):`, error);
        if (retry === maxRetries) continue;
        await delay(1000);
      }
    }
  }

  return allVideos;
}

function extractYouTubeData(html: string) {
  try {
    const ytInitialData = html.split('var ytInitialData = ')[1];
    if (!ytInitialData) return null;

    const dataString = ytInitialData.split('</script>')[0].slice(0, -1);
    return JSON.parse(dataString);
  } catch (error) {
    console.error('Error extracting YouTube data:', error);
    return null;
  }
}

export async function getVideoMetadata(videoId: string): Promise<{
  title: string;
  duration: number;
} | null> {
  try {
    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    
    // Extract title
    const titleMatch = html.match(/"title":"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'Untitled Video';

    // Extract duration
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : 0;
    const durationMinutes = durationSeconds / 60;

    return {
      title,
      duration: parseFloat(durationMinutes.toFixed(2))
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
}

async function extractVideoMetadata(videoUrl: string): Promise<VideoItem> {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
    const html = response.data;

    // Extract title
    const titleMatch = html.match(/"title":"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'Unknown Title';

    // Extract duration
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : 0;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const formattedDuration = `${minutes}.${seconds.toString().padStart(2, '0')}`;

    // Extract thumbnail
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      description: '',
      length: parseFloat(formattedDuration),
      thumbnailUrl
    };
  } catch (error) {
    console.error('Error extracting video metadata:', error);
    throw error;
  }
}

function isEnglishVideo(video: VideoItem): boolean {
  // Check title and description for common non-English indicators
  const text = `${video.title} ${video.description}`.toLowerCase();
  
  // Common non-English language indicators in titles
  const nonEnglishIndicators = [
    '[한국어]', '[日本語]', '[中文]', '[español]', '[français]', '[deutsch]',
    '(한국어)', '(日本語)', '(中文)', '(español)', '(français)', '(deutsch)',
    'subtitles', 'субтитр', 'مترجم', '字幕'
  ];

  // Check for non-English indicators
  if (nonEnglishIndicators.some(indicator => text.includes(indicator))) {
    return false;
  }

  // Check if title uses primarily Latin characters
  const latinCharRegex = /^[\x00-\x7F\s]*$/;
  const nonLatinCharPercentage = video.title
    .split('')
    .filter(char => !latinCharRegex.test(char)).length / video.title.length;

  // If more than 15% of characters are non-Latin, likely not English
  return nonLatinCharPercentage < 0.15;
}