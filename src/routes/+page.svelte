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
          class="flex-1 px-4 py-2 sm:py-3 rounded-lg border border-[#D9E1E3] focus:outline-none focus:ring-2 focus:ring-[#EE434A] text-sm sm:text-base"
        />
        <button
          type="submit"
          class="px-6 py-2 sm:py-3 bg-[#EE434A] text-white rounded-lg hover:bg-[#D63B42] transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
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
