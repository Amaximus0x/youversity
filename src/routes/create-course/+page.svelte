<script lang="ts">
  import { onMount } from 'svelte';
  import VideoSelector from '$lib/components/VideoSelector.svelte';
  import type { CourseStructure, VideoItem } from '$lib/types/course';
  import { loadingState } from '$lib/stores/loadingState';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let courseObjective = '';
  let courseStructure: CourseStructure | null = null;
  let loading = false;
  let error: string | null = null;
  let moduleVideos: VideoItem[][] = [];
  let selectedVideos: number[] = [];

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
        loadingState.setTotalModules(courseStructure.OG_Module_Title.length);
        loadingState.setStep('Course structure generated successfully!');
        loadingState.setProgress(20); // Initial course structure generation is 20% of the process
        selectedVideos = new Array(courseStructure.OG_Module_Title.length).fill(0);

        // Start video search process
        loadingState.setStep('Initiating video search for all modules...');
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
  onMount(() => {
    const urlObjective = $page.url.searchParams.get('objective');
    if (urlObjective) {
      courseObjective = decodeURIComponent(urlObjective);
      handleBuildCourse();
    } else {
      // Redirect to home page if no objective is provided
      goto('/');
    }
  });
</script>

<div class="min-h-screen bg-gray-50">
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
      <VideoSelector
        {courseStructure}
        bind:moduleVideos
        bind:selectedVideos
        {loading}
        {error}
      />
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