<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { getUserCourse, updateUserCourse } from '$lib/firebase';

  let courseDetails: FinalCourseStructure | null = null;
  let loading = true;
  let error: string | null = null;
  let playlistUrl: string | null = null;

  const handleCreatePlaylist = () => {
    if (courseDetails) {
      playlistUrl = courseDetails.YouTube_Playlist_URL;
    }
  };

  async function toggleModuleCompletion(index: number) {
    if (!courseDetails || !$user) return;
    
    const updatedModules = [...courseDetails.completed_modules];
    updatedModules[index] = !updatedModules[index];
    
    try {
      await updateUserCourse($user.uid, $page.params.id, {
        completed_modules: updatedModules
      });
      courseDetails.completed_modules = updatedModules;
    } catch (err) {
      console.error('Error updating module completion:', err);
    }
  }

  onMount(async () => {
    try {
      if (!$user) {
        goto('/login');
        return;
      }

      const courseId = $page.params.id;
      if (!courseId) {
        throw new Error('Course ID not found');
      }

      loading = true;
      const course = await getUserCourse($user.uid, courseId);
      
      if (!course) {
        throw new Error('Course not found');
      }

      if (!course.completed_modules) {
        course.completed_modules = new Array(course.Final_Module_Title.length).fill(false);
      }

      courseDetails = course;
    } catch (err) {
      console.error('Error loading course:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-red-50 to-white text-red-900">
  <main class="container mx-auto px-4 py-8 max-w-4xl">
    {#if loading}
      <div class="text-center py-8">Loading course details...</div>
    {:else if error}
      <div class="text-red-500 text-center py-8">{error}</div>
    {:else if courseDetails}
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-red-800 mb-4">{courseDetails.Final_Course_Title}</h1>
        <p class="text-lg text-red-700">{courseDetails.Final_Course_Objective}</p>
      </header>

      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Course Introduction</h2>
        <p class="text-gray-700">{courseDetails.Final_Course_Introduction}</p>
      </div>

      {#each courseDetails.Final_Module_Title as moduleTitle, index}
        <section class="mb-8 bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-semibold mb-4">Module {index + 1}: {moduleTitle}</h3>
          <p class="mb-4 text-gray-600">{courseDetails.Final_Module_Objective[index]}</p>
          
          {#if courseDetails.Final_Module_YouTube_Video_URL[index]}
            <div class="aspect-w-16 aspect-h-9 mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${new URL(courseDetails.Final_Module_YouTube_Video_URL[index]).searchParams.get('v')}?enablejsapi=0&origin=${window.location.origin}`}
                title={moduleTitle}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
                class="w-full h-full rounded"
              ></iframe>
            </div>
          {/if}
        </section>
      {/each}

      <div class="mt-8">
        <h2 class="text-2xl font-semibold mb-4">Course Conclusion</h2>
        <p class="text-gray-700">{courseDetails.Final_Course_Conclusion}</p>
      </div>
    {:else}
      <div class="text-center py-8">No course data available</div>
    {/if}
  </main>
</div> 