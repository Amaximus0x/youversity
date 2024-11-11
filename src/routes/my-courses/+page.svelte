<script lang="ts">
  import { onMount } from 'svelte';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { saveCourseToFirebase, getUserCourses } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { goto } from '$app/navigation';

  let courses: (FinalCourseStructure & { id: string })[] = [];
  let loading = true;
  let error: string | null = null;

  $: if ($isAuthenticated) {
    loadCourses();
  }

  async function loadCourses() {
    try {
      loading = true;
      error = null;
      if (!$user) {
        throw new Error('Please sign in to view your courses');
      }
      courses = await getUserCourses($user.uid);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleCourseClick(courseId: string) {
    goto(`/course/${courseId}`);
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">My Courses</h1>

  {#if loading}
    <div class="text-center py-8">Loading courses...</div>
  {:else if error}
    <div class="text-red-500 text-center py-8">{error}</div>
  {:else if courses.length === 0}
    <div class="text-center py-8">
      <p class="mb-4">You haven't created any courses yet.</p>
      <a
        href="/create-course"
        class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Create Your First Course
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each courses as course}
        <button
          on:click={() => handleCourseClick(course.id)}
          class="text-left border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:scale-102 bg-white"
        >
          <h2 class="text-xl font-semibold mb-2 text-blue-600">{course.Final_Course_Title}</h2>
          <p class="text-gray-600 mb-4">{course.Final_Course_Objective}</p>
          <div class="flex justify-between items-center text-sm text-gray-500">
            <span>{course.Final_Module_Title.length} Modules</span>
            <span class="text-blue-500 hover:text-blue-700">View Course →</span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div> 