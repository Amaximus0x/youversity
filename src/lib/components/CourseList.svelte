<script lang="ts">
  import type { FinalCourseStructure } from '$lib/types/course';
  import { Share2, Play, Globe, Lock } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import Skeleton from './Skeleton.svelte';
  import { user } from '$lib/stores/auth';
  import { getEnrollmentProgress } from '$lib/firebase';
  import { onMount } from 'svelte';

  export let courses: (FinalCourseStructure & { id: string })[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let onShare: (courseId: string) => void;
  export let onTogglePrivacy: ((courseId: string, isPublic: boolean) => void) | undefined = undefined;
  export let showPrivacyToggle = true;

  let courseProgress: { [courseId: string]: number } = {};

  // Add reactivity to courses array
  $: if (courses && $user?.uid) {
    loadCourseProgress();
  }

  async function loadCourseProgress() {
    if (!$user?.uid) return;
    
    try {
      // Load progress for all courses
      const progressPromises = courses.map(async (course) => {
        const enrollmentProgress = await getEnrollmentProgress($user.uid, course.id);
        if (enrollmentProgress) {
          const totalModules = course.Final_Module_Title.length;
          const completedModules = enrollmentProgress.completedModules?.length || 0;
          courseProgress[course.id] = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        }
      });
      await Promise.all(progressPromises);
      courseProgress = { ...courseProgress }; // Trigger reactivity
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }

  onMount(() => {
    if ($user?.uid && courses.length > 0) {
      loadCourseProgress();
    }
  });

  function handleCourseClick(courseId: string) {
    goto(`/course/${courseId}`);
  }

  function handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://placehold.co/120x90/lightgray/darkgray.png';
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
                on:error={handleImageError}
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
              {#if showPrivacyToggle && onTogglePrivacy}
                <button
                  class="p-1 hover:bg-[#F5F5F5] rounded-full transition-colors duration-200"
                  on:click|stopPropagation={(e) => {
                    e.preventDefault();
                    onTogglePrivacy(course.id, course.isPublic);
                  }}
                >
                  {#if course.isPublic}
                    <Globe class="w-5 h-5 text-green-600" />
                  {:else}
                    <Lock class="w-5 h-5 text-[#2A4D61]" />
                  {/if}
                </button>
              {/if}
            </div>
            {#if courseProgress[course.id] > 0}
              <div class="w-full h-2 bg-[#D9E1E3] rounded-full mb-2">
                <div 
                  class="h-full bg-[#42C1C8] rounded-full transition-all duration-300" 
                  style="width: {courseProgress[course.id]}%"
                ></div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-[#1E3443]">{courseProgress[course.id]}% complete</span>
                <button 
                  on:click={() => handleCourseClick(course.id)}
                  class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Continue
                </button>
              </div>
            {:else}
              <div class="flex justify-between items-center mt-2">
                <span class="text-sm text-[#1E3443]">Not started</span>
                <button 
                  on:click={() => handleCourseClick(course.id)}
                  class="bg-[#EE434A] hover:bg-[#D93D44] text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Start Learning
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div> 