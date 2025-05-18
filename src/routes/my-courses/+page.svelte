<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { getUserCourses, getEnrollmentProgress, getBookmarkedCourses, toggleBookmark } from '$lib/firebase';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import type { FinalCourseStructure } from '$lib/types/course';
  import UserCourseCard from '$lib/components/UserCourseCard.svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';

  // Define an interface for the Firestore Timestamp
  interface FirestoreTimestamp {
    toMillis(): number;
  }

  // Extend the course type to include the timestamp
  type CourseWithProgress = FinalCourseStructure & { 
    id: string; 
    progress?: number;
    createdAt?: FirestoreTimestamp | Date | null;
    isCompleted?: boolean;
    bookmarkedAt?: Date;
    isCreated?: boolean;
    isEnrolled?: boolean;
    isAssigned?: boolean;
    isBookmarked?: boolean;
  };

  let allCourses: CourseWithProgress[] = [];
  let enrolledCourses: CourseWithProgress[] = [];
  let createdCourses: CourseWithProgress[] = [];
  let assignedCourses: CourseWithProgress[] = [];
  let bookmarkedCourses: CourseWithProgress[] = [];
  let loading = true;
  let error: string | null = null;
  let activeTab: 'all' | 'enrolled' | 'created' | 'assigned' | 'bookmarked' = 'all';
  let sortBy = '';
  let showShareModal = false;
  let selectedCourseId = '';
  let selectedCourseName = '';
  let initialLoad = true;
  let showSortDropdown = false;
  let sortOption: 'newest' | 'oldest' = 'newest';
  let displayedCourses: CourseWithProgress[] = [];

  // Subscribe to auth state changes
  user.subscribe(async (userData) => {
    console.log('Auth state changed in my-courses page:', { userData });
    if (userData) {
      if (initialLoad || !loading) {
        initialLoad = false;
        await loadCourses();
      }
    } else {
      // Clear courses when user logs out
      allCourses = [];
      enrolledCourses = [];
      createdCourses = [];
      assignedCourses = [];
      bookmarkedCourses = [];
      if (!initialLoad) {
        // Only redirect if this isn't the initial page load
        goto('/login');
      }
    }
  });

  async function loadCourses() {
    const userData = get(user);
    if (!userData) {
      console.log('No user data, redirecting to login');
      goto('/login');
      return;
    }

    try {
      loading = true;
      error = null;
      console.log('Loading courses for user:', userData.uid);
      
      const courses = await getUserCourses(userData.uid);
      console.log('Got courses:', courses);
      
      if (!courses || !Array.isArray(courses)) {
        console.error('Invalid courses data:', courses);
        throw new Error('Failed to load courses');
      }
      
      // Load progress for each course
      const coursesWithProgress = await Promise.all(courses.map(async (course) => {
        try {
          const enrollmentProgress = await getEnrollmentProgress(userData.uid, course.id);
          let progress;
          let isCompleted = false;
          
          if (enrollmentProgress?.completedModules) {
            progress = Math.round(
              (enrollmentProgress.completedModules.length / course.Final_Module_Title.length) * 100
            );
            // Check if the course is completed (final quiz passed)
            isCompleted = enrollmentProgress.quizResults?.finalQuiz?.completed && 
                         enrollmentProgress.quizResults?.finalQuiz?.passed;
            
            console.log('Course completion check:', {
              courseId: course.id,
              courseTitle: course.Final_Course_Title,
              isCompleted,
              finalQuiz: enrollmentProgress.quizResults?.finalQuiz
            });
          }
          
          return {
            ...course,
            progress,
            isCompleted
          };
        } catch (error) {
          console.error('Error loading progress for course:', course.id, error);
          return {
            ...course,
            progress: 0,
            isCompleted: false
          };
        }
      }));

      // Get created courses
      createdCourses = coursesWithProgress.filter(
        course => course.isCreator || course.createdBy === userData.uid
      ).map(course => ({ ...course, isCreated: true }));
      console.log('Created courses:', createdCourses);
      
      // Get enrolled courses
      enrolledCourses = coursesWithProgress.filter(
        course => course.isEnrolled
      ).map(course => ({ ...course, isEnrolled: true }));
      console.log('Enrolled courses:', enrolledCourses);
      
      // Get assigned courses - this is placeholder logic, replace with actual logic
      assignedCourses = coursesWithProgress.filter(
        course => course.isAssigned || false
      ).map(course => ({ ...course, isAssigned: true }));
      console.log('Assigned courses:', assignedCourses);
      
      // Load bookmarked courses
      try {
        const bookmarked = await getBookmarkedCourses(userData.uid);
        bookmarkedCourses = bookmarked.map(course => ({ ...course, isBookmarked: true }));
        console.log('Bookmarked courses:', bookmarkedCourses);
      } catch (error) {
        console.error('Error loading bookmarked courses:', error);
      }
      
      // All courses should show all course types without duplicates
      // Use a Map to deduplicate by course ID
      const uniqueCourses = new Map();
      
      // Add created courses first
      createdCourses.forEach(course => {
        uniqueCourses.set(course.id, course);
      });
      
      // Add enrolled courses
      enrolledCourses.forEach(course => {
        if (uniqueCourses.has(course.id)) {
          // If course already exists, update it to indicate it's also enrolled
          const existingCourse = uniqueCourses.get(course.id);
          uniqueCourses.set(course.id, { ...existingCourse, isEnrolled: true });
        } else {
          uniqueCourses.set(course.id, course);
        }
      });

      // Add assigned courses
      assignedCourses.forEach(course => {
        if (uniqueCourses.has(course.id)) {
          // If course already exists, update it to indicate it's also assigned
          const existingCourse = uniqueCourses.get(course.id);
          uniqueCourses.set(course.id, { ...existingCourse, isAssigned: true });
        } else {
          uniqueCourses.set(course.id, course);
        }
      });

      // Add bookmarked courses
      bookmarkedCourses.forEach(course => {
        if (uniqueCourses.has(course.id)) {
          // If course already exists, update it to indicate it's also bookmarked
          const existingCourse = uniqueCourses.get(course.id);
          uniqueCourses.set(course.id, { 
            ...existingCourse, 
            isBookmarked: true, 
            bookmarkedAt: course.bookmarkedAt 
          });
        } else {
          uniqueCourses.set(course.id, course);
        }
      });
      
      // Convert Map back to array
      allCourses = Array.from(uniqueCourses.values());
      console.log('All courses:', allCourses);
      
    } catch (error) {
      console.error('Error loading courses:', error);
      error = error instanceof Error ? error.message : 'Failed to load courses';
    } finally {
      loading = false;
    }
  }

  async function handleRemoveBookmark(courseId: string) {
    try {
      const userData = get(user);
      if (!userData) return;
      
      // Update local state immediately
      bookmarkedCourses = bookmarkedCourses.filter(course => course.id !== courseId);
      
      // If we're on the bookmarked tab, update displayed courses
      if (activeTab === 'bookmarked') {
        displayedCourses = [...bookmarkedCourses];
      }
      
      // Update backend
      await toggleBookmark(userData.uid, courseId);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      // Reload courses if there was an error
      await loadCourses();
    }
  }

  onMount(() => {
    console.log('My courses page mounted');
    initialLoad = true;
    // Get initial user state
    const userData = get(user);
    if (userData) {
      loadCourses();
    } else {
      console.log('No user data on mount, waiting for auth state');
    }

    // Add click outside listener
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  function handleShare(courseId: string, courseName: string = '') {
    selectedCourseId = courseId;
    selectedCourseName = courseName;
    showShareModal = true;
  }

  // Reactive statement to determine which courses to display based on active tab and sort option
  $: {
    console.log('Sorting triggered:', { activeTab, sortOption });
    let courses = activeTab === 'all' 
      ? [...allCourses] 
      : activeTab === 'enrolled' 
        ? [...enrolledCourses] 
        : activeTab === 'created'
          ? [...createdCourses]
          : activeTab === 'assigned'
            ? [...assignedCourses]
            : [...bookmarkedCourses];

    console.log('Courses before sorting:', courses.map(c => ({ 
      title: c.Final_Course_Title, 
      createdAt: c.createdAt,
      bookmarkedAt: c.bookmarkedAt
    })));

    if (sortOption === 'newest') {
      courses.sort((a, b) => {
        // For bookmarked courses, use bookmarkedAt
        if (activeTab === 'bookmarked') {
          const dateA = a.bookmarkedAt instanceof Date ? a.bookmarkedAt.getTime() : new Date(a.bookmarkedAt as any).getTime();
          const dateB = b.bookmarkedAt instanceof Date ? b.bookmarkedAt.getTime() : new Date(b.bookmarkedAt as any).getTime();
          return dateB - dateA;
        }
        
        // Handle different timestamp types for other tabs
        let dateA = 0;
        let dateB = 0;
        
        if (a.createdAt) {
          if ('toMillis' in a.createdAt) {
            dateA = a.createdAt.toMillis();
          } else if (a.createdAt instanceof Date) {
            dateA = a.createdAt.getTime();
          }
        }
        
        if (b.createdAt) {
          if ('toMillis' in b.createdAt) {
            dateB = b.createdAt.toMillis();
          } else if (b.createdAt instanceof Date) {
            dateB = b.createdAt.getTime();
          }
        }
        
        console.log('Comparing dates:', {
          titleA: a.Final_Course_Title,
          dateA,
          titleB: b.Final_Course_Title,
          dateB,
          result: dateB - dateA
        });
        return dateB - dateA;
      });
    } else if (sortOption === 'oldest') {
      courses.sort((a, b) => {
        // For bookmarked courses, use bookmarkedAt
        if (activeTab === 'bookmarked') {
          const dateA = a.bookmarkedAt instanceof Date ? a.bookmarkedAt.getTime() : new Date(a.bookmarkedAt as any).getTime();
          const dateB = b.bookmarkedAt instanceof Date ? b.bookmarkedAt.getTime() : new Date(b.bookmarkedAt as any).getTime();
          return dateA - dateB;
        }
        
        // Handle different timestamp types for other tabs
        let dateA = 0;
        let dateB = 0;
        
        if (a.createdAt) {
          if ('toMillis' in a.createdAt) {
            dateA = a.createdAt.toMillis();
          } else if (a.createdAt instanceof Date) {
            dateA = a.createdAt.getTime();
          }
        }
        
        if (b.createdAt) {
          if ('toMillis' in b.createdAt) {
            dateB = b.createdAt.toMillis();
          } else if (b.createdAt instanceof Date) {
            dateB = b.createdAt.getTime();
          }
        }
        
        return dateA - dateB;
      });
    }

    console.log('Courses after sorting:', courses.map(c => ({ 
      title: c.Final_Course_Title, 
      createdAt: c.createdAt,
      bookmarkedAt: c.bookmarkedAt
    })));
    
    displayedCourses = courses;
  }

  // Function to handle sort option selection
  function handleSortSelect(option: 'newest' | 'oldest') {
    console.log('Sort option selected:', option);
    sortOption = option;
    showSortDropdown = false;
  }

  // Function to handle click outside of dropdown
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.sort-dropdown')) {
      showSortDropdown = false;
    }
  }

  // Reactive statement to determine which courses to display based on active tab
  $: courseCount = {
    all: allCourses.length,
    enrolled: enrolledCourses.length,
    created: createdCourses.length,
    assigned: assignedCourses.length,
    bookmarked: bookmarkedCourses.length
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
  <div class="mb-8 flex justify-between items-end">
    <div>
      <h1 class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary mb-4">
        My Courses
      </h1>
      <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body lg:text-body">
        Access all your enrolled and created courses. Stay on top of your learning, monitor your progress, and keep everything organized in one place!
      </p>
    </div>

    <!-- Sort and Create Course Section - Desktop -->
    <div class="hidden lg:flex items-center gap-4">
      <!-- Sort Dropdown -->
      <div class="sort-dropdown relative">
        <button 
          class="h-[42px] px-4 py-2 bg-black/5 dark:bg-white/10 rounded-lg justify-start items-center gap-[17px] inline-flex"
          on:click|stopPropagation={() => showSortDropdown = !showSortDropdown}
        >
          <div class="text-light-text-secondary dark:text-dark-text-secondary text-nowrap">Sort by</div>
          <div data-svg-wrapper class="relative">
            <svg class="text-light-text-primary dark:text-dark-text-primary" width="16" height="27" viewBox="0 0 16 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 10.5C12 10.5 9.05403 6.50001 7.99997 6.5C6.9459 6.49999 4 10.5 4 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 16.5C12 16.5 9.05403 20.5 7.99997 20.5C6.9459 20.5 4 16.5 4 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>

        {#if showSortDropdown}
          <div class="absolute right-0 mt-2 w-48 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-light-border dark:border-dark-border z-50">
            <button
              class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption === 'newest' ? 'bg-black/5 dark:bg-white/10' : ''}"
              on:click={() => handleSortSelect('newest')}
            >
              <span>Newest</span>
              {#if sortOption === 'newest'}
                <svg class="w-4 h-4 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
            <button
              class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption === 'oldest' ? 'bg-black/5 dark:bg-white/10' : ''}"
              on:click={() => handleSortSelect('oldest')}
            >
              <span>Oldest</span>
              {#if sortOption === 'oldest'}
                <svg class="w-4 h-4 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
          </div>
        {/if}
      </div>
      
      <!-- Create Course Button -->
      <button 
        class="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors"
        on:click={handleCreateCourse}
      >
        <span class="text-body text-nowrap">Create Course</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Tabs and Sort Section -->
  <div class="mb-6">
    <!-- Border container that spans full width -->
    <div class="relative border-b border-light-border dark:border-dark-border">
      <div class="container max-w-auto">
        <!-- Tabs -->
        <div class="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-1">
          <button 
            class="pb-4 relative whitespace-nowrap {activeTab === 'all' 
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
            class="pb-4 relative whitespace-nowrap {activeTab === 'enrolled' 
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
            class="pb-4 relative whitespace-nowrap {activeTab === 'created' 
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
          <button 
            class="pb-4 relative whitespace-nowrap {activeTab === 'assigned' 
              ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' 
              : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
            on:click={() => activeTab = 'assigned'}
          >
            <span class="hidden lg:inline">Assigned Courses</span>
            <span class="lg:hidden">Assigned</span>
            <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
              {courseCount.assigned}
            </span>
            {#if activeTab === 'assigned'}
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
            {/if}
          </button>
          <button 
            class="pb-4 relative whitespace-nowrap {activeTab === 'bookmarked' 
              ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' 
              : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
            on:click={() => activeTab = 'bookmarked'}
          >
            <span class="hidden lg:inline">Bookmarked Courses</span>
            <span class="lg:hidden">Bookmarked</span>
            <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
              {courseCount.bookmarked}
            </span>
            {#if activeTab === 'bookmarked'}
              <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Sort and Create Course Section - Mobile -->
    <div class="flex lg:hidden items-center justify-end gap-4 mt-4">
      <!-- Sort Dropdown -->
      <div class="sort-dropdown relative">
        <button 
          class="h-[42px] px-4 py-2 bg-black/5 dark:bg-white/10 rounded-lg justify-start items-center gap-[17px] inline-flex"
          on:click|stopPropagation={() => showSortDropdown = !showSortDropdown}
        >
          <div class="text-light-text-secondary dark:text-dark-text-secondary ">Sort by</div>
          <div data-svg-wrapper class="relative">
            <svg class="text-black dark:text-white" width="16" height="27" viewBox="0 0 16 27" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 10.5C12 10.5 9.05403 6.50001 7.99997 6.5C6.9459 6.49999 4 10.5 4 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 16.5C12 16.5 9.05403 20.5 7.99997 20.5C6.9459 20.5 4 16.5 4 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>

        {#if showSortDropdown}
          <div class="absolute right-0 mt-2 w-48 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-light-border dark:border-dark-border z-50">
            <button
              class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption === 'newest' ? 'bg-black/5 dark:bg-white/10' : ''}"
              on:click={() => handleSortSelect('newest')}
            >
              <span>Newest</span>
              {#if sortOption === 'newest'}
                <svg class="w-4 h-4 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
            <button
              class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption === 'oldest' ? 'bg-black/5 dark:bg-white/10' : ''}"
              on:click={() => handleSortSelect('oldest')}
            >
              <span>Oldest</span>
              {#if sortOption === 'oldest'}
                <svg class="w-4 h-4 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
          </div>
        {/if}
      </div>

      <!-- Create Course Button -->
      <button 
        class="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors"
        on:click={handleCreateCourse}
      >
        <span class="text-body text-nowrap">Create Course</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
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
          {#if activeTab === 'bookmarked'}
            You haven't bookmarked any courses yet.
          {:else}
            No courses found in this category.
          {/if}
        </p>
      </div>
    {:else}
      {#each displayedCourses as course (course.id)}
        <div class="w-full">
          <UserCourseCard 
            {course} 
            onShare={(id) => handleShare(id, course.Final_Course_Title)} 
            isBookmarked={activeTab === 'bookmarked' || (course.isBookmarked ?? false)}
            onRemoveBookmark={activeTab === 'bookmarked' ? handleRemoveBookmark : undefined}
          />
        </div>
      {/each}
    {/if}
  </div>

</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    shareType="course"
    id={selectedCourseId}
    courseId={selectedCourseId}
    courseName={selectedCourseName}
    onClose={() => showShareModal = false}
  />
{/if} 