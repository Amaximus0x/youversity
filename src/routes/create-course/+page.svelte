<script lang="ts">
  import { onMount } from 'svelte';
  import ModuleVideoGrid from '$lib/components/ModuleVideoGrid.svelte';
  import YoutubeUrlInput from '$lib/components/YoutubeUrlInput.svelte';
  import type { CourseStructure, VideoItem } from '$lib/types/course';
  import { loadingState } from '$lib/stores/loadingState';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Plus } from 'lucide-svelte';
  import { fade, fly } from 'svelte/transition';

  let courseObjective = '';
  let courseStructure: CourseStructure | null = null;
  let loading = false;
  let error: string | null = null;
  let moduleVideos: VideoItem[][] = [];
  let selectedVideos: number[] = [];
  let currentModuleIndex = 0;
  let showCustomUrlInput = false;

  function handleCustomVideoAdd(video: VideoItem, moduleIndex: number) {
    if (!moduleVideos[moduleIndex]) {
      moduleVideos[moduleIndex] = [];
    }
    moduleVideos[moduleIndex] = [...moduleVideos[moduleIndex], video];
    moduleVideos = [...moduleVideos];
    showCustomUrlInput = false;
  }

  async function fetchVideosForModule(searchPrompt: string, moduleIndex: number, retryCount = 0) {
    if (!courseStructure) return;
    
    const moduleTitle = courseStructure.OG_Module_Title[moduleIndex];
    loadingState.setCurrentModule(moduleIndex + 1, moduleTitle);
    loadingState.setStep(`Searching videos for Module ${moduleIndex + 1}: ${moduleTitle}`);
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
      
      // Update the videos for this module
      moduleVideos[moduleIndex] = data.videos;
      moduleVideos = [...moduleVideos]; // Trigger reactivity
      
      const progress = ((moduleIndex + 1) / courseStructure.OG_Module_Title.length) * 100;
      loadingState.setProgress(progress);

      if (moduleIndex === courseStructure.OG_Module_Title.length - 1) {
        loadingState.stopLoading();
      }
    } catch (err: any) {
      console.error(`Error in module ${moduleIndex + 1}:`, err);
      error = err.message;
      loadingState.setError(error);
      loadingState.stopLoading();
    }
  }

  async function handleRegenerateModuleVideos(moduleIndex: number) {
    try {
      error = null;
      const searchPrompt = courseStructure!.OG_Module_YouTube_Search_Prompt[moduleIndex];
      await fetchVideosForModule(searchPrompt, moduleIndex);
    } catch (err: any) {
      console.error(`Error regenerating videos for module ${moduleIndex + 1}:`, err);
      error = `Failed to regenerate videos for module ${moduleIndex + 1}`;
    }
  }

  async function handleSaveCourse() {
    if (!courseStructure) return;
    
    loadingState.startLoading(courseStructure.OG_Course_Title, false);
    loadingState.setStep('Preparing to generate final course...');
    
    try {
      loading = true;
      error = null;

      const selectedVideosList = moduleVideos.map((videos, index) => ({
        ...videos[selectedVideos[index]],
        moduleIndex: index,
        moduleTitle: courseStructure.OG_Module_Title[index]
      }));

      const response = await fetch('/api/create-final-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseStructure,
          selectedVideos: selectedVideosList
        })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create final course');

      goto(`/course/${data.courseId}`);
    } catch (err: any) {
      console.error('Error saving course:', err);
      error = err.message;
      loadingState.setError(error);
    } finally {
      loading = false;
      loadingState.stopLoading();
    }
  }

  async function handleBuildCourse() {
    loadingState.startLoading('', true);
    loadingState.setStep('Analyzing your course objective...');
    error = null;
    moduleVideos = [];
    selectedVideos = [];
    
    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseInput: courseObjective }),
      });

      const data = await response.json();
      console.log('Course structure:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate course');
      }

      courseStructure = data.courseStructure;
      if (courseStructure) {
        // Initialize arrays with the correct length
        moduleVideos = new Array(courseStructure.OG_Module_Title.length).fill([]);
        selectedVideos = new Array(courseStructure.OG_Module_Title.length).fill(0);
        
        loadingState.setTotalModules(courseStructure.OG_Module_Title.length);
        loadingState.setStep('Course structure generated successfully!');
        loadingState.setProgress(20); // Initial course structure generation is 20% of the process
      } else {
        throw new Error('Invalid course structure received');
      }
      
    } catch (err: any) {
      console.error('Error building course:', err);
      error = err.message;
      courseStructure = null;
      loadingState.setError(error);
      loadingState.stopLoading();
    }
  }

  // Get the objective from URL parameters on mount
  onMount(async () => {
    const urlObjective = $page.url.searchParams.get('objective');
    if (urlObjective) {
      courseObjective = decodeURIComponent(urlObjective);
      await handleBuildCourse();
      
      // Fetch videos for all modules
      if (courseStructure) {
        for (let i = 0; i < courseStructure.OG_Module_Title.length; i++) {
          await fetchVideosForModule(courseStructure.OG_Module_YouTube_Search_Prompt[i], i);
        }
      }
    } else {
      goto('/');
    }
  });
</script>

<div class="min-h-screen bg-transparent">
  <div class="container mx-auto px-4 py-8">
    {#if error}
      <div class="max-w-2xl mx-auto text-center">
        <div class="text-red-500 mb-4">{error}</div>
        <a 
          href="/" 
          class="text-blue-600 hover:text-blue-800"
        >
          Return to Home Page
        </a>
      </div>
    {:else if courseStructure}
      <div class="space-y-8">
        <!-- Course Title and Objective -->
        <div>
          <h1 class="text-3xl font-bold text-[#2A4D61] mb-2">{courseStructure.OG_Course_Title}</h1>
          <p class="text-[#1E3443]/80">{courseStructure.OG_Course_Objective}</p>
        </div>

        <!-- Module Navigation -->
        <div class="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {#each courseStructure.OG_Module_Title as title, index}
            <button
              class="px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 {currentModuleIndex === index ? 'bg-[#2A4D61] text-white' : 'bg-gray-100 text-[#2A4D61] hover:bg-gray-200'}"
              on:click={() => currentModuleIndex = index}
            >
              Module {index + 1}
            </button>
          {/each}
        </div>

        <!-- Current Module Content -->
        <div>
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-semibold text-[#2A4D61]">
                Module {currentModuleIndex + 1}: {courseStructure.OG_Module_Title[currentModuleIndex]}
              </h2>
              <button
                class="p-2 text-[#42C1C8] hover:text-[#2A4D61] rounded-full transition-colors duration-200"
                on:click={() => handleRegenerateModuleVideos(currentModuleIndex)}
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <button
              class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-colors duration-200"
              on:click={() => showCustomUrlInput = true}
            >
              Add Custom Video
              <Plus class="w-5 h-5" />
            </button>
          </div>

          {#if showCustomUrlInput}
            <div class="mb-6">
              <YoutubeUrlInput
                moduleIndex={currentModuleIndex}
                onVideoAdd={handleCustomVideoAdd}
                class="w-full"
              />
            </div>
          {/if}

          <ModuleVideoGrid
            {courseStructure}
            bind:moduleVideos
            bind:selectedVideos
            {currentModuleIndex}
            {error}
          />
        </div>
      </div>

      <!-- Generate Course Button -->
      <div 
        class="relative flex justify-left mt-4 mb-10 w-[261px] h-[54px]"
        in:fly={{ y: 20, duration: 500, delay: 200 }}
        out:fade
      >
        <button
          on:click={handleSaveCourse}
          class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-6 py-3 rounded-2xl text-base shadow-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[250px] gap-2"
          disabled={!courseStructure.OG_Module_Title.every((_, index) => selectedVideos[index] !== undefined)}
        >
          Generate Final Course
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    {:else}
      <div class="max-w-2xl mx-auto text-center">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>