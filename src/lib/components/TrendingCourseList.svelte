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
      <div class="p-2">
        <div 
          class="w-[325px] h-[359px] bg-transparent backdrop-blur-sm rounded-[14px] border border-black/5 flex-col justify-start items-start inline-flex overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
          on:click={() => handelNavigateToCourse(course.id)}
          on:keydown={(e) => e.key === 'Enter' && handelNavigateToCourse(course.id)}
          role="button"
          tabindex="0"
        >
          <div class="self-stretch px-4 pt-4 pb-[92px] relative">
            {#if course.Final_Course_Thumbnail}
              <img 
                src={course.Final_Course_Thumbnail}
                alt={course.Final_Course_Title}
                class="absolute inset-0 w-full h-full object-cover"
              />
            {:else}
              <img 
                src="https://placehold.co/280x156/lightgray/darkgray.png" 
                alt={course.Final_Course_Title} 
                class="absolute inset-0 w-full h-full object-cover"
              />
            {/if}
            <div class="absolute inset-0 bg-black/30" />
            <button 
              class="p-2 bg-black/30 rounded-full justify-start items-center gap-2.5 flex ml-auto relative z-10 hover:bg-black/10"
              on:click|stopPropagation={(e) => {
                e.preventDefault();
                handleShare(course.id);
              }}
            >
              <img src="/icons/share-icon.svg" alt="Share" class="w-6 h-6" />
            </button>
          </div>

          <div class="self-stretch h-52 p-4 flex-col justify-start items-start gap-4 flex bg-transparent">
            <div class="self-stretch h-[123px] flex-col justify-start items-start gap-2 flex">
              <div class="self-stretch h-[100px] flex-col justify-start items-start gap-2 flex">
                <h3 class="self-stretch h-[55px] text-black dark:text-white text-xl font-medium font-['Poppins'] leading-7 line-clamp-2">{course.Final_Course_Title}</h3>
                <p class="self-stretch text-[#a2a2a2] text-sm font-normal font-['Poppins'] leading-snug line-clamp-2">{course.Final_Course_Objective}</p>
              </div>
              
              <div class="self-stretch h-5 flex-col justify-start items-start gap-2 flex">
                <div class="self-stretch justify-between items-center inline-flex">
                  <div class="flex items-center gap-2">
                    <Eye class="w-4 h-4 text-[#41c1cb]" />
                    <span class="text-[#494848] text-xs font-normal font-['Poppins'] leading-tight">{course.views || 0}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <img src="/icons/time-quarter.svg" alt="Duration" class="w-4 h-4" />
                    <div>
                      <span class="text-black dark:text-white text-xs font-normal font-['Poppins'] leading-tight">Duration: </span>
                      <span class="text-[#494848] text-xs font-normal font-['Poppins'] leading-tight">
                        {#if course?.Final_Course_Duration}
                          {Math.floor((course.Final_Course_Duration) / 60)}h
                        {:else}
                          --
                        {/if}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              class="self-stretch h-[48px] px-4 bg-[#2a4d61] rounded-lg justify-center items-center gap-2 inline-flex hover:bg-[#1E3443] transition-colors duration-200"
              on:click|stopPropagation={() => handelNavigateToCourse(course.id)}
            >
              <span class="text-white text-sm font-medium font-['Poppins']">View Course</span>
            </button>
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