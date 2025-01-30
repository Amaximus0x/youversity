<script lang="ts">
  import type { FinalCourseStructure } from '$lib/types/course';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import Skeleton from './Skeleton.svelte';
  import TrendingCard from './TrendingCard.svelte';

  export let courses: (FinalCourseStructure & { id: string })[] = [];
  export let layout: 'grid' | 'horizontal' = 'horizontal';
  export let loading = false;
  export let error: string | null = null;
  let showShareModal = false;
  let selectedCourseId = '';

  function getSkeletonCount(): number {
    return layout === 'horizontal' ? 4 : 8;
  }

  function handleShare(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
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
</style>

<div class="{
  layout === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
    : 'flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar'
}">
  {#if loading}
    {#each Array(getSkeletonCount()) as _}
      <div class="p-2">
        <div class="min-w-[325px] max-w-[325px] h-[356px] bg-white/5 backdrop-blur-sm dark:bg-black/5 rounded-2xl overflow-hidden border border-light-border dark:border-dark-border">
          <div class="relative h-[156px]">
            <Skeleton class="h-full w-full" />
          </div>
          <div class="p-4 flex flex-col flex-1">
            <Skeleton class="h-[48px] w-full mb-2" />
            <Skeleton class="h-[40px] w-full mb-4" />
            <div class="flex items-center justify-between mb-4">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-4 w-20" />
            </div>
            <div class="mt-auto">
              <Skeleton class="h-[40px] w-full" />
            </div>
          </div>
        </div>
      </div>
    {/each}
  {:else if error}
    <div class="col-span-full text-center py-8 text-red-500">{error}</div>
  {:else if courses.length === 0}
    <div class="col-span-full text-center py-8 text-[#1E3443]/80">
      No courses found.
    </div>
  {:else}
    {#each courses as course}
      <TrendingCard {course} onShare={handleShare} />
    {/each}
  {/if}
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if} 