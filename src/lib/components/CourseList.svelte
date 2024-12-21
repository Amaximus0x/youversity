<script lang="ts">
  import type { FinalCourseStructure } from '$lib/types/course';
  import { Share2, Play, Globe, Lock } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import Skeleton from './Skeleton.svelte';

  export let courses: (FinalCourseStructure & { id: string })[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let onShare: (courseId: string) => void;
  export let onTogglePrivacy: ((courseId: string, isPublic: boolean) => void) | undefined = undefined;
  export let showPrivacyToggle = true;

  function handleCourseClick(courseId: string) {
    goto(`/course/${courseId}`);
  }

  function getSkeletonItems(count: number) {
    return Array(count).fill(null);
  }
</script>

<div>
  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each getSkeletonItems(6) as _}
        <div class="bg-white rounded-lg overflow-hidden shadow-lg">
          <div class="relative">
            <Skeleton height="180px" />
          </div>
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <Skeleton height="24px" width="70%" />
              <Skeleton height="24px" width="24px" borderRadius="50%" />
            </div>
            <div class="w-full h-2 bg-[#D9E1E3] rounded-full mb-2">
              <Skeleton height="8px" borderRadius="9999px" />
            </div>
          </div>
          <div class="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <Skeleton height="20px" width="30%" />
            <Skeleton height="36px" width="100px" borderRadius="8px" />
          </div>
        </div>
      {/each}
    </div>
  {:else if error}
    <div class="text-red-500 text-center py-8">{error}</div>
  {:else if courses.length === 0}
    <div class="text-center py-8">
      <p class="text-[#1E3443]/80">You haven't created any courses yet.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each courses as course}
        <div class="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div class="relative h-[180px]">
            {#if course.Final_Course_Thumbnail}
              <img 
                src={course.Final_Course_Thumbnail}
                alt={course.Final_Course_Title}
                class="w-full h-full object-cover"
                onerror="this.onerror=null; this.src='https://placehold.co/120x90/lightgray/darkgray.png';"
              />
            {:else}
              <img 
                src="https://placehold.co/120x90/lightgray/darkgray.png" 
                alt={course.Final_Course_Title} 
                class="w-full h-full object-cover" 
              />
            {/if}
            <div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
              <Play class="w-12 h-12 text-white" />
            </div>
          </div>
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold text-lg text-[#2A4D61]">{course.Final_Course_Title}</h3>
              <button
                class="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors duration-200"
                on:click|stopPropagation={(e) => {
                  e.preventDefault();
                  onShare(course.id);
                }}
              >
                <Share2 class="w-5 h-5 text-[#2A4D61]" />
              </button>
              <button
                class="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors duration-200"
                on:click|stopPropagation={(e) => {
                  e.preventDefault();
                  onTogglePrivacy(course.id, !course.isPublic);
                }}
              >
                {#if course.isPublic}
                  <Globe class="w-5 h-5 text-green-600" />
                {:else}
                  <Lock class="w-5 h-5 text-[#2A4D61]" />
                {/if}
              </button>
            </div>
            <div class="w-full h-2 bg-[#D9E1E3] rounded-full mb-2">
              <div 
                class="h-full bg-[#42C1C8] rounded-full" 
                style="width: {(course.completed_modules?.filter(m => m?.completed)?.length || 0) / course.Final_Module_Title.length * 100}%"
              ></div>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <span class="text-sm text-[#1E3443]">
              {Math.round((course.completed_modules?.filter(m => m?.completed)?.length || 0) / course.Final_Module_Title.length * 100)}% complete
            </span>
            <button 
              on:click={() => handleCourseClick(course.id)}
              class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Continue
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div> 