<script lang="ts">
  import { onMount } from 'svelte';
  import CourseGenerator from '$lib/components/CourseGenerator.svelte';
  import VideoSelector from '$lib/components/VideoSelector.svelte';
  import type { CourseStructure, VideoItem } from '$lib/types/course';
  import { loadingState } from '$lib/stores/loadingState';
  import { page } from '$app/stores';

  let courseObjective = '';
  let courseStructure: CourseStructure | null = null;
  let loading = false;
  let error: string | null = null;
  let moduleVideos: VideoItem[][] = [];
  let selectedVideos: number[] = [];

  async function handleBuildCourse() {
    loadingState.startLoading('', true);
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

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate course');
      }

      courseStructure = data.courseStructure;
      loadingState.setTotalModules(courseStructure.OG_Module_Title.length);
      selectedVideos = new Array(courseStructure.OG_Module_Title.length).fill(0);
    } catch (err) {
      console.error('Error building course:', err);
      error = err.message;
      courseStructure = null;
    } finally {
      loadingState.stopLoading();
    }
  }

  // Get the objective from URL parameters on mount
  onMount(() => {
    const urlObjective = $page.url.searchParams.get('objective');
    if (urlObjective) {
      courseObjective = decodeURIComponent(urlObjective);
      // Automatically start course generation if we have an objective
      handleBuildCourse();
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">Create Your Course</h1>

  {#if !courseStructure}
    <CourseGenerator
      bind:courseObjective
      {loading}
      {error}
      onSubmit={handleBuildCourse}
    />
  {:else}
    <VideoSelector
      {courseStructure}
      bind:moduleVideos
      bind:selectedVideos
      {loading}
      {error}
    />
  {/if}
</div>