<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { signInWithGoogle } from '$lib/services/auth';
  import { page } from '$app/stores';
  import { getUserCourses, getPublicCourses, toggleCoursePrivacy, likeCourse } from '$lib/firebase';
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

  let learningObjective = '';
  let userCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;
  let filteredCourses: (FinalCourseStructure & { id: string })[] = [];
  let showShareModal = false;
  let selectedCourseId = '';
  let publicCourses: (FinalCourseStructure & { id: string })[] = [];
  let isInputFocused = false;

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
      const courses = await getUserCourses($user.uid);
      userCourses = courses;
      filteredCourses = [...courses];
    } catch (err) {
      console.error('Error loading courses:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    try {
      console.log('Fetching public courses on home page...');
      // Initial load
      publicCourses = await getPublicCourses();
      console.log('Public courses loaded on home page:', publicCourses);

      // Set up an interval to refresh the public courses every minute
      const refreshInterval = setInterval(async () => {
        try {
          const updatedCourses = await getPublicCourses();
          if (JSON.stringify(updatedCourses) !== JSON.stringify(publicCourses)) {
            publicCourses = updatedCourses;
            console.log('Public courses refreshed:', publicCourses);
          }
        } catch (error) {
          console.error('Error refreshing public courses:', error);
        }
      }, 60000); // 60 seconds

      // Cleanup interval on component unmount
      return () => {
        clearInterval(refreshInterval);
      };
    } catch (error) {
      console.error('Error loading public courses:', error);
    }
  });

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
    // Only clear loading state if there's no active course generation
    if (!$loadingState.isLoading) {
      loadingState.clearState();
    }
    return () => {
      // Only clear on unmount if there's no active course generation
      if (!$loadingState.isLoading) {
        loadingState.clearState();
      }
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

<div class="container mx-auto px-4 py-6 pb-20 sm:pb-6 sm:py-8 max-w-7xl">
  <!-- Create Course Section -->
  <div class="relative overflow-hidden bg-gradient-to-br from-[#FFF2F3] to-[#EDFEFF] rounded-lg p-8 sm:p-12 mb-6 sm:mb-12">    
    <div class="max-w-2xl">
      <h1 class="text-4xl font-medium mb-2">
        Hi {$user?.displayName?.split(' ')[0] || ''} 👋
      </h1>
      <h2 class="text-4xl font-medium mb-6">
        What would you like to <span class="text-[#EE434A]">Learn</span>?
      </h2>
      <p class="text-[#494848] text-lg mb-8">
        Enter your learning objectives below we'll help you create a comprehensive course.
      </p>

      <form 
        on:submit={handleCreateCourse} 
        class="relative flex-1 max-w-3xl"
      >
        <button
          type="submit"
          class="absolute right-0 z-10 px-6 h-[52px] bg-[#EE434A] text-white rounded-[32px] hover:bg-[#D63B42] transition-colors duration-200 flex items-center gap-2 text-base whitespace-nowrap"
        >
          Create Course
          <img 
            src="/icons/arrow-right.svg" 
            alt="Create"
            class="w-5 h-5" 
          />
        </button>
        <div class="relative w-full">
          <div 
            class="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ease-in-out" 
            class:opacity-0={isInputFocused}
            class:translate-x-[-10px]={isInputFocused}
          >
            <img 
              src="/icons/ai-magic.svg" 
              alt="AI Magic"
              class="w-6 h-6" 
            />
          </div>
          <input
            type="text"
            bind:value={learningObjective}
            placeholder="Enter what you want to learn..."
            on:focus={() => isInputFocused = true}
            on:blur={() => isInputFocused = false}
            class="w-full pl-12 pr-32 h-[52px] rounded-[32px] border-[1.5px] border-[rgba(0,0,0,0.05)] focus:outline-none focus:border-[#EE434A] text-base bg-white transition-all duration-200 ease-in-out"
          />
        </div>
      </form>
    </div>
  </div>

  {#if $user}
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 class="text-xl sm:text-2xl font-semibold text-[#2A4D61]">Your Courses</h2>
        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <CourseFilter on:filterChange={handleFilterChange} />
        </div>
      </div>
      
      {#if loading}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {#each getSkeletonItems(6) as _}
            <div class="bg-white rounded-lg shadow-md overflow-hidden p-4">
              <Skeleton height="200px" class="mb-4" />
              <Skeleton height="24px" width="70%" class="mb-2" />
              <Skeleton height="20px" width="40%" class="mb-4" />
              <div class="flex justify-between">
                <Skeleton height="20px" width="30%" />
                <Skeleton height="20px" width="30%" />
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <CourseList 
          courses={filteredCourses}
          {loading}
          {error}
          onShare={handleShareCourse}
          onTogglePrivacy={handleTogglePrivacy}
        />
      {/if}
    </div>

    <!-- Trending Community Courses Section -->
    <section class="mb-12">
      <h2 class="text-xl sm:text-2xl font-semibold text-[#2A4D61] mb-6" id="trending-courses">Public Courses</h2>
      {#if publicCourses.length === 0}
        <p class="text-gray-500 text-center py-8">No public courses available yet.</p>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {#each publicCourses as course}
            <div 
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && goto(`/course/${course.id}`)}
              class="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
              on:click={() => goto(`/course/${course.id}`)}
            >
              <img 
                src={course.Final_Course_Thumbnail || '/placeholder.svg'} 
                alt={course.Final_Course_Title}
                class="w-full h-32 sm:h-48 object-cover"
                loading="lazy"
              />
              <div class="p-4">
                <h3 class="font-semibold text-base sm:text-lg text-[#2A4D61] mb-2 line-clamp-2">
                  {course.Final_Course_Title}
                </h3>
                <p class="text-sm text-[#1E3443]/80 mb-4 line-clamp-3">
                  {course.Final_Course_Objective}
                </p>
                <div class="flex items-center justify-between text-sm text-[#1E3443]/60">
                  <div class="flex items-center space-x-4">
                    <button 
                      class="flex items-center space-x-1 hover:text-[#EE434A] transition-colors"
                      on:click|stopPropagation={async (e) => {
                        e.preventDefault();
                        if ($user) {
                          try {
                            const updatedLikeData = await likeCourse(course.id, $user.uid);
                            publicCourses = publicCourses.map(c => 
                              c.id === course.id 
                                ? { ...c, likes: updatedLikeData.likes, likedBy: updatedLikeData.likedBy }
                                : c
                            );
                          } catch (error) {
                            console.error('Error updating like:', error);
                          }
                        } else {
                          goto('/login');
                        }
                      }}
                    >
                      <ArrowUp class="w-4 h-4 {course.likedBy?.includes($user?.uid) ? 'text-[#EE434A]' : ''}" />
                      <span>{course.likes || 0}</span>
                    </button>
                    <div class="flex items-center space-x-1">
                      <Eye class="w-4 h-4" />
                      <span>{course.views || 0}</span>
                    </div>
                  </div>
                  <div class="text-xs text-gray-500">
                    {course.createdAt?.toDate?.() 
                      ? new Date(course.createdAt.toDate()).toLocaleDateString() 
                      : 'Recent'}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

{#if showShareModal}
  <ShareModal 
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
  />
{/if}
