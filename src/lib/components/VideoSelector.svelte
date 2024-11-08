<script lang="ts">
    import { onMount } from 'svelte';
    import type { CourseStructure, VideoItem } from '$lib/types/course';
    import { auth } from '$lib/firebase';
    import { saveCourseToFirebase } from '$lib/firebase';
    import { goto } from '$app/navigation';
    import YoutubeUrlInput from './YoutubeUrlInput.svelte';
    import { user, isAuthenticated } from '$lib/stores/auth';
    import VideoPlayer from './VideoPlayer.svelte';
    import { getVideoTranscript } from '$lib/services/transcriptUtils';
  
    export let courseStructure: CourseStructure;
    export let moduleVideos: VideoItem[][];
    export let selectedVideos: number[];
    export let error: string | null;
    export const loading = false;
  
    let saving = false;
    let currentModule = 0;
  
    let usedVideoIds = new Set<string>();
  
    let playingVideoId: string | null = null;
  
    const createPlaceholderVideo = (): VideoItem => ({
      videoId: '',
      videoUrl: '',
      title: 'No relevant video found',
      description: 'Please try regenerating the course or selecting a different topic.',
      length: 0,
      thumbnailUrl: 'https://placehold.co/120x90/lightgray/darkgray.png?text=No+Video'
    });
  
    async function fetchVideosForModule(searchPrompt: string, moduleIndex: number, retryCount = 0) {
      const maxRetries = 3;
      try {
        const moduleTitle = courseStructure.OG_Module_Title[moduleIndex];
        const response = await fetch(
          `/api/search-videos?query=${encodeURIComponent(searchPrompt)}&moduleTitle=${encodeURIComponent(moduleTitle)}&moduleIndex=${moduleIndex}&retry=${retryCount}`,
          {
            headers: {
              'Accept': 'application/json',
              'Cross-Origin-Opener-Policy': 'same-origin'
            }
          }
        );
        
        if (!response.ok) throw new Error('Failed to fetch videos');
        const data = await response.json();
        
        const hasRealVideos = data.videos.some(v => v.videoId !== '');
        
        if (!hasRealVideos && retryCount < maxRetries) {
          console.log(`Retrying module ${moduleIndex + 1}, attempt ${retryCount + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Add delay between retries
          return fetchVideosForModule(searchPrompt, moduleIndex, retryCount + 1);
        }
        
        moduleVideos[moduleIndex] = data.videos;
        if (selectedVideos[moduleIndex] === undefined) {
          selectedVideos[moduleIndex] = 0;
        }
        
        moduleVideos = [...moduleVideos];
        selectedVideos = [...selectedVideos];
      } catch (err) {
        console.error(`Error in module ${moduleIndex + 1}:`, err);
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchVideosForModule(searchPrompt, moduleIndex, retryCount + 1);
        }
        error = `Failed to fetch videos for module ${moduleIndex + 1}`;
      }
    }
  
    async function handleSaveCourse() {
      try {
        if (!$user) {
          throw new Error('Please sign in to save the course');
        }
        saving = true;
        error = null;
        console.log('Starting save process...');
        
        if (selectedVideos.some(v => v === undefined)) {
          throw new Error('Please select a video for each module');
        }

        // Fetch transcripts with better error handling and retries
        console.log('Fetching transcripts...');
        const transcriptPromises = selectedVideos.map(async (index, i) => {
          const video = moduleVideos[i][index];
          try {
            const transcript = await getVideoTranscript(video.videoId);
            console.log(`Successfully fetched transcript for module ${i + 1}`);
            return {
              moduleIndex: i,
              videoId: video.videoId,
              title: video.title,
              transcript
            };
          } catch (error) {
            console.error(`Error fetching transcript for module ${i + 1}:`, error);
            return {
              moduleIndex: i,
              videoId: video.videoId,
              title: video.title,
              transcript: 'Failed to fetch transcript'
            };
          }
        });

        const transcriptResults = await Promise.allSettled(transcriptPromises);

        // Log transcript results
        transcriptResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log(`Module ${index + 1} Transcript:`, {
              videoId: result.value.videoId,
              title: result.value.title,
              transcript: result.value.transcript.substring(0, 100) + '...'
            });
          } else {
            console.error(`Failed to fetch transcript for module ${index + 1}:`, result.reason);
          }
        });
        
        const selectedVideoObjects = selectedVideos.map((index, i) => ({
          title: moduleVideos[i][index].title,
          videoUrl: moduleVideos[i][index].videoUrl,
          thumbnailUrl: moduleVideos[i][index].thumbnailUrl,
          videoId: moduleVideos[i][index].videoId
        }));
        
        console.log('Selected videos:', selectedVideoObjects);
        
        // console.log('Calling create-final-course API...');
        // const response = await fetch('/api/create-final-course', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({
        //     courseStructure,
        //     selectedVideos: selectedVideoObjects
        //   }),
        // });
        
        // if (!response.ok) {
        //   const errorData = await response.json();
        //   throw new Error(errorData.error || 'Failed to create final course');
        // }
        
        // const finalCourse = await response.json();
        // console.log('Final course data:', finalCourse);
        
        // console.log('Saving to Firebase...');
        // const courseId = await saveCourseToFirebase($user.uid, finalCourse);
        // console.log('Course saved with ID:', courseId);
        
        // goto('/my-courses');
      } catch (err) {
        console.error('Save course error:', err);
        error = err instanceof Error ? err.message : 'An unknown error occurred';
      } finally {
        saving = false;
      }
    }
  
    const getLoadingMessage = () => {
        if (!courseStructure) return "Building course structure...";
        if (currentModule > 0 && currentModule <= courseStructure.OG_Module_Title.length) {
            return `Fetching videos for Module ${currentModule}`;
        }
        return "Preparing your final course...";
    };
  
    onMount(async () => {
      try {
        for (let i = 0; i < courseStructure.OG_Module_Title.length; i++) {
          currentModule = i + 1;
          await fetchVideosForModule(courseStructure.OG_Module_YouTube_Search_Prompt[i], i);
        }
        currentModule = 0;
      } catch (err) {
        console.error('Error in onMount:', err);
        error = 'Failed to initialize course videos';
      }
    });
</script>
  
  <div>
    <h2 class="text-2xl font-bold mb-6">{courseStructure.OG_Course_Title}</h2>
    <p class="mb-8">{courseStructure.OG_Course_Objective}</p>
  
    {#each courseStructure.OG_Module_Title as moduleTitle, moduleIndex}
      <div class="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 class="text-xl font-semibold mb-2">
          Module {moduleIndex + 1}: {moduleTitle}
        </h3>
  
        {#if moduleVideos[moduleIndex]}
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {#each moduleVideos[moduleIndex] as video, videoIndex}
              <div class="relative">
                <button
                  class="p-4 border rounded-lg hover:border-blue-500 transition-colors w-full text-left"
                  class:border-blue-500={selectedVideos[moduleIndex] === videoIndex}
                >
                  <div 
                    role="button"
                    tabindex="0"
                    class="relative cursor-pointer"
                    on:click={() => playingVideoId = video.videoId}
                    on:keydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            playingVideoId = video.videoId;
                        }
                    }}
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      class="w-full h-48 object-cover mb-2 rounded"
                    />
                    <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity">
                      <svg class="w-16 h-16 text-white opacity-0 hover:opacity-100" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div 
                    role="button"
                    tabindex="0"
                    class="mt-2"
                    on:click={() => selectedVideos[moduleIndex] = videoIndex}
                    on:keydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            selectedVideos[moduleIndex] = videoIndex;
                        }
                    }}
                  >
                    <h4 class="font-semibold mb-1">{video.title}</h4>
                    <p class="text-sm text-gray-600">{video.length} minutes</p>
                  </div>
                </button>
              </div>
            {/each}
          </div>
          
          {#if playingVideoId}
            <VideoPlayer 
              videoId={playingVideoId} 
              onClose={() => playingVideoId = null}
            />
          {/if}
          
          <YoutubeUrlInput
            {moduleIndex}
            onVideoAdd={(video, index) => {
              moduleVideos[index] = [...moduleVideos[index], video];
              moduleVideos = [...moduleVideos];
            }}
          />
        {:else}
          <div class="text-center py-4">
            {getLoadingMessage()}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <div class="mt-8 flex justify-end">
    <button
      on:click={handleSaveCourse}
      disabled={saving || selectedVideos.some(v => v === undefined)}
      class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
    >
      {saving ? 'Saving...' : 'Save Course'}
    </button>
  </div>