<script lang="ts">
  import { goto } from '$app/navigation';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { Eye, ArrowUp } from 'lucide-svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import { likeCourse } from '$lib/firebase';
  import { user } from '$lib/stores/auth';

  export let courses: (FinalCourseStructure & { id: string })[] = [];
  export let layout: 'grid' | 'scroll' = 'scroll';
  let showShareModal = false;
  let selectedCourseId = '';

  function handleShare(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
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

<div class="mb-12">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-medium text-[#2A4D61] font-poppins">Trending Courses</h2>
    <a href="/trending" class="text-[#42C1C8] text-sm font-medium hover:underline">Show All</a>
  </div>

  <div class="{
    layout === 'grid' 
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
      : 'flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar'
  }">
    {#each courses as course}
      <div class="bg-white rounded-2xl overflow-hidden {
        layout === 'grid' 
          ? 'w-full'
          : 'min-w-[280px]'
      }">
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
            class="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-[2px]"
            on:click|stopPropagation={(e) => {
              e.preventDefault();
              handleShare(course.id);
            }}
          >
            <img src="/icons/share-icon.svg" alt="Share" class="w-5 h-5" />
          </button>
        </div>
        <div class="p-4 flex flex-col min-h-[156px]">
          <h3 class="font-medium text-base text-black mb-2 line-clamp-2">{course.Final_Course_Title}</h3>
          <p class="text-[#5F6368] text-sm mb-4 line-clamp-2">{course.Final_Course_Description || course.Final_Course_Objective}</p>
          <div class="flex items-center justify-between text-sm text-[#5F6368] mb-4">
            <div class="flex items-center gap-2">
              <Eye class="w-4 h-4" />
              <span>{course.views || 0}</span>
            </div>
            <button 
              class="flex items-center gap-2 hover:text-[#EE434A] transition-colors"
              on:click={(e) => handleLike(e, course.id)}
            >
              <ArrowUp class="w-4 h-4 {course.likedBy?.includes($user?.uid) ? 'text-[#EE434A]' : ''}" />
              <span class="{course.likedBy?.includes($user?.uid) ? 'text-[#EE434A]' : ''}">{course.likes || 0}</span>
            </button>
          </div>
          <div class="mt-auto">
            <button 
              class="w-full py-2 bg-[#1E3443] hover:bg-[#2A4D61] text-white rounded-lg transition-colors duration-200 text-base font-medium"
              on:click={() => goto(`/course/${course.id}`)}
            >
              Start Course
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if}

<style>
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
</style> 