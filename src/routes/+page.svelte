<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { signInWithGoogle } from '$lib/services/auth';
  import { page } from '$app/stores';
  import { getUserCourses, getPublicCourses, toggleCoursePrivacy, likeCourse, getEnrollmentProgress } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { 
    ArrowRight, 
    Share2, 
    ThumbsUp, 
    ThumbsDown, 
    Eye,
    Play,
    Plus,
    ArrowUp
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import CourseFilter from '$lib/components/CourseFilter.svelte';
  import { loadingState } from '$lib/stores/loadingState';
  import { onMount } from 'svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import { Copy, X } from 'lucide-svelte';
  import CourseList from '$lib/components/CourseList.svelte';
  import Skeleton from '$lib/components/Skeleton.svelte';
  import TrendingCourseList from '$lib/components/TrendingCourseList.svelte';
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  import CourseCreationOverlay from '$lib/components/CourseCreationOverlay.svelte';
  import UserCourseList from '$lib/components/UserCourseList.svelte';
  import { notifications } from '$lib/stores/notificationStore';
  import { browser } from '$app/environment';

  let learningObjective = '';
  let userCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;
  let filteredCourses: (FinalCourseStructure & { id: string })[] = [];
  let showShareModal = false;
  let selectedCourseId = '';
  let publicCourses: (FinalCourseStructure & { id: string })[] = [];
  let isInputFocused = false;
  let trendingCoursesLoading = true;
  let showLoadingOverlay = false;
  let showCreationOverlay = false;
  let courseObjectiveInput: HTMLInputElement;

  // Function to focus the course objective input
  function focusCourseObjective() {
    if (courseObjectiveInput) {
      courseObjectiveInput.focus();
      // Scroll into view if needed
      courseObjectiveInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Handle focus from URL parameter
  $: if (browser && courseObjectiveInput && $page.url.searchParams.get('focus') === 'courseObjective') {
    focusCourseObjective();
    // Clear the parameter after focusing
    const url = new URL(window.location.href);
    url.searchParams.delete('focus');
    history.replaceState({}, '', url);
  }

  // Update filteredCourses when userCourses changes
  $: {
    if (userCourses) {
      filteredCourses = [...userCourses];
    }
  }

  $: if ($user) {
    loadUserCourses();
  }

  async function loadUserCourses() {
    try {
      loading = true;
      error = null;
      const courses = await getUserCourses($user!.uid);
      
      // Load progress for each course
      const coursesWithProgress = await Promise.all(courses.map(async (course) => {
        const enrollmentProgress = await getEnrollmentProgress($user!.uid, course.id);
        let progress;
        
        if (enrollmentProgress?.completedModules) {
          progress = Math.round((enrollmentProgress.completedModules.length / course.Final_Module_Title.length) * 100);
        }
        
        return {
          ...course,
          progress: progress
        };
      }));

      userCourses = coursesWithProgress;
      filteredCourses = [...userCourses];
    } catch (err) {
      console.error('Error loading courses:', err);
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    

    try {
      console.log('Fetching trending courses...');
      // Get courses sorted by views/likes
      publicCourses = await getPublicCourses();
      // Sort by views and likes
      publicCourses.sort((a, b) => {
        const scoreA = (a.views || 0) + (a.likes || 0);
        const scoreB = (b.views || 0) + (b.likes || 0);
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error('Error loading trending courses:', error);
    } finally {
      trendingCoursesLoading = false;
    }
  });


  async function handleCreateCourse(e: Event) {
    e.preventDefault();
    
    if (!learningObjective.trim()) {
      return; // Don't proceed if learning objective is empty
    }

    try {
      if ($user) {
        // Show creation overlay first
        showCreationOverlay = true;

        // Wait for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Navigate to create-course page
        await goto(`/create-course?objective=${encodeURIComponent(learningObjective)}`);
      } else {
        // For unauthenticated users, redirect to login with return URL
        const returnUrl = `/create-course?objective=${encodeURIComponent(learningObjective)}`;
        await goto(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      showCreationOverlay = false;
    }
  }

  function handleShareCourse(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
  }



  function handleFilterChange(event: { detail: string }) {
    const filterValue = event.detail;
    let sortedCourses = [...userCourses];
    
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
        sortedCourses = [...userCourses];
    }
    
    filteredCourses = sortedCourses;
  }

  onMount(() => {
    return () => {
    };
  });

  // Add this function to generate skeleton items
  function getSkeletonItems(count: number) {
    return Array(count).fill(null);
  }

  async function handleTogglePrivacy(courseId: string, isPublic: boolean) {
    try {
      const updatedCourse = await toggleCoursePrivacy(courseId, isPublic);
      console.log('Updated course:', updatedCourse);
      
      // Update the course in userCourses
      userCourses = userCourses.map(course => 
        course.id === courseId 
          ? { ...course, ...updatedCourse }
          : course
      );
      
      // Refresh public courses list
      const updatedPublicCourses = await getPublicCourses();
      publicCourses = updatedPublicCourses;
      
      // Update filtered courses
      filteredCourses = [...userCourses];
    } catch (error) {
      console.error('Error toggling course privacy:', error);
    }
  }
</script>

<style>
  :global(body) {
    @apply antialiased;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
</style>

<LoadingOverlay show={showLoadingOverlay} />

<CourseCreationOverlay show={showCreationOverlay} />

<div class="mx-auto max-w-auto sm:px-0 lg:pl-0">
  <!-- Create Course Section -->
  <div class="relative overflow-hidden rounded-lg  mb-8 lg:mb-12">  
    <div >
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl lg:text-h1 font-normal text-light-text-primary dark:text-dark-text-primary mb-2">
          Hi {$user?.displayName?.split(' ')[0] || 'there'} 👋 <br> What would you like to <span class="text-brand-red">Learn?</span>
        </h1>
      
      <p class="text-light-text-secondary dark:text-dark-text-secondary text-semibody lg:text-h4 mb-8">
          Enter your learning objectives below we'll help you create a comprehensive course.
        </p>
      </div>

      <form 
        id="create-course"
        on:submit={handleCreateCourse} 
        class="relative flex-1 max-w-auto h-[54px] lg:max-w-[812px]"
      >
        <button
          type="submit"
          class="absolute right-0 z-10 sm:px-4 sm:h-[52px] sm:bg-brand-red sm:text-white sm:rounded-2xl sm:hover:bg-[#D63B42] sm:transition-colors sm:duration-200 sm:flex sm:items-center sm:gap-2 sm:text-base sm:whitespace-nowrap
          max-sm:w-[56px] max-sm:h-[52px] max-sm:rounded-2xl max-sm:bg-brand-red max-sm:flex max-sm:items-center max-sm:justify-center max-sm:p-4 max-sm:gap-2"
        >
          <span class="hidden lg:block">Create Course</span>
          <img 
            src="/icons/arrow-right-white.svg" 
            alt="Create"
            class="w-5 h-5" 
          />
        </button>
        <div class="relative w-full">
          <div 
            class="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ease-in-out {
              isInputFocused ? 'opacity-0 translate-x-[0px]' : 'opacity-60'
            }"
          >
            <img 
              src="/icons/ai-magic.svg" 
              alt="AI Magic"
              class="w-6 h-6" 
            />
          </div>
          <input
            id="course-objective-input"
            type="text"
            bind:value={learningObjective}
            bind:this={courseObjectiveInput}
            placeholder="Enter what you want to learn..."
            on:focus={() => isInputFocused = true}
            on:blur={() => isInputFocused = false}
            class="w-full text-body pl-12 pr-3 h-[52px] rounded-2xl border-[1.5px] border-light-border dark:border-dark-border focus:pl-4 focus:outline-none focus:border-brand-red bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary transition-colors duration-300 ease-in-out"
          />
        </div>
      </form>
    </div>
  </div>

  <!-- Continue Learning Section -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-h4-medium lg:text-h4 text-light-text-primary dark:text-dark-text-primary">Continue Learning</h4>
      {#if $user && userCourses.length > 0}
        <div class="flex items-center gap-2">
          <a href="/courses" class="text-[#42C1C8] text-body hover:underline">Show All</a>
          <img src="/icons/arrow-right.svg" alt="arrow-right.svg" class="w-6 h-6">
        </div>
      {/if}
    </div>
    
    <div class="h-[1px] bg-light-border dark:bg-dark-border mb-6"></div>
    
    <UserCourseList 
      courses={userCourses}
      loading={loading}
      error={error}
    />
  </div>

  <!-- Trending Community Courses Section -->
  <section class="mb-6">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-h4-medium lg:text-h4 text-light-text-primary dark:text-dark-text-primary">Trending Courses</h4>
      <div class="flex items-center gap-2">
        <a href="/trending" class="text-brand-turquoise text-body hover:underline">Show All</a>
        <img src="/icons/arrow-right.svg" alt="arrow-right.svg" class="w-6 h-6">
      </div>
    </div>
    <div class="h-[1px] bg-light-border dark:bg-dark-border mb-6"></div>
    <TrendingCourseList 
      courses={publicCourses}
      loading={trendingCoursesLoading}
    />
  </section>
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
    on:focusCourseObjective={focusCourseObjective}
  />
{/if}
