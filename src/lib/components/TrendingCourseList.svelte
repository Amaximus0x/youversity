<script lang="ts">
  import type { FinalCourseStructure } from '$lib/types/course';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import Skeleton from './Skeleton.svelte';
  import TrendingCard from './TrendingCard.svelte';

  export let courses: (FinalCourseStructure & { id: string })[] = [];
  export let layout: 'grid' | 'horizontal' = 'horizontal';
  export let loading = false;
  export let error: string | null = null;
  export let showFilters = false;
  let showShareModal = false;
  let selectedCourseId = '';
  let selectedFilter: 'popular' | 'latest' | 'mostViewed' = 'popular';
  let filteredCourses = courses;

  $: {
    filteredCourses = [...courses];
    
    switch (selectedFilter) {
      case 'popular':
        filteredCourses.sort((a, b) => {
          const scoreA = (a.views || 0) + (a.likes || 0) * 2;
          const scoreB = (b.views || 0) + (b.likes || 0) * 2;
          return scoreB - scoreA;
        });
        break;
      case 'latest':
        filteredCourses.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'mostViewed':
        filteredCourses.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
    }
  }

  function getSkeletonCount(): number {
    return layout === 'horizontal' ? 4 : 8;
  }

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
</style>

{#if showFilters}
  <div class="flex gap-4 mb-6">
    <button
      class="px-4 py-2 rounded-lg text-body {selectedFilter === 'popular' ? 'bg-brand-red text-white' : 'bg-light-bg-secondary dark:bg-dark-bg-secondary text-light-text-secondary dark:text-dark-text-secondary'}"
      on:click={() => selectedFilter = 'popular'}
    >
      Most Popular
    </button>
    <button
      class="px-4 py-2 rounded-lg text-body {selectedFilter === 'latest' ? 'bg-brand-red text-white' : 'bg-light-bg-secondary dark:bg-dark-bg-secondary text-light-text-secondary dark:text-dark-text-secondary'}"
      on:click={() => selectedFilter = 'latest'}
    >
      Latest
    </button>
    <button
      class="px-4 py-2 rounded-lg text-body {selectedFilter === 'mostViewed' ? 'bg-brand-red text-white' : 'bg-light-bg-secondary dark:bg-dark-bg-secondary text-light-text-secondary dark:text-dark-text-secondary'}"
      on:click={() => selectedFilter = 'mostViewed'}
    >
      Most Viewed
    </button>
  </div>
{/if}

<div class="{
  layout === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
    : 'flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar'
}">
  {#if loading}
    {#each getSkeletonItems(6) as _}
      <div class="w-full h-[359px]">
        <Skeleton />
      </div>
    {/each}
  {:else if error}
    <div class="col-span-full text-center py-8 text-red-500">{error}</div>
  {:else if filteredCourses.length === 0}
    <div class="col-span-full text-center py-8 text-[#1E3443]/80">
      No trending courses available at the moment
    </div>
  {:else}
    {#each filteredCourses as course (course.id)}
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