<script lang="ts">
  import { goto } from '$app/navigation';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { Eye } from 'lucide-svelte';
  import { user } from '$lib/stores/auth';

  export let course: FinalCourseStructure & { id: string };
  export let onShare: (courseId: string) => void;

  async function handleNavigateToCourse(courseId: string) {
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

  function getYoutubeThumbnail(url: string) {
    try {
      const videoId = new URL(url).searchParams.get('v');
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } catch {
      return '/images/course-placeholder.png';
    }
  }

  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = '/images/course-placeholder.png';
  }
</script>

<div class="w-full">
  <div 
    class="w-full sm:w-[390px] md:w-full sm:h-[356px] md:h-auto bg-transparent backdrop-blur-sm rounded-[14px] border border-black/5 flex flex-col justify-start items-start cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg overflow-hidden"
    on:click={() => handleNavigateToCourse(course.id)}
    on:keydown={(e) => e.key === 'Enter' && handleNavigateToCourse(course.id)}
    role="button"
    tabindex="0"
  >
    <!-- Image Section -->
    <div class="relative w-full h-[156px]">
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
      
      <!-- Share Button -->
      <button 
        class="absolute top-4 right-4 p-2 bg-black/30 rounded-full justify-start items-center gap-2.5 hover:bg-black/10 z-10"
        on:click|stopPropagation={(e) => {
          e.preventDefault();
          onShare(course.id);
        }}
      >
        <img src="/icons/share-icon.svg" alt="Share" class="w-6 h-6" />
      </button>
    </div>

    <!-- Content Section -->
    <div class="flex-1 w-full p-4 flex flex-col justify-between gap-4">
      <div class="flex-1">
        <!-- Title and Description -->
        <h3 class="text-black dark:text-white text-h4-medium leading-7 line-clamp-2 mb-2">
          {course.Final_Course_Title}
        </h3>
        <p class="text-[#a2a2a2] text-semibody leading-snug line-clamp-2">
          {course.Final_Course_Objective}
        </p>
      </div>

      <!-- Stats Section -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Eye class="w-4 h-4 text-[#41c1cb]" />
          <span class="text-[#494848] text-xs leading-tight">{course.views || 0}</span>
        </div>
        <div class="flex items-center gap-2">
          <img src="/icons/time-quarter.svg" alt="Duration" class="w-4 h-4" />
          <div>
            <span class="text-black dark:text-white text-mini-body leading-tight">Duration: </span>
            <span class="text-[#494848] text-mini-body leading-tight">
              {#if course?.Final_Course_Duration}
                {Math.floor((course.Final_Course_Duration) / 60)}h
              {:else}
                --
              {/if}
            </span>
          </div>
        </div>
      </div>

      <!-- View Course Button -->
      <button 
        class=" px-4 py-2 bg-[#2a4d61] rounded-lg justify-center items-center gap-2 hover:bg-[#1E3443] transition-colors duration-200 w-full"
        on:click|stopPropagation={() => handleNavigateToCourse(course.id)}
      >
        <span class="text-white text-semibody-medium">View Course</span>
      </button>
    </div>
  </div>
</div>
