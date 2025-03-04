<script lang="ts">
  import { onMount } from 'svelte';
  import { getPublicCourses } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import TrendingCard from '$lib/components/TrendingCard.svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import { user } from '$lib/stores/auth';
  import { get } from 'svelte/store';

  let trendingCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = true;
  let error: string | null = null;
  let showShareModal = false;
  let selectedCourseId = '';
  let initialLoad = true;

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

  async function loadTrendingCourses() {
    try {
      console.log('Loading trending courses...');
      const courses = await getPublicCourses();
      console.log('Loaded trending courses:', courses);
      trendingCourses = courses;
    } catch (err) {
      console.error('Error loading trending courses:', err);
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }

  // Subscribe to auth state changes
  user.subscribe(async (userData) => {
    console.log('Auth state changed in trending page:', { userData });
    if (userData) {
      if (initialLoad || !loading) {
        initialLoad = false;
        await loadTrendingCourses();
      }
    } else {
      // Clear courses when user logs out
      trendingCourses = [];
      if (!initialLoad) {
        // Only clear if this isn't the initial page load
        error = 'Please log in to view trending courses';
      }
    }
  });

  onMount(async () => {
    console.log('Trending page mounted');
    initialLoad = true;
    // Get initial user state
    const userData = get(user);
    if (userData) {
      await loadTrendingCourses();
    } else {
      console.log('No user data on mount, waiting for auth state');
    }
  });
</script>

<div class="container mx-auto ">
  <!-- Header Section -->
  <div class="mb-8">
    <h1 class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary mb-2">
      Trending
    </h1>
    <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body lg:text-body">
      Stay in the loop with Trending! Explore the most popular courses and join the buzz around the latest must-learn topics.
    </p>
  </div>

  {#if error}
    <div class="text-brand-red text-body mb-4">
      {error}
    </div>
  {/if}

  <!-- Course Grid -->
  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each Array(6) as _}
        <div class="w-full h-[344px] bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse rounded-[14px]" />
      {/each}
    </div>
  {:else if filteredCourses.length === 0}
    <div class="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
      No trending courses available at the moment
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 justify-items-center">
      {#each filteredCourses as course (course.id)}
        <TrendingCard {course} onShare={handleShare} />
      {/each}
    </div>
  {/if}
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    shareType="course"
    id={selectedCourseId}
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