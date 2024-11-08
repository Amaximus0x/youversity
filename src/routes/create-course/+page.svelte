<script lang="ts">
  import { onMount } from 'svelte';
  import CourseGenerator from '$lib/components/CourseGenerator.svelte';
  import VideoSelector from '$lib/components/VideoSelector.svelte';
  import type { CourseStructure, VideoItem } from '$lib/types/course';

  let courseObjective = '';
  let courseStructure: CourseStructure | null = null;
  let loading = false;
  let error: string | null = null;
  let moduleVideos: VideoItem[][] = [];
  let selectedVideos: number[] = [];

  async function handleBuildCourse() {
    loading = true;
    error = null;
    moduleVideos = [];
    selectedVideos = [];
    
    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cross-Origin-Opener-Policy': 'same-origin'
        },
        body: JSON.stringify({ objective: courseObjective }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate course');
      }

      courseStructure = await response.json();
      selectedVideos = new Array(courseStructure.OG_Module_Title.length).fill(0);
    } catch (err) {
      console.error('Error building course:', err);
      error = err.message;
      courseStructure = null;
    } finally {
      loading = false;
    }
  }
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