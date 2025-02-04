<script lang="ts">
  import { goto } from '$app/navigation';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { Eye } from 'lucide-svelte';
  import { user } from '$lib/stores/auth';
  import { likeCourse } from '$lib/firebase';

  export let course: FinalCourseStructure & { id: string };
  export let onShare: (courseId: string) => void;

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
        await likeCourse(courseId, $user.uid);
      } catch (error) {
        console.error('Error updating like:', error);
      }
    } else {
      goto('/login');
    }
  }
</script>

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
          onShare(course.id);
        }}
      >
        <img src="/icons/share-icon.svg" alt="Share" class="w-6 h-6" />
      </button>
    </div>

    <div class="self-stretch h-52 p-4 flex-col justify-start items-start gap-4 flex bg-transparent">
      <div class="self-stretch h-[123px] flex-col justify-start items-start gap-2 flex">
        <div class="self-stretch h-[100px] flex-col justify-start items-start gap-2 flex">
          <h3 class="self-stretch h-[55px] text-black dark:text-white text-body-semibold lg:text-h4-medium line-clamp-2">{course.Final_Course_Title}</h3>
          <p class="self-stretch text-[#a2a2a2] text-semi-body line-clamp-2">{course.Final_Course_Objective}</p>
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