<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, fly, scale } from 'svelte/transition';
    import type { CourseStructure, VideoItem } from '$lib/types/course';
    import { ChevronLeft, ChevronRight, CheckCircle2, Plus, Play, X } from 'lucide-svelte';
    import { auth } from '$lib/firebase';
    import { saveCourseToFirebase } from '$lib/firebase';
    import { goto } from '$app/navigation';
    import YoutubeUrlInput from './YoutubeUrlInput.svelte';
    import { user, isAuthenticated } from '$lib/stores/auth';
    import VideoPlayer from './VideoPlayer.svelte';
    import { getVideoTranscript } from '$lib/services/transcriptUtils';
    import { loadingState } from '$lib/stores/loadingState';
    import CourseGenerationProgress from './CourseGenerationProgress.svelte';
    import { browser } from '$app/environment';
  
    export let courseStructure: CourseStructure;
    export let moduleVideos: VideoItem[][];
    export let selectedVideos: number[];
    export let error: string | null;
    export let loading = false;
  
    let sliderRefs: HTMLDivElement[] = [];
    let showLeftArrows: boolean[] = [];
    let showRightArrows: boolean[] = [];
  
    function updateArrows(moduleIndex: number) {
      const slider = sliderRefs[moduleIndex];
      if (slider) {
        const { scrollLeft, scrollWidth, clientWidth } = slider;
        showLeftArrows[moduleIndex] = scrollLeft > 0;
        showRightArrows[moduleIndex] = scrollLeft + clientWidth < scrollWidth;
      }
    }
  
    function scroll(moduleIndex: number, direction: 'left' | 'right') {
      const slider = sliderRefs[moduleIndex];
      if (slider) {
        const scrollAmount = direction === 'left' ? -320 : 320;
        slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  
    onMount(() => {
      sliderRefs = sliderRefs;
      showLeftArrows = new Array(courseStructure.OG_Module_Title.length).fill(false);
      showRightArrows = new Array(courseStructure.OG_Module_Title.length).fill(true);
    });
  
    let saving = false;
    let currentModule = 0;
  
    let usedVideoIds = new Set<string>();
  
    let playingVideoId: string | null = null;
  
    let moduleTranscripts: string[] = [];
  
    let minimized = false;
    let generatedCourseId: string | null = null;
  
    let showVideoPlayer = false;
    let currentPlayingVideo: VideoItem | null = null;
  
    const createPlaceholderVideo = (): VideoItem => ({
      videoId: '',
      videoUrl: '',
      title: 'No relevant video found',
      description: 'Please try regenerating the course or selecting a different topic.',
      length: 0,
      thumbnailUrl: 'https://placehold.co/120x90/lightgray/darkgray.png?text=No+Video'
    });
  
    async function fetchVideosForModule(searchPrompt: string, moduleIndex: number, retryCount = 0) {
      const moduleTitle = courseStructure.OG_Module_Title[moduleIndex];
      loadingState.setCurrentModule(moduleIndex + 1, moduleTitle);
      const maxRetries = 3;
      try {
        if (!searchPrompt?.trim()) {
          throw new Error('Search prompt is required');
        }

        const response = await fetch(
          `/api/search-videos?query=${encodeURIComponent(searchPrompt.trim())}&moduleTitle=${encodeURIComponent(moduleTitle)}&moduleIndex=${moduleIndex}&retry=${retryCount}`,
          {
            headers: {
              'Accept': 'application/json',
              'Cross-Origin-Opener-Policy': 'same-origin'
            }
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch videos');
        }
        const data = await response.json();
        
        const hasRealVideos = data.videos.some(v => v.videoId !== '');
        
        if (!hasRealVideos && retryCount < maxRetries) {
          console.log(`Retrying module ${moduleIndex + 1}, attempt ${retryCount + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
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
        moduleVideos[moduleIndex] = Array(3).fill(createPlaceholderVideo());
        moduleVideos = [...moduleVideos];
        error = `Failed to fetch videos for module ${moduleIndex + 1}: ${err.message}`;
      }
    }
  
    async function handleSaveCourse() {
      loadingState.setMinimized(false);
      loadingState.startLoading(courseStructure.OG_Course_Title, false);
      
      try {
        if (!$user) throw new Error('Please sign in to save the course');
        
        saving = true;
        error = null;

        for (let i = 0; i < selectedVideos.length; i++) {
          loadingState.setCurrentModule(i + 1);
          loadingState.setStep(`Building Module ${i + 1}: ${courseStructure.OG_Module_Title[i]}`);
          
          const video = moduleVideos[i][selectedVideos[i]];
          const transcript = await getVideoTranscript(video.videoId);
          moduleTranscripts[i] = transcript;
          
          const progress = ((i + 1) / selectedVideos.length) * 80; // Leave 20% for final steps
          loadingState.setProgress(progress);
        }

        loadingState.setStep('Generating course content and quizzes...');
        const response = await fetch('/api/create-final-course', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseStructure,
            selectedVideos: selectedVideos.map((index, i) => moduleVideos[i][index]),
            moduleTranscripts
          })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to create final course');

        loadingState.setStep('Saving course...');
        loadingState.setProgress(90);
        
        const courseId = await saveCourseToFirebase($user.uid, data.course);
        
        // Complete the process
        loadingState.stopLoading(courseId);
        
        // Only navigate if the loading state is not minimized and we're still on the same page
        if (browser && !$loadingState.minimized && window.location.pathname === '/create-course') {
          goto(`/course/${courseId}`);
        }

      } catch (err) {
        console.error('Save course error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        error = errorMessage;
        loadingState.setError(errorMessage);
        loadingState.setStep('Error generating course content');
        loadingState.setProgress(0);
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
  
    function handlePlayVideo(video: VideoItem, event: MouseEvent) {
      event.stopPropagation(); // Prevent video selection when clicking play
      currentPlayingVideo = video;
      playingVideoId = video.videoId;
      showVideoPlayer = true;
    }

    function closeVideoPlayer() {
      showVideoPlayer = false;
      currentPlayingVideo = null;
    }

    let showCustomUrlInput: Record<number, boolean> = {};
  
    function handleCustomVideoAdd(video: VideoItem, moduleIndex: number) {
      if (!moduleVideos[moduleIndex]) {
        moduleVideos[moduleIndex] = [];
      }
      moduleVideos[moduleIndex] = [...moduleVideos[moduleIndex], video];
      moduleVideos = [...moduleVideos];
      showCustomUrlInput[moduleIndex] = false; // Hide input after successful add
    }
  
    let isGenerating = false;
  
    async function handleGenerateCourse() {
      const allModulesSelected = courseStructure.OG_Module_Title.every((_, index) => 
        selectedVideos[index] !== undefined
      );
      
      if (!allModulesSelected) {
        alert("Please select a video for each module before generating the course.");
        return;
      }
      
      isGenerating = true;
      try {
        // Your existing course generation logic here
        await generateCourse(); // Replace with your actual generation function
      } catch (error) {
        console.error('Error generating course:', error);
        alert('Failed to generate course. Please try again.');
      } finally {
        isGenerating = false;
      }
    }

    async function generateCourse() {
      const selectedVideosList = moduleVideos.map((videos, index) => {
        const selectedVideo = videos[selectedVideos[index]];
        return {
          videoId: selectedVideo.videoId,
          title: selectedVideo.title,
          description: selectedVideo.description || '',
          length: selectedVideo.length,
          thumbnailUrl: selectedVideo.thumbnailUrl
        };
      });

      try {
        saving = true;
        loadingState.set('Initializing course generation...');
        
        const courseData = {
          title: courseStructure.OG_Course_Title,
          objective: courseStructure.OG_Course_Objective,
          modules: courseStructure.OG_Module_Title.map((title, index) => ({
            title,
            video: selectedVideosList[index]
          }))
        };

        generatedCourseId = await saveCourseToFirebase(courseData);
        
        for (let i = 0; i < selectedVideosList.length; i++) {
          currentModule = i;
          loadingState.set(`Processing module ${i + 1} of ${selectedVideosList.length}...`);
          await getVideoTranscript(selectedVideosList[i].videoId);
        }

        goto(`/course/${generatedCourseId}`);
      } catch (error) {
        console.error('Error generating course:', error);
        alert('Failed to generate course. Please try again.');
      } finally {
        saving = false;
        loadingState.set(null);
      }
    }
</script>
  
<div class="container mx-auto px-4 py-8">
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-[#2A4D61] mb-2">{courseStructure.OG_Course_Title}</h1>
      <p class="text-[#1E3443]/80">{courseStructure.OG_Course_Objective}</p>
    </div>

    {#each courseStructure.OG_Module_Title as moduleTitle, moduleIndex}
      <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-[#2A4D61]">
            Module {moduleIndex + 1}: {moduleTitle}
          </h2>
        </div>

        {#if loading}
          <div class="text-center py-4">Loading videos...</div>
        {:else if !moduleVideos[moduleIndex]?.length}
          <div class="text-center py-4">No videos available for this module.</div>
        {:else}
          <div class="relative">
            {#if showLeftArrows[moduleIndex]}
              <button
                class="absolute -left-3 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-20 hover:bg-white"
                on:click={() => scroll(moduleIndex, 'left')}
              >
                <ChevronLeft class="w-6 h-6 text-[#2A4D61]" />
              </button>
            {/if}

            <div
              bind:this={sliderRefs[moduleIndex]}
              class="flex overflow-x-auto scrollbar-hide space-x-4 pb-4 px-2"
              on:scroll={() => updateArrows(moduleIndex)}
              style="scrollbar-width: none; -ms-overflow-style: none;"
            >
              {#each moduleVideos[moduleIndex] as video, videoIndex}
                <div class="relative flex-shrink-0" style="width: 300px">
                  <div 
                    class="w-full cursor-pointer overflow-hidden rounded-lg transition-all duration-200 transform hover:scale-102 bg-white group
                      {selectedVideos[moduleIndex] === videoIndex ? 'ring-2 ring-[#EE434A] ring-offset-2' : 'hover:border-[#EE434A] border border-gray-200'}"
                    on:click={() => selectedVideos[moduleIndex] = videoIndex}
                    role="button"
                    tabindex="0"
                  >
                    <div class="relative w-full aspect-video">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        class="w-full h-full object-cover rounded-t-lg"
                      />
                      <!-- Play icon hover overlay -->
                      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                        <button
                          class="text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 transform"
                          on:click|stopPropagation={(e) => handlePlayVideo(video, e)}
                        >
                          <Play class="w-12 h-12" />
                        </button>
                      </div>
                      
                      <!-- Selected indicator -->
                      {#if selectedVideos[moduleIndex] === videoIndex}
                        <div class="absolute -top-2 -right-2 bg-[#EE434A] text-white p-1.5 rounded-full shadow-lg z-10">
                          <CheckCircle2 class="w-5 h-5" />
                        </div>
                      {/if}
                    </div>

                    <div class="p-4 bg-white rounded-b-lg">
                      <p class="font-medium text-sm line-clamp-2 mb-1 text-[#2A4D61]">{video.title}</p>
                      <p class="text-xs text-[#1E3443]/60">{video.length} minutes</p>
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            {#if showRightArrows[moduleIndex]}
              <button
                class="absolute -right-3 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-20 hover:bg-white"
                on:click={() => scroll(moduleIndex, 'right')}
              >
                <ChevronRight class="w-6 h-6 text-[#2A4D61]" />
              </button>
            {/if}
          </div>
        {/if}

        <div class="flex gap-2">
          {#if showCustomUrlInput[moduleIndex]}
            <YoutubeUrlInput 
              {moduleIndex} 
              onVideoAdd={handleCustomVideoAdd}
              class="flex-1"
            />
          {:else}
            <button
              class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
              on:click={() => showCustomUrlInput[moduleIndex] = true}
            >
              <Plus class="w-4 h-4 mr-2" />
              Add Custom Video
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    scrollbar-width: none;
  }

  /* Add padding to ensure the selected indicator is fully visible */
  .relative {
    padding-top: 8px;
    padding-right: 8px;
  }

  .sticky {
    position: sticky;
    z-index: 40;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Scale animation for modal */
  :global(.modal-scale) {
    transform-origin: center center;
  }
</style>
  
  <div 
    class="sticky bottom-8 flex justify-center mt-8"
    in:fly={{ y: 20, duration: 500, delay: 200 }}
    out:fade
  >
    <button
      on:click={handleSaveCourse}
      class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-6 py-3 rounded-full text-base shadow-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[250px]"
      disabled={saving || !courseStructure.OG_Module_Title.every((_, index) => selectedVideos[index] !== undefined)}
    >
      {#if saving}
        <div class="flex items-center justify-center space-x-2">
          <svg
            class="animate-spin w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Generating Your Course...</span>
        </div>
      {:else}
        <div class="flex items-center justify-center space-x-2">
          <span>Generate Final Course</span>
          <svg 
            class="w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </div>
      {/if}
    </button>
  </div>

  {#if saving && generatedCourseId}
    <CourseGenerationProgress 
      bind:minimized
      courseId={generatedCourseId}
    />
  {/if}

  {#if showVideoPlayer && currentPlayingVideo}
    <div 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 md:p-6"
      on:click|self={closeVideoPlayer}
      transition:fade={{ duration: 200 }}
    >
      <div 
        class="bg-white rounded-lg w-full h-[90vh] max-w-[90vw] md:max-w-[80vw] lg:max-w-[1200px] relative flex flex-col modal-scale"
        in:scale={{ duration: 300, delay: 200, start: 0.95 }}
        out:scale={{ duration: 200, start: 1 }}
      >
        <button
          class="absolute -top-2 -right-2 bg-white p-1.5 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200 z-10"
          on:click={closeVideoPlayer}
        >
          <X class="w-5 h-5 text-gray-600" />
        </button>
        
        <div class="flex-1 min-h-0 flex flex-col">
          <div class="relative flex-1">
            <VideoPlayer 
              videoId={currentPlayingVideo.videoId} 
              class="absolute inset-0"
            />
          </div>
          <div class="p-4 bg-white border-t">
            <h3 class="text-lg font-semibold text-[#2A4D61] truncate">{currentPlayingVideo.title}</h3>
          </div>
        </div>
      </div>
    </div>
  {/if}