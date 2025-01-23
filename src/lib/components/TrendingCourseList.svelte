<script lang="ts">
  import { goto } from '$app/navigation';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { Eye, ArrowUp } from 'lucide-svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import { likeCourse } from '$lib/firebase';
  import { user } from '$lib/stores/auth';
  import Skeleton from './Skeleton.svelte';

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

  async function handelNavigateToCourse(courseId: string) {
    try {
      if ($user) {
        await goto(`/course/${courseId}`);
      } else {
        const returnUrl = `/course/${courseId}`;
        await goto(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
      }
    } catch (error) {
      console.error('Error navigating to course:', error);
    }
  }

  async function handleLike(e: Event, courseId: string) {
    e.preventDefault();
    e.stopPropagation();
    
    if ($user) {
      try {
        const updatedLikeData = await likeCourse(courseId, $user.uid);
        courses = courses.map(c => 
          c.id === courseId 
            ? { ...c, likes: updatedLikeData.likes, likedBy: updatedLikeData.likedBy }
            : c
        );
      } catch (error) {
        console.error('Error updating like:', error);
      }
    } else {
      goto('/login');
    }
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
        <div class="min-w-[325px] max-w-[325px] h-[420px] bg-white/5 backdrop-blur-sm dark:bg-black/5 rounded-2xl overflow-hidden border border-light-border dark:border-dark-border">
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
      <div class="p-2">
        <div 
          class="min-w-[325px] max-w-[325px] h-[420px] bg-white/5 backdrop-blur-sm dark:bg-black/5 rounded-2xl overflow-hidden border border-light-border dark:border-dark-border cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
          on:click={() => handelNavigateToCourse(course.id)}
          on:keydown={(e) => e.key === 'Enter' && handelNavigateToCourse(course.id)}
          role="button"
          tabindex="0"
        >
          <div class="relative h-[156px]">
            {#if course.Final_Course_Thumbnail}
              <img 
                src={course.Final_Course_Thumbnail}
                alt={course.Final_Course_Title}
                class="w-full h-full object-cover"
              />
            {:else}
              <img 
                src="https://placehold.co/280x156/lightgray/darkgray.png" 
                alt={course.Final_Course_Title} 
                class="w-full h-full object-cover" 
              />
            {/if}
            <div class="absolute inset-0 bg-black/30" />
            <button 
              class="absolute top-3 right-3 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-[2px] hover:bg-white/30 transition-colors"
              on:click|stopPropagation={(e) => {
                e.preventDefault();
                handleShare(course.id);
              }}
            >
              <img src="/icons/share-icon.svg" alt="Share" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-4 flex flex-col flex-1">
            <h3 class="font-medium text-base text-black dark:text-white mb-2 line-clamp-2 min-h-[48px]">{course.Final_Course_Title}</h3>
            <p class="text-[#5F6368] text-sm mb-4 line-clamp-2 min-h-[40px]">{course.Final_Course_Description || course.Final_Course_Objective}</p>
            
            <div class="flex items-center justify-between text-sm text-[#5F6368] mb-4">
              <div class="flex items-center gap-2">
                <Eye class="w-4 h-4" />
                <span>{course.views || 0}</span>
              </div>
              <button 
                class="flex items-center gap-2 hover:text-[#EE434A] transition-colors"
                on:click|stopPropagation={(e) => handleLike(e, course.id)}
              >
                <ArrowUp class="w-4 h-4 {course.likedBy?.includes($user?.uid) ? 'text-[#EE434A]' : ''}" />
                <span class="{course.likedBy?.includes($user?.uid) ? 'text-[#EE434A]' : ''}">{course.likes || 0}</span>
              </button>
            </div>

            <div class="flex items-center gap-2 mb-4">
              <span class="text-sm text-[#A3A3A3] flex items-center gap-2">
                <img src="/icons/time-quarter.svg" alt="Duration" class="w-4 h-4" />
                Duration: {#if course?.Final_Course_Duration}
                  {Math.floor((course.Final_Course_Duration) / 60)}h
                {:else}
                  --
                {/if}
              </span>
            </div>
            
            <div class="mt-auto">
              <button 
                class="w-full h-[40px] bg-[#1E3443] hover:bg-[#2A4D61] text-white rounded-lg transition-colors duration-200 text-base font-medium"
                on:click|stopPropagation={() => handelNavigateToCourse(course.id)}
              >
                Start Course
              </button>
            </div>
          </div>
        </div>
      </div>
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