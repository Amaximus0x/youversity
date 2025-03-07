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
  import { isAuthenticated } from '$lib/stores/auth';

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

  // Redirect authenticated users to dashboard
  onMount(() => {
    if ($isAuthenticated) {
      goto('/dashboard');
    }
  });

  function navigateToLogin() {
    goto('/login');
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
        let isCompleted = false;
        
        if (enrollmentProgress?.completedModules) {
          progress = Math.round((enrollmentProgress.completedModules.length / course.Final_Module_Title.length) * 100);
          // Check if the course is completed (final quiz passed)
          isCompleted = enrollmentProgress.quizResults?.finalQuiz?.completed && 
                       enrollmentProgress.quizResults?.finalQuiz?.passed;
        }
        
        return {
          ...course,
          progress,
          isCompleted
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

<div class="min-h-screen flex flex-col">
  <!-- Hero Section -->
  <section class="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-24">
    <div class="max-w-5xl mx-auto text-center">
      <div class="mb-8 flex justify-center">
        <div class="flex justify-start items-center">
          <img
            src="/YV.svg"
            alt="Youversity Logo"
            class="w-[44.97px] h-[48.43px] mr-2"
          />
          
          <div class="pt-2">
            <svg
              class="w-[107.83px] h-[21.36px] text-light-text-primary dark:text-dark-text-primary"
              viewBox="0 0 109 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <g id="Youversity">
                <path
                  d="M12.8206 1.85152L8.04707 11.0458V16.276H5.68104V11.0458L0.886719 1.85152H3.52256L6.86406 8.92886L10.2056 1.85152H12.8206Z"
                  fill="currentColor"
                />
                <!-- Rest of the SVG paths -->
                <path
                  d="M19.6587 16.4628C18.5794 16.4628 17.6039 16.2207 16.7322 15.7364C15.8605 15.2383 15.1756 14.5465 14.6775 13.6609C14.1794 12.7616 13.9304 11.7238 13.9304 10.5477C13.9304 9.38546 14.1863 8.35465 14.6983 7.45528C15.2102 6.55591 15.909 5.86409 16.7945 5.37981C17.68 4.89554 18.6693 4.6534 19.7624 4.6534C20.8555 4.6534 21.8448 4.89554 22.7303 5.37981C23.6159 5.86409 24.3146 6.55591 24.8266 7.45528C25.3385 8.35465 25.5945 9.38546 25.5945 10.5477C25.5945 11.71 25.3316 12.7408 24.8058 13.6402C24.28 14.5395 23.5605 15.2383 22.6473 15.7364C21.748 16.2207 20.7517 16.4628 19.6587 16.4628Z"
                  fill="currentColor"
                />
                <!-- More SVG paths omitted for brevity -->
              </g>
            </svg>
          </div>
        </div>
      </div>
      
      <h1 class="text-h1 text-light-text-primary dark:text-dark-text-primary mb-6">
        Your Learning Journey Starts Here
      </h1>
      
      <p class="text-18-28 text-light-text-secondary dark:text-dark-text-secondary mb-12 max-w-3xl mx-auto">
        Discover personalized courses, connect with learners, and expand your knowledge with Youversity's AI-powered learning platform.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          on:click={navigateToLogin}
          class="px-8 py-3 bg-brand-red text-white rounded-lg hover:bg-opacity-90 transition-all font-medium"
        >
          Sign In to Get Started
        </button>
        
        <button 
          on:click={() => goto('/login?register=true')}
          class="px-8 py-3 border border-brand-red text-brand-red rounded-lg hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-all font-medium"
        >
          Create an Account
        </button>
      </div>
    </div>
  </section>
  
  <!-- Features Section -->
  <section class="py-16 px-4 bg-light-bg-secondary dark:bg-dark-bg-secondary">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-h2 text-light-text-primary dark:text-dark-text-primary text-center mb-12">
        Why Choose Youversity?
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div class="p-6 rounded-xl bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border">
          <div class="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 9.5L14.5 14.5M14.5 9.5L9.5 14.5M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#EE434A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-2">AI-Powered Learning</h3>
          <p class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary">
            Our AI technology creates personalized learning experiences tailored to your interests and goals.
          </p>
        </div>
        
        <!-- Feature 2 -->
        <div class="p-6 rounded-xl bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border">
          <div class="w-12 h-12 bg-brand-turquoise/10 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 18.7023C18.6224 18.3904 19.1716 17.9614 19.6177 17.4391M4 21.8208C4.91153 21.2736 6.14234 21 7.5 21C8.85766 21 10.0885 21.2736 11 21.8208M14 7C14 9.20914 12.2091 11 10 11C7.79086 11 6 9.20914 6 7C6 4.79086 7.79086 3 10 3C12.2091 3 14 4.79086 14 7ZM13.5 21C13.5 18.5147 11.4853 16.5 9 16.5C6.51472 16.5 4.5 18.5147 4.5 21M21.5 17.5C21.5 15.0147 19.4853 13 17 13C14.5147 13 12.5 15.0147 12.5 17.5" stroke="#42C1C8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-2">Community Learning</h3>
          <p class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary">
            Connect with other learners, share insights, and collaborate on your educational journey.
          </p>
        </div>
        
        <!-- Feature 3 -->
        <div class="p-6 rounded-xl bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border">
          <div class="w-12 h-12 bg-brand-navy/10 rounded-full flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6.5V15M12 15L16 11M12 15L8 11M20 18L4 18" stroke="#2A4D61" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-2">Accessible Anywhere</h3>
          <p class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary">
            Access your courses anytime, anywhere with our responsive platform that works on all devices.
          </p>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Footer -->
  <footer class="py-8 px-4 bg-light-bg-primary dark:bg-dark-bg-primary border-t border-light-border dark:border-dark-border">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
      <div class="flex items-center mb-4 md:mb-0">
        <img src="/YV.svg" alt="Youversity Logo" class="w-8 h-8 mr-2" />
        <span class="text-light-text-primary dark:text-dark-text-primary font-medium">Youversity</span>
      </div>
      
      <div class="text-light-text-tertiary dark:text-dark-text-tertiary text-mini-body">
        © {new Date().getFullYear()} Youversity. All rights reserved.
      </div>
    </div>
  </footer>
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if}
