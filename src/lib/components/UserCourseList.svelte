<script lang="ts">
  import { goto } from '$app/navigation';
  import type { FinalCourseStructure } from '$lib/types/course';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import Skeleton from './Skeleton.svelte';

  export let courses: (FinalCourseStructure & { id: string; progress?: number })[] = [];
  export let loading = false;
  export let error: string | null = null;
  let showShareModal = false;
  let selectedCourseId = '';

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
</style>

{#if loading}
  <div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
    {#each Array(getSkeletonCount()) as _}
      <div class="p-2">
        <div class="min-w-[325px] max-w-[325px] max-h-[390px] bg-white/5 backdrop-blur-sm dark:bg-black/5 rounded-2xl overflow-hidden border border-light-border dark:border-dark-border">
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
  <div class="h-[372px] relative rounded-2xl border border-light-border dark:border-dark-border overflow-hidden">
    <div class="w-[406px] h-[200px] left-[56px] top-[86px] absolute flex-col justify-start items-start gap-10 inline-flex">
      <div class="self-stretch">
        <span class="text-light-text-primary dark:text-white text-4xl font-normal font-['Poppins'] leading-[53px]">You haven't </span>
        <span class="text-brand-red text-4xl font-normal font-['Poppins'] leading-[53px]">enrolled</span>
        <span class="text-light-text-primary dark:text-white text-4xl font-normal font-['Poppins'] leading-[53px]"> in a course yet.</span>
      </div>
      <div class="h-[54px] px-4 py-2 bg-brand-red hover:bg-[#D63B42] rounded-2xl justify-center items-center gap-2 inline-flex transition-colors duration-200 cursor-pointer"
           on:click={() => goto('/trending')}
           on:keydown={(e) => e.key === 'Enter' && goto('/trending')}
           role="button"
           tabindex="0"
      >
        <div class="text-white text-base font-normal font-['Poppins'] leading-normal">Explore Course</div>
        <div class="w-6 h-6 relative origin-top-left">
          <img 
            src="/icons/arrow-right-io.svg" 
            alt="arrow" 
            class="w-full h-full" 
          />
        </div>
      </div>
    </div>
    <div class="absolute hidden right-[0px] md:block">
      <img 
        src="/images/Search-engines-pana.svg" 
        alt="No courses" 
        class="w-[870px] h-auto"
      />
    </div>
  </div>
{:else}
  <div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
    {#each courses as course}
      <div class="p-2">
        <div 
          class="w-[325px] h-[372px] bg-transparent rounded-[14px] border border-black/5 flex-col justify-start items-start inline-flex overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
          on:click={() => goto(`/course/${course.id}`)}
          on:keydown={(e) => e.key === 'Enter' && goto(`/course/${course.id}`)}
          role="button"
          tabindex="0"
        >
          <div class="self-stretch px-4 pt-4 pb-[92px] relative overflow-hidden">
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
              class="p-2 bg-black/30 rounded-full justify-start items-center gap-2.5 flex ml-auto relative z-10"
              on:click|stopPropagation={(e) => {
                e.preventDefault();
                selectedCourseId = course.id;
                showShareModal = true;
              }}
            >
              <img src="/icons/share-icon.svg" alt="Share" class="w-6 h-6" />
            </button>
          </div>
          <div class="self-stretch h-56 p-4 flex-col justify-start items-start gap-6 flex">
            <div class="self-stretch h-[131px] flex-col justify-start items-start gap-4 flex">
              <div class="self-stretch h-[95px] flex-col justify-start items-start gap-2 flex">
                <div class="self-stretch h-[55px] text-black dark:text-white text-base font-semibold font-['Poppins'] leading-normal line-clamp-2">{course.Final_Course_Title}</div>
                <div class="self-stretch text-[#a2a2a2] text-sm font-normal font-['Poppins'] leading-snug line-clamp-2">{course.Final_Course_Objective}</div>
              </div>
              {#if typeof course.progress === 'number'}
                <div class="self-stretch justify-start items-center gap-4 inline-flex">
                  <div class="flex-1 h-2 relative bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      class="h-2 absolute left-0 top-[0.50px] bg-[#41c1cb] rounded-full"
                      style="width: {course.progress}%"
                    />
                  </div>
                  <div class="justify-start items-center gap-2 flex">
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
              {/if}
            </div>
            <div class="self-stretch justify-start items-center gap-4 inline-flex">
              <button 
                class="grow shrink basis-0 h-[37px] px-4 py-2 bg-[#eb434a] hover:bg-[#D63B42] rounded-lg justify-center items-center gap-2 flex transition-colors duration-200"
                on:click|stopPropagation={() => goto(`/course/${course.id}`)}
              >
                <div class="text-white text-sm font-medium font-['Poppins']">
                  {typeof course.progress === 'number' ? 'Continue' : 'Start Learning'}
                </div>
              </button>
            </div>
          </div>
        </div>
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