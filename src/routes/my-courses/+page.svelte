<script lang="ts">
  import { onMount } from 'svelte';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { getUserCourses } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import CourseFilter from '$lib/components/CourseFilter.svelte';
  import CourseCard from '$lib/components/CourseCard.svelte';

  let courses: (FinalCourseStructure & { id: string })[] = [];
  let filteredCourses = courses;
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
      filteredCourses = courses;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleFilterChange(event: CustomEvent<string>) {
    const filterValue = event.detail;
    let sortedCourses = [...courses];
    
    switch (filterValue) {
      case 'name-asc':
        sortedCourses.sort((a, b) => a.Final_Course_Title.localeCompare(b.Final_Course_Title));
        break;
      case 'name-desc':
        sortedCourses.sort((a, b) => b.Final_Course_Title.localeCompare(a.Final_Course_Title));
        break;
      case 'date-new':
        sortedCourses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-old':
        sortedCourses.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        sortedCourses = [...courses];
    }
    
    filteredCourses = sortedCourses;
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
    <CourseFilter on:filterChange={handleFilterChange} />
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredCourses as course (course.id)}
        <CourseCard {course} />
      {/each}
    </div>
  {/if}
</div> 