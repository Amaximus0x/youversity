<script lang="ts">
  import { onMount } from 'svelte';
  import { getPublicCourses } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import CourseCard from '$lib/components/CourseCard.svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';

  let trendingCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = true;
  let error: string | null = null;
  let showShareModal = false;
  let selectedCourseId = '';

  // Sort by views and likes (engagement score)
  $: filteredCourses = [...trendingCourses].sort((a, b) => {
    const scoreA = (a.views || 0) + (a.likes || 0) * 2;
    const scoreB = (b.views || 0) + (b.likes || 0) * 2;
    return scoreB - scoreA;
  });

  function handleShare(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
  }

  onMount(async () => {
    try {
      const courses = await getPublicCourses();
      trendingCourses = courses;
    } catch (err) {
      console.error('Error loading trending courses:', err);
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  });
</script>

<div class="mx-auto">
  <div class="mb-8">
    <!-- Header Section -->
    <div class="flex flex-col gap-2 mb-8 px-5 lg:px-0">
      <h1 class="text-2xl lg:text-h2 font-medium text-light-text-primary dark:text-dark-text-primary">
        Trending
      </h1>
      <p class="text-light-text-secondary dark:text-dark-text-secondary text-semibody lg:text-body">
        Stay in the loop with Trending! Explore the most popular courses and join the buzz around the latest must-learn topics.
      </p>
    </div>
    
    <!-- <div class="h-[1px] bg-light-border dark:bg-dark-border mb-8"></div> -->

    {#if error}
      <div class="text-brand-red text-body mb-4 px-5 lg:px-0">
        {error}
      </div>
    {/if}

    <!-- Course List -->
    {#if loading}
      <div class="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 px-5 lg:px-0 gap-4">
        {#each Array(8) as _}
          <div class="w-[390px] md:w-auto h-[356px] bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse rounded-[14px]"></div>
        {/each}
      </div>
    {:else if filteredCourses.length === 0}
      <div class="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary px-5 lg:px-0">
        No trending courses available at the moment
      </div>
    {:else}
      <div class="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-3 px-5 lg:px-0 gap-4">
        {#each filteredCourses as course (course.id)}
          <CourseCard {course} onShare={handleShare} />
        {/each}
      </div>
    {/if}
  </div>
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if}

<style>
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style> 