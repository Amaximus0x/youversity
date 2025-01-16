<script lang="ts">
  import { goto } from '$app/navigation';
  import type { FinalCourseStructure } from '$lib/types/course';

  export let course: FinalCourseStructure & { 
    id: string;
    createdAt?: string;
    creatorUsername?: string;
    creatorDisplayName?: string;
  };

  function handleCourseClick() {
    goto(`/course/${course.id}`);
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

<button
  on:click={handleCourseClick}
  class="text-left border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:scale-102 bg-white"
>
  {#if course.Final_Module_YouTube_Video_URL?.[0]}
    <img 
      src={getYoutubeThumbnail(course.Final_Module_YouTube_Video_URL[0])}
      alt={course.Final_Course_Title}
      class="w-full h-48 object-cover mb-4 rounded"
      on:error={handleImageError}
    />
  {:else}
    <img 
      src="/images/course-placeholder.png"
      alt={course.Final_Course_Title}
      class="w-full h-48 object-cover mb-4 rounded"
    />
  {/if}
  <h2 class="text-xl font-semibold mb-2 text-blue-600">{course.Final_Course_Title}</h2>
  <p class="text-gray-600 mb-4">{course.Final_Course_Objective}</p>
  <div class="flex justify-between items-center text-sm text-gray-500">
    <div class="flex flex-col gap-1">
      <span>{course.Final_Module_Title.length} Modules</span>
      {#if course.creatorUsername}
        <span class="text-brand-navy">Created by: {course.creatorDisplayName || course.creatorUsername}</span>
      {/if}
    </div>
    <span class="text-blue-500 hover:text-blue-700">View Course →</span>
  </div>
</button>
