<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { bookmarkCourse, enrollInCourse, getEnrollmentStatus, isBookmarked as checkBookmarkStatus } from '$lib/firebase';
  import { Bookmark, BookmarkCheck, GraduationCap } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let courseId: string;
  export let isBookmarked = false;
  export let isEnrolled = false;

  onMount(async () => {
    if ($user) {
      try {
        isBookmarked = await checkBookmarkStatus($user.uid, courseId);
        isEnrolled = await getEnrollmentStatus($user.uid, courseId);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    }
  });

  async function toggleBookmark() {
    if (!$user) {
      goto('/login');
      return;
    }
    
    try {
      const result = await bookmarkCourse($user.uid, courseId);
      isBookmarked = result.bookmarked;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  }

  async function handleEnroll() {
    if (!$user) {
      goto('/login');
      return;
    }
    
    try {
      await enrollInCourse($user.uid, courseId);
      isEnrolled = true;
      goto(`/course/${courseId}`);
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  }
</script>

<div class="flex gap-2">
  <button
    class="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
    on:click={toggleBookmark}
  >
    {#if isBookmarked}
      <BookmarkCheck class="w-5 h-5 text-blue-600" />
      <span>Bookmarked</span>
    {:else}
      <Bookmark class="w-5 h-5" />
      <span>Make Bookmark</span>
    {/if}
  </button>

  {#if !isEnrolled}
    <button
      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
      on:click={handleEnroll}
    >
      <GraduationCap class="w-5 h-5" />
      <span>Enroll Now</span>
    </button>
  {:else}
    <button
      class="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white"
      on:click={() => goto(`/course/${courseId}`)}
    >
      <GraduationCap class="w-5 h-5" />
      <span>Continue Learning</span>
    </button>
  {/if}
</div>
