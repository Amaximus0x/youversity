<script lang="ts">
  import { onMount } from 'svelte';
  import { user, isAuthenticated } from '$lib/stores/auth';
  import { saveCourseToFirebase, getUserCourses } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { goto } from '$app/navigation';
  import CourseFilter from '$lib/components/CourseFilter.svelte';
  import CourseCard from '$lib/components/CourseCard.svelte';

  export let data;
  
  let courses = data.courses;
  let filteredCourses = courses;

  function handleFilterChange(event) {
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
        sortedCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'date-old':
        sortedCourses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        sortedCourses = [...courses];
    }
    
    filteredCourses = sortedCourses;
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6">My Courses</h1>
  
  <CourseFilter on:filterChange={handleFilterChange} />
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each filteredCourses as course (course.id)}
      <CourseCard {course} />
    {/each}
  </div>
</div> 