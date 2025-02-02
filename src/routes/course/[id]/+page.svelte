<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { currentModuleStore } from '$lib/stores/course';
  import { getUserProfile } from '$lib/services/profile';
  import CourseRatings from '$lib/components/CourseRatings.svelte';
  import {
    getUserCourse,
    updateUserCourse,
    getCourseProgress,
    updateModuleProgress,
    getSharedCourse,
    getEnrollmentProgress,
    updateEnrollmentQuizResult,
    getEnrollmentStatus,
    likeCourse,
    enrollInCourse,
    toggleBookmark,
    isBookmarked as checkBookmarkStatus,
    hasLikedCourse,
  } from "$lib/firebase";

  let courseDetails: any = null;
  let loading = true;
  let error: string | null = null;
  let isCreator = false;
  let isEnrolled = false;
  let showProgress = false;
  let moduleProgress: { completed?: boolean }[] = [];
  let enrollmentProgress: any = null;
  let currentModule: number | undefined;
  let enrolling = false;
  let bookmarking = false;
  let isBookmarked = false;
  let creatorProfile: { photoURL?: string; displayName?: string; username?: string } | null = null;
  let hasLiked = false;
  let liking = false;

  onMount(async () => {
    try {
      // Get course details
      if ($user) {
        try {
          courseDetails = await getUserCourse($user.uid, $page.params.id);
          isCreator = true;
          showProgress = true;
          const progress = await getCourseProgress($user.uid, $page.params.id);
          moduleProgress = Array.isArray(progress) ? progress : [];
        } catch {
          courseDetails = await getSharedCourse($page.params.id);
          isCreator = false;
          const enrollmentStatus = await getEnrollmentStatus($user.uid, $page.params.id);
          isEnrolled = enrollmentStatus.isEnrolled;
          showProgress = isEnrolled;
          if (isEnrolled) {
            enrollmentProgress = await getEnrollmentProgress($user.uid, $page.params.id);
          }
        }
        // Check bookmark status
        isBookmarked = await checkBookmarkStatus($user.uid, $page.params.id);
      } else {
        courseDetails = await getSharedCourse($page.params.id);
      }

      // Fetch creator profile if course exists
      if (courseDetails) {
        creatorProfile = await getUserProfile(courseDetails.createdBy);
      }

      // Check like status if user is logged in
      if ($user) {
        hasLiked = await hasLikedCourse($user.uid, $page.params.id);
      }

    } catch (err) {
      console.error('Error:', err);
      error = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading = false;
    }
  });

  // Helper function to check if all modules are completed
  function hasCompletedAllModules(): boolean {
    if (!courseDetails || !moduleProgress.length) return false;
    
    const totalModules = courseDetails.Final_Module_Title.length;
    const completedModules = isCreator 
      ? moduleProgress.filter(m => m?.completed).length
      : enrollmentProgress?.completedModules?.length || 0;
    
    return completedModules === totalModules;
  }

  // Enrollment handler
  async function handleEnroll() {
    if (!$user) {
      goto('/login');
      return;
    }

    try {
      enrolling = true;
      await enrollInCourse($user.uid, $page.params.id);
      
      // Update local state
      isEnrolled = true;
      showProgress = true;
      
      // Initialize enrollment progress
      enrollmentProgress = {
        userId: $user.uid,
        courseId: $page.params.id,
        completedModules: [],
        moduleProgress: Array(courseDetails?.Final_Module_Title.length).fill(null),
        isCompleted: false,
        enrolledAt: new Date(),
        lastAccessedAt: new Date()
      };
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      enrolling = false;
    }
  }

  // Bookmark handler
  async function handleBookmark() {
    if (!$user) {
      goto('/login');
      return;
    }

    try {
      bookmarking = true;
      const newBookmarkState = await toggleBookmark($user.uid, $page.params.id);
      isBookmarked = newBookmarkState;
    } catch (error) {
      console.error('Error bookmarking course:', error);
    } finally {
      bookmarking = false;
    }
  }

  // Add like handler
  async function handleLike() {
    if (!$user) {
      goto('/login');
      return;
    }

    try {
      liking = true;
      const newLikeState = await likeCourse($user.uid, $page.params.id);
      hasLiked = newLikeState;
      
      // Update local likes count
      if (courseDetails) {
        courseDetails.likes = (courseDetails.likes || 0) + (newLikeState ? 1 : -1);
      }
    } catch (error) {
      console.error('Error liking course:', error);
    } finally {
      liking = false;
    }
  }
</script>

<!-- Main Container -->
<div class="w-full min-h-screen overflow-x-hidden bg-white dark:bg-dark-bg-primary">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise"></div>
    </div>
  {:else if error}
    <div class="text-brand-red text-center p-4">{error}</div>
  {:else if courseDetails}
    <div class="w-full lg:container lg:mx-auto lg:py-8">
      <!-- Two Column Layout -->
      <div class="w-full lg:grid lg:grid-cols-12 lg:gap-8">
        <!-- Left Column - Video and Course Info -->
        <div class="w-full lg:col-span-8">
          <!-- Video Player Container -->
          <div class="relative w-full lg:rounded-2xl overflow-hidden">
            <div class="fixed lg:relative top-[86px] lg:top-0 left-0 right-0 z-30 bg-black aspect-video">
              <div class="video-container w-full h-full">
                {#if courseDetails?.Final_Module_YouTube_Video_URL?.length > 0 && courseDetails?.Final_Module_YouTube_Video_URL[$currentModuleStore]}
                  <iframe
                    title={courseDetails?.Final_Module_Title[$currentModuleStore] || 'Course Video'}
                    class="absolute inset-0 w-full h-full"
                    src={(() => {
                      try {
                        const videoUrl = courseDetails.Final_Module_YouTube_Video_URL[$currentModuleStore];
                        const videoId = videoUrl?.match(
                          /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i,
                        )?.[1];
                        return videoId 
                          ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=0&origin=${window.location.origin}`
                          : '';
                      } catch (error) {
                        console.error("Error parsing YouTube URL:", error);
                        return '';
                      }
                    })()}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    loading="lazy"
                  />
                {:else}
                  <div class="absolute inset-0 flex items-center justify-center bg-black/5">
                    <p class="text-light-text-tertiary">No video available</p>
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <!-- Course Info Section -->
          <div class="mt-[calc(56.25vw+86px)] lg:mt-8 px-4 lg:px-0">
            <!-- Course Title -->
            <h1 class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary mb-4">
              {courseDetails?.Final_Course_Title}
            </h1>

            <!-- Stats Section -->
            <div class="flex items-center gap-4 mb-6">
              <!-- Upvotes -->
              <button 
                class="flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
                on:click={handleLike}
                disabled={liking}
              >
                <img 
                  src={hasLiked ? "/icons/upvote-filled.svg" : "/icons/upvote.svg"}
                  alt="Upvotes" 
                  class="w-5 h-5"
                />
                <span class="text-body text-light-text-secondary">
                  {courseDetails?.likes?.toLocaleString() || 0} Upvotes
                </span>
              </button>
              
              <!-- Views -->
              <div class="flex items-center gap-2">
                <img src="/icons/eye.svg" alt="Views" class="w-5 h-5" />
                <span class="text-body text-light-text-secondary">
                  {courseDetails?.views?.toLocaleString() || 0} views
                </span>
              </div>
            </div>

            <!-- Creator Info -->
            <div class="flex items-center gap-3 mt-6">
              {#if creatorProfile?.photoURL}
                <img 
                  src={creatorProfile.photoURL} 
                  alt="Creator" 
                  class="w-12 h-12 rounded-full object-cover"
                />
              {:else}
                <div class="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                  <span class="text-[#2A4D61] font-medium">
                    {(creatorProfile?.username?.[0] || creatorProfile?.displayName?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
              {/if}
              
              <div>
                <p class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary">
                  {creatorProfile?.displayName || creatorProfile?.username || 'Unknown Creator'}
                </p>
                <p class="text-semi-body text-light-text-tertiary">Creator</p>
              </div>
            </div>

            <!-- Course Description -->
            <div class="mt-6">
              <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
                {courseDetails?.Final_Course_Objective}
              </p>
            </div>

            <!-- Course Conclusion -->
            {#if hasCompletedAllModules()}
              <div class="mt-6 p-6 bg-BackgoundBlue rounded-2xl border border-light-border dark:border-dark-border">
                <h3 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-4">
                  Course Conclusion
                </h3>
                <div class="space-y-4">
                  <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
                    {courseDetails.Final_Course_Conclusion || 'Congratulations on completing all modules!'}
                  </p>
                  
                  <div class="flex items-center gap-4 mt-4">
                    <div class="flex items-center gap-2">
                      <img src="/icons/check-circle.svg" alt="Completed" class="w-5 h-5 text-brand-turquoise" />
                      <span class="text-semibody-medium text-light-text-primary">
                        All {courseDetails.Final_Module_Title.length} modules completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Move Reviews Section after Course Conclusion for mobile -->
            <div class="lg:hidden">
              <!-- Course Progress and Modules for mobile -->
              {#if showProgress && $user && (isCreator || isEnrolled)}
                <div class="mt-6 rounded-2xl border border-light-border dark:border-dark-border p-4">
                  <h3 class="text-body-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
                    Your Progress
                  </h3>
                  <div class="flex items-center gap-4">
                    <div class="flex-1 h-3 bg-black/[0.05] rounded-[2000px] overflow-hidden">
                      <div
                        class="h-full bg-brand-turquoise rounded-[200000px] transition-all duration-300"
                        style="width: {isCreator
                          ? (moduleProgress.filter((m) => m?.completed).length /
                              courseDetails.Final_Module_Title.length) *
                            100
                          : ((enrollmentProgress?.completedModules?.length || 0) /
                              courseDetails.Final_Module_Title.length) *
                            100}%"
                      />
                    </div>
                    <span class="text-base text-light-text-primary dark:text-dark-text-primary">
                      {isCreator
                        ? moduleProgress.filter((m) => m?.completed).length
                        : enrollmentProgress?.completedModules?.length || 0}/{courseDetails.Final_Module_Title.length}
                    </span>
                  </div>
                </div>
              {/if}

              <!-- Course Modules for mobile -->
              <div class="mt-6 border border-light-border dark:border-dark-border rounded-2xl overflow-hidden">
                <!-- ... modules list code ... -->
              </div>

              <!-- Reviews Section for mobile -->
              {#if courseDetails.isPublic}
                <div class="w-full mt-6">
                  <CourseRatings courseId={$page.params.id} />
                </div>
              {/if}
            </div>

            <!-- Desktop Reviews Section -->
            <div class="hidden lg:block">
              {#if courseDetails.isPublic}
                <div class="w-full mt-6">
                  <CourseRatings courseId={$page.params.id} />
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Right Column - Progress and Modules -->
        <div class="w-full lg:col-span-4">
          <!-- Course Modules Section -->
          <div class="border border-light-border dark:border-dark-border rounded-2xl overflow-hidden">
            <div class="p-4 border-b border-light-border dark:border-dark-border">
              <h3 class="text-body-semibold text-light-text-primary dark:text-dark-text-primary">
                Course Modules
              </h3>
            </div>
            <div class="w-full divide-y divide-light-border dark:divide-dark-border">
              {#if courseDetails?.Final_Module_Title?.length > 0}
                {#each courseDetails.Final_Module_Title as title, index}
                  <div 
                    class="transition-colors duration-200"
                    class:bg-[rgba(65,193,203,0.1)]={$currentModuleStore === index}
                  >
                    <button
                      class="w-full flex items-center p-4 gap-4 hover:bg-black/[0.02]"
                      on:click={() => {
                        $currentModuleStore = index;
                        if (typeof currentModule !== 'undefined') {
                          currentModule = index;
                        }
                      }}
                    >
                      <!-- Updated Thumbnail Container -->
                      <div class="relative flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden bg-black/5">
                        {#if courseDetails?.Final_Module_Thumbnail?.[index]}
                          <img 
                            src={courseDetails.Final_Module_Thumbnail[index]}
                            alt="Video Thumbnail"
                            class="w-full h-full object-cover"
                          />
                        {:else}
                          <div class="w-full h-full flex items-center justify-center bg-black/5">
                            <img src="/icons/youtube.svg" alt="Video" class="w-8 h-8" />
                          </div>
                        {/if}
                        <!-- Play Button Overlay -->
                        <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                          <img src="/icons/play.svg" alt="Play" class="w-8 h-8" />
                        </div>
                      </div>

                      <div class="flex-1 text-left">
                        <p class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                          {(index + 1).toString().padStart(2, '0')}: {title}
                        </p>
                        <p class="text-mini-body text-light-text-tertiary">
                          {courseDetails?.Final_Module_Duration?.[index] || '0'} min
                        </p>
                      </div>
                    </button>
                  </div>
                {/each}
              {:else}
                <div class="p-4 text-center text-light-text-tertiary">
                  No modules available
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Floating Action Buttons -->
{#if !isEnrolled && !isCreator}
  <div class="fixed bottom-[80px] left-0 right-0 px-4 z-50 lg:hidden">
    <div class="container mx-auto max-w-[430px] flex flex-col gap-4">
      <!-- Enroll button -->
      <button 
        class="w-full flex items-center justify-center gap-2 h-[52px] bg-Green text-white rounded-[100px] hover:bg-GreenHover transition-colors shadow-lg disabled:opacity-50"
        on:click={handleEnroll}
        disabled={enrolling}
      >
        {#if enrolling}
          <span class="text-semibody-medium">Enrolling...</span>
        {:else}
          <span class="text-semibody-medium">Enroll</span>
          <img src="/icons/arrow-right-white.svg" alt="Enroll" class="w-6 h-6" />
        {/if}
      </button>

      <!-- Bookmark button -->
      <button
        class="w-full flex items-center justify-center gap-2 h-[52px] bg-white border border-Green text-Green rounded-[100px] hover:bg-Green/5 transition-colors disabled:opacity-50"
        on:click={handleBookmark}
        disabled={bookmarking}
      >
        {#if bookmarking}
          <span class="text-semibody-medium">Processing...</span>
        {:else}
          <img 
            src={isBookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"} 
            alt="Bookmark" 
            class="w-6 h-6" 
          />
          <span class="text-semibody-medium">
            {isBookmarked ? 'Bookmarked' : 'Bookmark Course'}
          </span>
        {/if}
      </button>
    </div>
  </div>
{/if}

<style>
  .video-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  }
</style>
