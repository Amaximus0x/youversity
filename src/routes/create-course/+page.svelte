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
  import { getVideoTranscript } from '$lib/services/transcriptUtils';
  import { auth } from '$lib/firebase';
  import { saveCourseToFirebase } from '$lib/firebase';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import CourseGenerationHeader from '$lib/components/CourseGenerationHeader.svelte';
  import CourseGenerationModal from '$lib/components/CourseGenerationModal.svelte';

  let courseObjective = '';
  let courseStructure: CourseStructure | null = null;
  let loading = false;
  let error: string | null = null;
  let moduleVideos: VideoItem[][] = [];
  let selectedVideos: number[] = [];
  let currentModuleIndex = 0;
  let showCustomUrlInput = false;
  let moduleTranscripts: string[] = [];
  let allModulesLoaded = false;

  function checkAllModulesLoaded() {
    if (!courseStructure) return false;
    return moduleVideos.length === courseStructure.OG_Module_Title.length && 
           moduleVideos.every(moduleVideo => moduleVideo && moduleVideo.length > 0);
  }

  function handleCustomVideoAdd(video: VideoItem, moduleIndex: number) {
    if (!moduleVideos[moduleIndex]) {
      moduleVideos[moduleIndex] = [];
    }
    moduleVideos[moduleIndex] = [...moduleVideos[moduleIndex], video];
    moduleVideos = [...moduleVideos];
    allModulesLoaded = checkAllModulesLoaded();
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
      
      // Check if all modules are loaded after this update
      allModulesLoaded = checkAllModulesLoaded();
      
      // Calculate progress: 20% for structure + 80% for modules
      // Each module takes an equal share of the remaining 80%
      const moduleProgress = (moduleIndex + 1) / courseStructure.OG_Module_Title.length;
      const totalProgress = 20 + (moduleProgress * 80);
      loadingState.setProgress(totalProgress);

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
    if (!$user) {
      error = 'Please sign in to save the course';
      return;
    }

    if (!courseStructure) return;
    
    // Start loading with modal
    loadingState.startLoading(courseStructure.OG_Course_Title, false, false);
    loadingState.setProgress(0);
    
    try {
      loading = true;
      error = null;
      moduleTranscripts = [];

      // Fetch transcripts for all selected videos
      for (let i = 0; i < selectedVideos.length; i++) {
        loadingState.setStep(`Fetching transcript for Module ${i + 1}: ${courseStructure.OG_Module_Title[i]}`);
        
        const video = moduleVideos[i][selectedVideos[i]];
        const transcript = await getVideoTranscript(video.videoId);
        moduleTranscripts[i] = transcript;
        
        const progress = ((i + 1) / selectedVideos.length) * 40; // First 40% for transcripts
        loadingState.setProgress(progress);
      }

      loadingState.setStep('Generating course content and quizzes...');
      loadingState.setProgress(60);

      const selectedVideosList = moduleVideos.map((videos, index) => ({
        ...videos[selectedVideos[index]],
        moduleIndex: index,
        moduleTitle: courseStructure?.OG_Module_Title[index]
      }));

      const response = await fetch('/api/create-final-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseStructure,
          selectedVideos: selectedVideosList,
          moduleTranscripts
        })
      });

      loadingState.setProgress(80);
      loadingState.setStep('Processing course content...');

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to create final course');

      // Update course title
      if (courseStructure) {
        loadingState.startLoading(courseStructure.OG_Course_Title, true, false);
      }
      
      loadingState.setStep('Saving your course...');
      loadingState.setProgress(90);
      
      // Save to Firebase
      const courseId = await saveCourseToFirebase($user.uid, {
        ...data.course,
        isPublic: false,
        createdBy: $user.uid,
        createdAt: new Date(),
        views: 0,
        likes: 0
      });

      loadingState.setStep('Course is ready');
      loadingState.setProgress(100);
      
      // Show completion state for a moment before redirecting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Don't clear the state - let user see the completion state
      // The state will be cleared when they click "View Course"
      goto(`/course/${courseId}`);
      
    } catch (err: any) {
      console.error('Error saving course:', err);
      error = err.message;
      loadingState.setError(error);
    } finally {
      loading = false;
    }
  }

  async function handleBuildCourse() {
    loadingState.startLoading('', true, true); // Explicitly set isInitialBuild to true
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
        loadingState.setProgress(20); // Initial course structure generation is exactly 20%
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
      
      // Start loading state for course generation
      loadingState.startLoading('', true, true);
      loadingState.setStep('Analyzing your course objective...');
      
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

    // Cleanup function to clear loading state when component is destroyed
    return () => {
      loadingState.clearState();
    };
  });
</script>

<div class="min-h-screen bg-transparent">
  <div class="container mx-auto">
    <CourseGenerationHeader />
    
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
          <h1 class="text-h2-mobile lg:text-h2 text-Black dark:text-White mb-2">{courseStructure.OG_Course_Title}</h1>
          <p class="text-semi-body lg:text-body text-Black2">{courseStructure.OG_Course_Objective}</p>
        </div>

        <!-- Module Navigation -->
        <div class="flex gap-2 overflow-x-auto  scrollbar-hide">
          {#each courseStructure.OG_Module_Title as title, index}
            <button
              class="px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 {currentModuleIndex === index ? 'text-body-semibold bg-Green text-white' : 'text-body bg-Black/5 text-Green hover:bg-gray-200'}"
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
              <h2 class="text-body-semibold lg:text-h4-medium text-Black dark:text-White">
                Module {currentModuleIndex + 1}: {courseStructure.OG_Module_Title[currentModuleIndex]}
              </h2>
              <button
                class="p-2 text-[#42C1C8] hover:text-[#2A4D61] rounded-full transition-colors duration-200"
                on:click={() => handleRegenerateModuleVideos(currentModuleIndex)}
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.1667 1L15.7646 2.11777C16.1689 2.87346 16.371 3.25131 16.2374 3.41313C16.1037 3.57495 15.6635 3.44426 14.7831 3.18288C13.9029 2.92155 12.9684 2.78095 12 2.78095C6.75329 2.78095 2.5 6.90846 2.5 12C2.5 13.6791 2.96262 15.2535 3.77093 16.6095M8.83333 23L8.23536 21.8822C7.83108 21.1265 7.62894 20.7486 7.7626 20.5868C7.89627 20.425 8.33649 20.5557 9.21689 20.8171C10.0971 21.0784 11.0316 21.219 12 21.219C17.2467 21.219 21.5 17.0915 21.5 12C21.5 10.3208 21.0374 8.74647 20.2291 7.39047"/>
                </svg>
              </button>
            </div>
            <button
              class="bg-brand-red hover:bg-ButtonHover text-mini-body lg:text-semi-body text-white px-2 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
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

      <!-- Generate Complete Course Button -->
      <div 
        class="relative flex justify-left mt-4 mb-10 w-auto h-[54px]"
        in:fly={{ y: 20, duration: 500, delay: 200 }}
        out:fade
      >
        <button
          on:click={handleSaveCourse}
          class="px-4 py-2 rounded-2xl text-base shadow-lg flex items-center justify-center transition-all duration-200 min-w-[250px] gap-2 {!allModulesLoaded || !courseStructure?.OG_Module_Title.every((_, index) => selectedVideos[index] !== undefined) ? 'bg-Black/5 cursor-not-allowed text-Grey' : 'bg-brand-red hover:bg-ButtonHover text-white'}"
          disabled={!allModulesLoaded || !courseStructure?.OG_Module_Title.every((_, index) => selectedVideos[index] !== undefined)}
        >
          <span class="text-body">Generate Complete Course</span>
          <svg 
            class="w-5 h-5 {!allModulesLoaded ? 'fill-Grey' : ''}" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
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

<!-- Keep this for complete course generation -->
<CourseGenerationModal />

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>