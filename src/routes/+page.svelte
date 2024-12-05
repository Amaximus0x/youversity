<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { signInWithGoogle } from '$lib/services/auth';
  import { page } from '$app/stores';
  import { getUserCourses } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { 
    ArrowRight, 
    Share2, 
    ThumbsUp, 
    ThumbsDown, 
    Eye,
    Play,
    Plus 
  } from 'lucide-svelte';
  import { goto } from '$app/navigation';
  import CourseFilter from '$lib/components/CourseFilter.svelte';
  import { loadingState } from '$lib/stores/loadingState';
  import { onMount } from 'svelte';
  import ShareModal from '$lib/components/ShareModal.svelte';
  import { Copy, X } from 'lucide-svelte';
  import CourseList from '$lib/components/CourseList.svelte';

  let learningObjective = '';
  let userCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;
  let filteredCourses = userCourses;
  let showShareModal = false;
  let selectedCourseId = '';

  // Load user courses when authenticated
  $: if ($user) {
    loadUserCourses();
  }

  async function loadUserCourses() {
    try {
      loading = true;
      error = null;
      userCourses = await getUserCourses($user.uid);
    } catch (err) {
      console.error('Error loading courses:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  const trendingCourses = [
    { id: 1, title: 'Blockchain Fundamentals', author: 'Crypto Expert', image: '/placeholder.svg', likes: 1200, dislikes: 50, views: 15000 },
    { id: 2, title: 'AI and Machine Learning', author: 'Data Scientist Pro', image: '/placeholder.svg', likes: 980, dislikes: 30, views: 12000 },
    { id: 3, title: 'Full Stack Web Development', author: 'Code Ninja', image: '/placeholder.svg', likes: 850, dislikes: 20, views: 10000 },
  ];

  async function handleCreateCourse(e: Event) {
    e.preventDefault();
    
    if (!learningObjective.trim()) {
      return; // Don't proceed if learning objective is empty
    }

    try {
      if ($user) {
        // For authenticated users, go directly to create-course with the objective
        window.location.href = `/create-course?objective=${encodeURIComponent(learningObjective)}`;
      } else {
        // For unauthenticated users, redirect to login with return URL
        const returnUrl = `/create-course?objective=${encodeURIComponent(learningObjective)}`;
        window.location.href = `/login?redirectTo=${encodeURIComponent(returnUrl)}`;
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  function handleShareCourse(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
  }

  function handleAddCourse() {
    goto('/create-course');
  }

  function handleFilterChange(event) {
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
        sortedCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'date-old':
        sortedCourses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        sortedCourses = [...userCourses];
    }
    
    filteredCourses = sortedCourses;
  }

  // Update filteredCourses whenever userCourses changes
  $: filteredCourses = userCourses;

  onMount(() => {
    // Clear any stale loading state
    loadingState.clearState();
    return () => {
      loadingState.clearState();
    };
  });
</script>

<div class="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
  <!-- Create Course Section -->
  <div class="relative overflow-hidden bg-gradient-to-br from-[#F5F5F5] to-white rounded-lg shadow-lg p-4 sm:p-8 md:p-12 mb-6 sm:mb-12">
    <div class="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5"></div>
    
    <div class="max-w-2xl mx-auto text-center relative">
      <div class="flex items-center justify-center mb-4 sm:mb-6">
        <img 
          src="/favicon.png" 
          alt="Youversity Logo" 
          class="w-8 h-8 sm:w-12 sm:h-12 object-contain"
        />
      </div>
      <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2A4D61] mb-2 sm:mb-4">
        Create Your Course
      </h2>
      
      <p class="text-sm sm:text-base text-[#1E3443]/80 mb-6 sm:mb-8">
        Enter your learning objective below and we'll help you create a comprehensive course
      </p>

      <form 
        on:submit={handleCreateCourse} 
        class="flex flex-col sm:flex-row gap-2 sm:gap-4 max-w-xl mx-auto"
      >
        <input
          type="text"
          bind:value={learningObjective}
          placeholder="Enter what you want to learn..."
          class="flex-1 px-4 py-2 sm:py-3 rounded-lg border border-[#D9E1E3] focus:outline-none focus:ring-2 focus:ring-[#42C1C8] text-sm sm:text-base"
        />
        <button
          type="submit"
          class="px-6 py-2 sm:py-3 bg-[#42C1C8] text-white rounded-lg hover:bg-[#3BA7AD] transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
        >
          Create Course
          <ArrowRight class="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </div>
  </div>

  {#if $user}
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 class="text-xl sm:text-2xl font-semibold text-[#2A4D61]">Your Courses</h2>
        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <CourseFilter on:change={handleFilterChange} />
          <button
            on:click={handleAddCourse}
            class="flex items-center justify-center gap-2 px-4 py-2 bg-[#42C1C8] text-white rounded-lg hover:bg-[#3BA7AD] transition-colors duration-200 w-full sm:w-auto"
          >
            <Plus class="w-4 h-4" />
            <span>New Course</span>
          </button>
        </div>
      </div>
      
      <CourseList 
        courses={filteredCourses}
        {loading}
        {error}
        onShare={handleShareCourse}
      />
    </div>

    <!-- Trending Community Courses Section -->
    <section class="mb-12">
      <h2 class="text-xl sm:text-2xl font-semibold text-[#2A4D61] mb-6">Trending Courses</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {#each trendingCourses as course}
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <img 
              src={course.image} 
              alt={course.title}
              class="w-full h-32 sm:h-48 object-cover"
            />
            <div class="p-4">
              <h3 class="font-semibold text-base sm:text-lg text-[#2A4D61] mb-2">{course.title}</h3>
              <p class="text-sm text-[#1E3443]/80 mb-4">{course.author}</p>
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1">
                    <ThumbsUp class="w-4 h-4" />
                    {course.likes}
                  </span>
                  <span class="flex items-center gap-1">
                    <ThumbsDown class="w-4 h-4" />
                    {course.dislikes}
                  </span>
                </div>
                <span class="flex items-center gap-1">
                  <Eye class="w-4 h-4" />
                  {course.views}
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

{#if showShareModal}
  <ShareModal 
    courseId={selectedCourseId}
    on:close={() => showShareModal = false}
  />
{/if}
