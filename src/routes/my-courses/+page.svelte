<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { getUserCourses, getEnrollmentProgress } from '$lib/firebase';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import type { FinalCourseStructure } from '$lib/types/course';
  import UserCourseCard from '$lib/components/UserCourseCard.svelte';
  import { goto } from '$app/navigation';

  let allCourses: (FinalCourseStructure & { id: string; progress?: number })[] = [];
  let enrolledCourses: (FinalCourseStructure & { id: string; progress?: number })[] = [];
  let createdCourses: (FinalCourseStructure & { id: string; progress?: number })[] = [];
  let loading = true;
  let activeTab: 'all' | 'enrolled' | 'created' = 'all';
  let sortBy = '';
  let showShareModal = false;
  let selectedCourseId = '';

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
      enrolledCourses = coursesWithProgress.filter(
        course => course.isEnrolled
        // course => !course.isCreator && course.isEnrolled
      );
      
      createdCourses = coursesWithProgress.filter(
        course => course.isCreator || course.createdBy === $user!.uid
      );
      
      // All courses combines both enrolled and created
      allCourses = [...enrolledCourses, ...createdCourses];
      
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      loading = false;
    }
  }

  function handleShare(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
  }

  // Reactive statement to determine which courses to display based on active tab
  $: displayedCourses = activeTab === 'all' 
    ? allCourses 
    : activeTab === 'enrolled' 
      ? enrolledCourses 
      : createdCourses;

  // Update course counts reactively
  $: courseCount = {
    all: allCourses.length,
    enrolled: enrolledCourses.length,
    created: createdCourses.length
  };

  // Add this function to handle create course navigation
  async function handleCreateCourse() {
    await goto('/');
    // Wait for navigation to complete and DOM to update
    setTimeout(() => {
      const createCourseInput = document.querySelector('#course-objective-input') as HTMLInputElement;
      const createCourseSection = document.querySelector('#create-course');
      if (createCourseSection) {
        createCourseSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (createCourseInput) {
        createCourseInput.focus();
      }
    }, 100);
  }
</script>

<div class="min-h-screen">
  <!-- Header Section -->
  <div class="mb-8">
    <h1 class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary mb-4">
      My Courses
    </h1>
    <p class="text-light-text-secondary dark:text-dark-text-secondary text-semi-body lg:text-body">

      Access all your enrolled and created courses. Stay on top of your learning, monitor your progress, and keep everything organized in one place!
    </p>
  </div>

  <!-- Tabs and Sort Section -->
  <div class="mb-6">
    <!-- Border container that spans full width -->
    <div class="relative border-b border-light-border dark:border-dark-border">
      <div class="container max-w-auto">
        <!-- Tabs -->
        <div class="flex gap-8">
          <button 
            class="pb-4 relative {activeTab === 'all' 
              ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' 
              : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
            on:click={() => activeTab = 'all'}
          >
            <span class="hidden lg:inline">All Courses</span>

            <span class="lg:hidden">All</span>
            <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
              {courseCount.all}
            </span>
            {#if activeTab === 'all'}
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
            {/if}
          </button>
          <button 
            class="pb-4 relative {activeTab === 'enrolled' 
              ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' 
              : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
            on:click={() => activeTab = 'enrolled'}
          >
            <span class="hidden lg:inline">Enrolled Courses</span>
            <span class="lg:hidden">Enrolled</span>
            <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
              {courseCount.enrolled}
            </span>
            {#if activeTab === 'enrolled'}
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
            {/if}
          </button>
          <button 
            class="pb-4 relative {activeTab === 'created' 
              ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' 
              : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
            on:click={() => activeTab = 'created'}
          >
            <span class="hidden lg:inline">Created Courses</span>
            <span class="lg:hidden">Created</span>
            <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
              {courseCount.created}
            </span>
            {#if activeTab === 'created'}
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
            {/if}
          </button>
        </div>

        <!-- Sort and Create Course Section - Desktop -->
        <div class="hidden lg:flex items-center gap-4 absolute right-0 top-[-8px]   h-full ">
          <!-- Sort Dropdown -->
          <button 

            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-Black/5 dark:bg-dark-bg-primary"
          >
            <!-- <img src="/icons/sort-icon.svg" alt="Sort" class="w-5 h-5" /> -->
            <span class="text-semibody-medium text-Black2 dark:text-dark-text-primary">Sort by</span>
            <!-- <img src="/icons/chevron-down.svg" alt="Expand" class="w-5 h-5" /> -->
          </button>

          <!-- Create Course Button -->
          <button 
            class="flex items-center gap-2 px-2 pl-4 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors"
            on:click={handleCreateCourse}
          >
            <span class="text-body">Create Course</span>
            <img src="/icons/plus-sign.svg" alt="Create" class="w-6 h-6" />
          </button>
        </div>

      </div>
    </div>

    <!-- Sort and Create Course Section - Mobile -->
    <div class="flex lg:hidden items-center justify-end gap-4 mt-4">
      <!-- Sort Dropdown -->
      <button 

        class="flex items-center gap-2 px-4 py-2  rounded-lg bg-Black/5 dark:bg-dark-bg-primary"
      >
        <!-- <img src="/icons/sort-icon.svg" alt="Sort" class="w-5 h-5" /> -->
        <span class="text-semibody-medium text-Black2 dark:text-dark-text-primary">Sort by</span>
        <!-- <img src="/icons/chevron-down.svg" alt="Expand" class="w-5 h-5" /> -->
      </button>

      <!-- Create Course Button -->
      <button 
        class="flex items-center px-2 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors"
        on:click={handleCreateCourse}
      >
        <img src="/icons/plus-sign.svg" alt="Create" class="w-6 h-6" />
      </button>
    </div>
  </div>

  <!-- Course Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Skeleton Loading -->
    {#if loading}
      {#each Array(6) as _}
        <div class="w-full h-[390px] bg-light-bg-primary dark:bg-dark-bg-primary rounded-[14px] border border-light-border dark:border-dark-border overflow-hidden">
          <!-- Thumbnail Skeleton -->
          <div class="relative w-full h-[148px] bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse">
            <!-- Share Button Skeleton -->
            <div class="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 animate-pulse" />
          </div>

          <!-- Content Section -->
          <div class="p-4 flex flex-col gap-4">
            <!-- Title Skeleton -->
            <div class="h-6 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg w-3/4 animate-pulse" />
            
            <div class="flex flex-col gap-2">
              <!-- Creator Info & Views Skeleton -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse" />
                  <div class="h-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded w-20 animate-pulse" />
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded w-10 animate-pulse" />
                  <div class="w-4 h-4 rounded bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse" />
                </div>
              </div>

              <!-- Date & Duration Skeleton -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse" />
                  <div class="h-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded w-16 animate-pulse" />
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded w-24 animate-pulse" />
                  <div class="w-4 h-4 rounded bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse" />
                </div>
              </div>

              <!-- Progress Bar Skeleton -->
              <div class="w-full h-3 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-full animate-pulse" />
            </div>

            <!-- Button Skeleton -->
            <div class="w-full h-10 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg mt-auto animate-pulse" />
          </div>
        </div>
      {/each}
    {:else if displayedCourses.length === 0}
      <div class="col-span-full text-center py-12">
        <p class="text-light-text-secondary dark:text-dark-text-secondary text-lg">
          No courses found in this category.
        </p>
      </div>
    {:else}
      {#each displayedCourses as course (course.id)}
        <div class="w-full">
          <UserCourseCard {course} onShare={handleShare} />
        </div>
      {/each}
    {/if}
  </div>

</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if} 