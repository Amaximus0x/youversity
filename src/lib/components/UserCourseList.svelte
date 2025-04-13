<script lang="ts">
  import { goto } from '$app/navigation';
  import type { FinalCourseStructure } from '$lib/types/course';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import Skeleton from './Skeleton.svelte';
  import UserCourseCard from './UserCourseCard.svelte';

  export let courses: (FinalCourseStructure & { id: string; progress?: number })[] = [];
  export let loading = false;
  export let error: string | null = null;
  let showShareModal = false;
  let selectedCourseId = '';

  function handleShare(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
  }

  function getSkeletonCount(): number {
    return 4;
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

{#if loading}
  <div class="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar scroll-container">
    {#each Array(getSkeletonCount()) as _}
      <div class="scroll-item flex-none w-[325px]">
        <div class="w-full h-[390px] bg-white/5 backdrop-blur-sm dark:bg-black/5 rounded-2xl overflow-hidden border border-light-border dark:border-dark-border">
          <div class="relative h-[156px]">
            <Skeleton class="h-full w-full" />
          </div>
          <div class="p-4 flex flex-col min-h-[156px]">
            <Skeleton class="h-[48px] w-full mb-2" />
            <Skeleton class="h-[40px] w-full mb-4" />
            <Skeleton class="h-2 w-full mb-4" />
            <div class="mt-auto">
              <Skeleton class="h-[40px] w-full" />
            </div>
          </div>
        </div>
      </div>
    {/each}
  </div>
{:else if error}
  <div class="col-span-full text-center py-8 text-red-500">{error}</div>
{:else if courses.length === 0}
<!-- No Courses Container -->
<div class="h-[372px] relative rounded-2xl border border-light-border dark:border-dark-border overflow-hidden">
  <!-- Text & button content -->
  <div class="p-4 lg:p-8 relative z-10 max-w-full">
    <div class="self-stretch mb-4 lg:mb-10">
      <h1 class="text-18-28 lg:text-36-53 text-light-text-primary dark:text-dark-text-primary">
        You haven't <span class="text-brand-red">enrolled</span> in <br> a course yet.
      </h1>
    </div>
    <!-- Explore Course Button -->
    <div 
      class="explore-course-btn lg:h-[54px] pl-4 pr-2 py-2 lg:px-4 bg-brand-red hover:bg-[#D63B42] rounded-2xl justify-center items-center gap-2 inline-flex transition-colors duration-200 cursor-pointer"
      on:click={() => goto('/trending')}
      on:keydown={(e) => e.key === 'Enter' && goto('/trending')}
      role="button"
      tabindex="0"
    >
      <div class="text-semi-body lg:text-body text-white">Explore Course</div>
      <div class="w-6 h-6 relative origin-top-left">
        <img src="/icons/arrow-right-white.svg" alt="arrow" class="w-full h-full" />
      </div>
    </div>
  </div>

  <!-- Image Section -->
  <div class="absolute bottom-0 right-0 max-w-[90%] md:max-w-[50%] lg:max-w-[68%] h-auto flex items-end justify-end transform scale-110 origin-bottom-right">
    <img 
      src="/images/Search-engines-pana-sm.svg" 
      alt="No courses" 
      class="w-full h-auto block lg:hidden object-contain"
    />
    <img 
      src="/images/Search-engines-pana.svg" 
      alt="No courses" 
      class="w-full h-auto hidden lg:block object-contain"
    />
  </div>
</div>
{:else}
<div class="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar scroll-container">
  {#each courses as course (course.id)}
    <div class="scroll-item flex-none w-[325px]">
      <UserCourseCard {course} onShare={handleShare} />
    </div>
  {/each}
</div>
{/if}

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if} 