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
      loadingState.startLoading('', true);
      loadingState.setStep('Preparing your course...');
      
      if ($user) {
        // For authenticated users, go directly to create-course with the objective
        await goto(`/create-course?objective=${encodeURIComponent(learningObjective)}`);
      } else {
        // For unauthenticated users, redirect to login with return URL
        const returnUrl = `/create-course?objective=${encodeURIComponent(learningObjective)}`;
        await goto(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      loadingState.setError('Failed to navigate to course creation');
    } finally {
      loadingState.stopLoading();
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

<div class="container mx-auto px-4 py-6 pb-20 sm:pb-6 sm:py-8 max-w-7xl">
  <!-- Create Course Section -->
  <div class="relative overflow-hidden rounded-lg p-8 sm:p-0 mb-6 sm:mb-12">    
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
          class="absolute right-0 z-10 px-6 h-[52px] bg-[#EE434A] text-white rounded-2xl hover:bg-[#D63B42] transition-colors duration-200 flex items-center gap-2 text-base whitespace-nowrap"
        >
          Create Course
          <img 
            src="/icons/arrow-right-io.svg" 
            alt="Create"
            class="w-5 h-5" 
          />
        </button>
        <div class="relative w-full">
          <div 
            class="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out {
              isInputFocused ? 'opacity-0 translate-x-[-10px]' : 'opacity-60'
            }"
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
            class="w-full pl-12 pr-32 h-[52px] rounded-2xl border-[1.5px] border-[rgba(0,0,0,0.05)] focus:outline-none focus:border-[#EE434A] text-base bg-white transition-colors duration-300 ease-in-out"
          />
        </div>
      </form>
    </div>
  </div>

  {#if $user}
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-medium text-[#2A4D61]">Continue Learning</h2>
      </div>

      {#if userCourses.length > 0}
        <div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
          {#each userCourses as course}
            <div class="min-w-[280px] bg-white rounded-2xl overflow-hidden">
              <div class="relative h-[156px]">
                {#if course.Final_Course_Thumbnail}
                  <img 
                    src={course.Final_Course_Thumbnail}
                    alt={course.Final_Course_Title}
                    class="w-full h-full object-cover"
                  />
                {:else}
                  <img 
                    src="https://placehold.co/280x156/lightgray/darkgray.png" 
                    alt={course.Final_Course_Title} 
                    class="w-full h-full object-cover" 
                  />
                {/if}
                <div class="absolute inset-0 bg-black/30" />
                <button 
                  class="absolute top-3 right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-[2px]"
                  on:click|stopPropagation={(e) => {
                    e.preventDefault();
                    selectedCourseId = course.id;
                    showShareModal = true;
                  }}
                >
                  <img src="/icons/share-icon.svg" alt="Share" class="w-5 h-5" />
                </button>
              </div>
              <div class="p-4 flex flex-col min-h-[156px]">
                <h3 class="font-medium text-base text-black mb-2 line-clamp-2">{course.Final_Course_Title}</h3>
                <p class="text-[#5F6368] text-sm mb-4 line-clamp-2">{course.Final_Course_Description || course.Final_Course_Objective}</p>
                {#if typeof course.progress === 'number'}
                  <div class="flex items-center gap-2 mb-4">
                    <div class="flex-1 h-2 bg-[#D9E1E3] rounded-full">
                      <div 
                        class="h-full bg-[#42C1C8] rounded-full" 
                        style="width: {course.progress}%" 
                      />
                    </div>
                    <span class="text-sm text-[#5F6368]">{course.progress}%</span>
                  </div>
                {/if}
                <div class="mt-auto pt-2">
                  <button 
                    class="w-full py-2 bg-[#EE434A] hover:bg-[#D63B42] text-white rounded-lg transition-colors duration-200 text-base font-medium"
                    on:click={() => goto(`/course/${course.id}`)}
                  >
                    {typeof course.progress === 'number' ? 'Continue' : 'Start Learning'}
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="bg-transparent border border-[rgba(0,0,0,0.05)] rounded-2xl p-8 h-[372px] relative overflow-hidden">
          <div class="flex items-start justify-between relative h-full">
            <div class="max-w-[400px] pt-4 z-10">
              <h3 class="text-[32px] leading-tight mb-6">
                You haven't <span class="text-[#EE434A]">enrolled</span> in<br />
                a course yet.
              </h3>
              <a 
                href="/search"
                class="inline-flex items-center px-6 py-3 bg-[#EE434A] text-white rounded-lg hover:bg-[#D63B42] transition-colors duration-200"
              >
                Explore Course
                <img 
                  src="/icons/arrow-right-io.svg" 
                  alt="arrow" 
                  class="ml-2 w-6 h-6"
                />
              </a>
            </div>
            <div class="absolute bottom-[-32px] right-[-32px]">
              <img 
                src="/images/Search-engines-pana.svg" 
                alt="No courses" 
                class="w-[688px] h-auto"
              />
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Trending Community Courses Section -->
  <section class="mb-12">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-medium text-[#2A4D61] font-poppins">Trending Courses</h2>
      <a href="/trending" class="text-[#42C1C8] text-sm font-medium hover:underline">Show All</a>
    </div>
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
  />
{/if}
