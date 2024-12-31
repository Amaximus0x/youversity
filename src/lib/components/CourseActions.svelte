<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { bookmarkCourse, enrollInCourse, getEnrollmentStatus, isBookmarked as checkBookmarkStatus } from '$lib/firebase';
  import { Bookmark, BookmarkCheck, GraduationCap, Loader2 } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let courseId: string;
  export let isBookmarked = false;
  export let isEnrolled = false;
  
  let isLoading = true;

  onMount(async () => {
    if ($user) {
      try {
        const [bookmarkStatus, enrollmentStatus] = await Promise.all([
          checkBookmarkStatus($user.uid, courseId),
          getEnrollmentStatus($user.uid, courseId)
        ]);
        isBookmarked = bookmarkStatus;
        isEnrolled = enrollmentStatus;
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        isLoading = false;
      }
    } else {
      isLoading = false;
    }
  });

  async function toggleBookmark() {
    if (!$user) {
      goto('/login');
      return;
    }
    
    try {
      isLoading = true;
      const result = await bookmarkCourse($user.uid, courseId);
      isBookmarked = result.bookmarked;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      isLoading = false;
    }
  }

  async function handleEnroll() {
    if (!$user) {
      goto('/login');
      return;
    }
    
    try {
      isLoading = true;
      await enrollInCourse($user.uid, courseId);
      isEnrolled = true;
      window.location.reload();
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="flex gap-2">
  <button
    class="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 transition-all duration-200 relative {isLoading ? 'opacity-50' : ''}"
    on:click={toggleBookmark}
    disabled={isLoading}
  >
    {#if isLoading}
      <Loader2 class="w-5 h-5 animate-spin" />
      <span>Loading...</span>
    {:else if isBookmarked}
      <div class="transition-opacity duration-200">
        <BookmarkCheck class="w-5 h-5 text-blue-600" />
        <span>Bookmarked</span>
      </div>
    {:else}
      <div class="transition-opacity duration-200">
        <Bookmark class="w-5 h-5" />
        <span>Make Bookmark</span>
      </div>
    {/if}
  </button>

  {#if !isEnrolled}
    <button
      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      on:click={handleEnroll}
      disabled={isLoading}
    >
      <GraduationCap class="w-5 h-5" />
      <span>Enroll Now</span>
    </button>
  {:else}
    <button
      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
      on:click={() => goto(`/course/${courseId}`)}
      disabled={isLoading}
    >
      <GraduationCap class="w-5 h-5" />
      <span>Continue Learning</span>
    </button>
  {/if}
</div>

<style>
  .transition-all {
    transition: all 0.2s ease-in-out;
  }
  
  button:disabled {
    cursor: not-allowed;
  }
</style>
