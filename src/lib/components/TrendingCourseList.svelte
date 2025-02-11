<script lang="ts">
  import type { FinalCourseStructure } from '$lib/types/course';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import Skeleton from './Skeleton.svelte';
  import TrendingCard from './TrendingCard.svelte';
  
  export let courses: (FinalCourseStructure & { id: string })[] = [];
  export let loading = false;
  export let error: string | null = null;
  let showShareModal = false;
  let selectedCourseId = '';

  function handleShare(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
  }

  function getSkeletonItems(count: number) {
    return Array(count).fill(null);
  }
</script>

<style>
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }

  .scroll-container {
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
  }
</style>

<div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
  {#if loading}
    {#each getSkeletonItems(4) as _}
      <div class="w-full h-[359px]">
        <Skeleton />
      </div>
    {/each}
  {:else if error}
    <div class="col-span-full text-center py-8 text-red-500">{error}</div>
  {:else if courses.length === 0}
    <div class="col-span-full text-center py-8 text-[#1E3443]/80">
      No trending courses available at the moment
    </div>
  {:else}
  <div class="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar scroll-container">
    {#each courses as course (course.id)}
      <div class="scroll-item flex-none w-[325px]">
        <TrendingCard {course} onShare={handleShare} />
      </div>
    {/each}
  </div>
  {/if}
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if} 