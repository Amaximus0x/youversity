<script lang="ts">
  import { onMount } from 'svelte';
  import TrendingCard from '$lib/components/TrendingCard.svelte';
  import { getBookmarkedCourses, toggleBookmark } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let bookmarkedCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = true;
  let sortBy = 'newest';

  onMount(async () => {
    if (!$user) {
      goto('/login');
      return;
    }
    await fetchBookmarkedCourses();
  });

  async function fetchBookmarkedCourses() {
    try {
      loading = true;
      bookmarkedCourses = await getBookmarkedCourses($user?.uid || '');
    } catch (error) {
      console.error('Error fetching bookmarked courses:', error);
    } finally {
      loading = false;
    }
  }

  async function handleShare(courseId: string) {
    const url = `${window.location.origin}/course/${courseId}`;
    try {
      await navigator.share({
        title: 'Share Course',
        url
      });
    } catch (error) {
      console.error('Error sharing course:', error);
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  }

  async function handleRemoveBookmark(courseId: string) {
    try {
      if (!$user) return;
      // Immediately update local state
      bookmarkedCourses = bookmarkedCourses.filter(course => course.id !== courseId);
      
      // Update backend in the background
      await toggleBookmark($user.uid, courseId);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      // If backend update fails, revert the local state
      await fetchBookmarkedCourses();
    }
  }

  function sortCourses(courses: (FinalCourseStructure & { id: string })[]) {
    return [...courses].sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return sortBy === 'newest' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });
  }

  $: sortedCourses = sortCourses(bookmarkedCourses);
</script>

<div class="min-h-screen">
  <!-- Header -->
  <div class="w-full pt-2 pb-2">
    <div class="container mx-auto">
      <div class="flex justify-between items-center">
        <div class="flex flex-col gap-2">
          <h1 class="text-h2-mobile md:text-h2 text-light-text-primary dark:text-dark-text-primary">
            Bookmarks
          </h1>
          <p class="text-semi-body md:text-body text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
            Access all saved courses
          </p>
        </div>
        
        <!-- Sort Dropdown -->
        <div class="relative">
          <button 
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary"
          >
            <span class="text-semi-body">Sort by</span>
            <select
              bind:value={sortBy}
              class="bg-transparent outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="container mx-auto py-6">
    {#if loading}
      <div class="flex justify-center items-center min-h-[200px]">
        <span class="text-light-text-secondary dark:text-dark-text-secondary">Loading...</span>
      </div>
    {:else if sortedCourses.length === 0}
      <div class="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <p class="text-light-text-secondary dark:text-dark-text-secondary text-body">
          No bookmarked courses yet
        </p>
        <a
          href="/trending"
          class="px-4 py-2 bg-Green hover:bg-GreenHover text-white rounded-lg transition-colors"
        >
          Explore Courses
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each sortedCourses as course (course.id)}
          <TrendingCard
            {course}
            onShare={handleShare}
            isShowBookmarkButton={true}
            on:removeBookmark={() => handleRemoveBookmark(course.id)}
          />
        {/each}
      </div>
    {/if}
  </div>
</div> 