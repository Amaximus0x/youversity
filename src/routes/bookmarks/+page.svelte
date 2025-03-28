<script lang="ts">
  import { onMount } from 'svelte';
  import TrendingCard from '$lib/components/TrendingCard.svelte';
  import { getBookmarkedCourses, toggleBookmark } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let bookmarkedCourses: (FinalCourseStructure & { id: string; bookmarkedAt: Date })[] = [];
  let sortedCourses: (FinalCourseStructure & { id: string; bookmarkedAt: Date })[] = [];
  let loading = true;
  let sortBy = 'newest';
  let authChecked = false;
  let showSortDropdown = false;

  // Subscribe to auth state changes
  user.subscribe(currentUser => {
    if (authChecked && !currentUser) {
      goto('/login');
    }
    if (currentUser && authChecked) {
      fetchBookmarkedCourses();
    }
  });

  // Function to handle sort option selection
  function handleSortSelect(option: 'newest' | 'oldest') {
    sortBy = option;
    showSortDropdown = false;
  }

  // Function to handle click outside of dropdown
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.sort-dropdown')) {
      showSortDropdown = false;
    }
  }

  onMount(() => {
    // Mark auth as checked after initial mount
    authChecked = true;
    
    // If we already have user data, fetch bookmarks
    if ($user) {
      fetchBookmarkedCourses();
    }

    // Add click outside listener
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  async function fetchBookmarkedCourses() {
    if (!$user) return;
    
    try {
      loading = true;
      bookmarkedCourses = await getBookmarkedCourses($user.uid);
      console.log('Fetched bookmarked courses:', bookmarkedCourses);
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

  function sortCourses(courses: (FinalCourseStructure & { id: string; bookmarkedAt: Date })[]) {
    if (!courses?.length) return [];
    
    console.log('Sorting by:', sortBy); // Debug log
    console.log('Before sort:', courses.map(c => ({ id: c.id, date: c.bookmarkedAt }))); // Debug log
    
    const sorted = [...courses].sort((a, b) => {
      const dateA = a.bookmarkedAt instanceof Date ? a.bookmarkedAt : new Date(a.bookmarkedAt);
      const dateB = b.bookmarkedAt instanceof Date ? b.bookmarkedAt : new Date(b.bookmarkedAt);
      
      const result = sortBy === 'newest' 
        ? dateB.getTime() - dateA.getTime()  // Newest first
        : dateA.getTime() - dateB.getTime(); // Oldest first
        
      console.log(`Comparing ${dateA} with ${dateB}, result: ${result}`); // Debug log
      return result;
    });
    
    console.log('After sort:', sorted.map(c => ({ id: c.id, date: c.bookmarkedAt }))); // Debug log
    return sorted;
  }

  // Create two reactive statements to ensure proper updates
  $: {
    console.log('Sort by changed to:', sortBy); // Debug log
    if (bookmarkedCourses.length > 0) {
      sortedCourses = sortCourses(bookmarkedCourses);
    }
  }
</script>

<!-- Only show content when auth is checked -->
{#if !authChecked || loading}
  <div class="flex justify-center items-center min-h-screen">
    <span class="text-light-text-secondary dark:text-dark-text-secondary">Loading...</span>
  </div>
{:else if !$user}
  <div class="flex justify-center items-center min-h-screen">
    <span class="text-light-text-secondary dark:text-dark-text-secondary">Please log in to view bookmarks</span>
  </div>
{:else}
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
          <div class="sort-dropdown relative">
            <button 
              class="h-[42px] px-4 py-2 bg-black/5 dark:bg-white/10 rounded-lg justify-start items-center gap-[17px] inline-flex"
              on:click|stopPropagation={() => showSortDropdown = !showSortDropdown}
            >
              <div class="text-light-text-secondary dark:text-dark-text-secondary">Sort by</div>
              <div data-svg-wrapper class="relative">
                <svg class="text-light-text-primary dark:text-dark-text-primary" width="16" height="27" viewBox="0 0 16 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 10.5C12 10.5 9.05403 6.50001 7.99997 6.5C6.9459 6.49999 4 10.5 4 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 16.5C12 16.5 9.05403 20.5 7.99997 20.5C6.9459 20.5 4 16.5 4 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>

            {#if showSortDropdown}
              <div class="absolute right-0 mt-2 w-48 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-light-border dark:border-dark-border z-50">
                <button
                  class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortBy === 'newest' ? 'bg-black/5 dark:bg-white/10' : ''}"
                  on:click={() => handleSortSelect('newest')}
                >
                  <span>Newest</span>
                  {#if sortBy === 'newest'}
                    <svg class="w-4 h-4 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {/if}
                </button>
                <button
                  class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortBy === 'oldest' ? 'bg-black/5 dark:bg-white/10' : ''}"
                  on:click={() => handleSortSelect('oldest')}
                >
                  <span>Oldest</span>
                  {#if sortBy === 'oldest'}
                    <svg class="w-4 h-4 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {/if}
                </button>
              </div>
            {/if}
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
            class="px-4 py-2 bg-brand-red hover:bg-ButtonHover text-white rounded-lg transition-colors"
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
{/if} 