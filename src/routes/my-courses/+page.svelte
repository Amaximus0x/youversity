<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { getUserCourses, getEnrollmentProgress } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import CourseCard from '$lib/components/CourseCard.svelte';

  let allCourses: (FinalCourseStructure & { id: string; progress?: number })[] = [];
  let enrolledCourses: (FinalCourseStructure & { id: string; progress?: number })[] = [];
  let createdCourses: (FinalCourseStructure & { id: string; progress?: number })[] = [];
  let loading = true;
  let activeTab: 'all' | 'enrolled' | 'created' = 'all';
  let sortBy = '';

  onMount(async () => {
    if ($user) {
      await loadCourses();
    }
  });

  async function loadCourses() {
    try {
      loading = true;
      const courses = await getUserCourses($user!.uid);
      
      // Load progress for each course
      const coursesWithProgress = await Promise.all(courses.map(async (course) => {
        const enrollmentProgress = await getEnrollmentProgress($user!.uid, course.id);
        let progress;
        
        if (enrollmentProgress?.completedModules) {
          progress = Math.round(
            (enrollmentProgress.completedModules.length / course.Final_Module_Title.length) * 100
          );
        }
        
        return {
          ...course,
          progress
        };
      }));

      // Separate courses into enrolled and created
      enrolledCourses = coursesWithProgress.filter(course => course.authorId !== $user!.uid);
      createdCourses = coursesWithProgress.filter(course => course.authorId === $user!.uid);
      allCourses = coursesWithProgress;
      
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      loading = false;
    }
  }

  $: displayedCourses = activeTab === 'all' 
    ? allCourses 
    : activeTab === 'enrolled' 
      ? enrolledCourses 
      : createdCourses;

  $: courseCount = {
    all: allCourses.length,
    enrolled: enrolledCourses.length,
    created: createdCourses.length
  };
</script>

<div class="min-h-screen">
  <!-- Header Section -->
  <div class="mb-8">
    <h1 class="text-2xl lg:text-h1 text-light-text-primary dark:text-dark-text-primary mb-4">
      My Courses
    </h1>
    <p class="text-light-text-secondary dark:text-dark-text-secondary text-semibody lg:text-h4">
      Access all your enrolled and created courses. Stay on top of your learning, monitor your progress, and keep everything organized in one place!
    </p>
  </div>

  <!-- Tabs and Sort Section -->
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
    <!-- Tabs -->
    <div class="flex gap-8 mb-6 lg:mb-0 border-b border-light-border dark:border-dark-border">
      <button 
        class="pb-4 {activeTab === 'all' 
          ? 'text-light-text-primary dark:text-dark-text-primary border-b-2 border-brand-red font-medium' 
          : 'text-light-text-secondary dark:text-dark-text-secondary'}"
        on:click={() => activeTab = 'all'}
      >
        All <span class="ml-2 px-2 py-0.5 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-full text-sm">
          {courseCount.all}
        </span>
      </button>
      <button 
        class="pb-4 {activeTab === 'enrolled' 
          ? 'text-light-text-primary dark:text-dark-text-primary border-b-2 border-brand-red font-medium' 
          : 'text-light-text-secondary dark:text-dark-text-secondary'}"
        on:click={() => activeTab = 'enrolled'}
      >
        Enrolled <span class="ml-2 px-2 py-0.5 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-full text-sm">
          {courseCount.enrolled}
        </span>
      </button>
      <button 
        class="pb-4 {activeTab === 'created' 
          ? 'text-light-text-primary dark:text-dark-text-primary border-b-2 border-brand-red font-medium' 
          : 'text-light-text-secondary dark:text-dark-text-secondary'}"
        on:click={() => activeTab = 'created'}
      >
        Created <span class="ml-2 px-2 py-0.5 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-full text-sm">
          {courseCount.created}
        </span>
      </button>
    </div>

    <!-- Sort Dropdown -->
    <div class="relative">
      <button 
        class="flex items-center gap-2 px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-bg-primary dark:bg-dark-bg-primary"
      >
        <img src="/icons/sort-icon.svg" alt="Sort" class="w-5 h-5" />
        <span class="text-light-text-primary dark:text-dark-text-primary">Sort by</span>
        <img src="/icons/chevron-down.svg" alt="Expand" class="w-5 h-5" />
      </button>
    </div>
  </div>

  <!-- Course Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#if loading}
      {#each Array(6) as _}
        <div class="bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-2xl h-[359px] animate-pulse" />
      {/each}
    {:else if displayedCourses.length === 0}
      <div class="col-span-full text-center py-12">
        <p class="text-light-text-secondary dark:text-dark-text-secondary text-lg">
          No courses found in this category.
        </p>
      </div>
    {:else}
      {#each displayedCourses as course (course.id)}
        <CourseCard {course} showProgress={true} />
      {/each}
    {/if}
  </div>

  <!-- Create Course Button (Mobile) -->
  <button 
    class="fixed right-6 bottom-24 lg:hidden w-14 h-14 bg-brand-red rounded-full flex items-center justify-center shadow-lg hover:bg-ButtonHover transition-colors"
  >
    <img src="/icons/plus-white.svg" alt="Create Course" class="w-6 h-6" />
  </button>

  <!-- Create Course Button (Desktop) -->
  <button 
    class="hidden lg:flex fixed right-8 bottom-8 items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors"
  >
    <img src="/icons/plus-white.svg" alt="Create" class="w-5 h-5" />
    <span>Create Course</span>
  </button>
</div>
