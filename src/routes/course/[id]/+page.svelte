<script lang="ts">
  import { page } from "$app/stores";
  import { onMount, onDestroy } from "svelte";
  import { user } from "$lib/stores/auth";
  import { goto } from "$app/navigation";
  import { currentModuleStore, enrollmentProgressStore } from "$lib/stores/course";
  import { getUserProfile } from "$lib/services/profile";
  import CourseRatings from "$lib/components/CourseRatings.svelte";
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
    removeEnrollment,
  } from "$lib/firebase";
  import { browser } from "$app/environment";
  import ShareModal from "$lib/components/ShareModal.svelte";
  import CourseModuleList from "$lib/components/CourseModuleList.svelte";
  import CourseHeader from "$lib/components/CourseHeader.svelte";
  import type { FinalCourseStructure, Quiz, QuizResult, EnrollmentProgress } from "$lib/types/course";
  import ModuleQuizModal from "./quiz/ModuleQuizModal.svelte";
  import { quizStore } from "$lib/stores/quiz";

  // Initialize states with null to indicate not loaded yet
  let courseDetails: FinalCourseStructure | null = null;
  let loading = true;
  let error: string | null = null;
  let isCreator = false; // This won't change after initial set
  let isEnrolled = false;
  let showProgress = false;
  let isBookmarked = false;
  let hasLiked = false;

  // Other state variables
  let moduleProgress: { completed?: boolean }[] = [];
  let enrollmentProgress: any = null;
  let currentModule: number | undefined;
  let enrolling = false;
  let bookmarking = false;
  let creatorProfile: any = null;
  let liking = false;
  let showFloatingButton = false;
  let contentStartElement: HTMLElement;

  // Add this at the top of your script
  let currentPath = $page.url.pathname;

  // Add state for remove operation
  let removing = false;

  // Add this line after the state variables
  let initialModuleSet = false;

  // Add this state variable with other state variables
  let showShareModal = false;

  // Add this state variable with other state variables
  let showNewQuizPage = false;
  let currentQuiz: Quiz | null = null;
  let quizModuleTitle = "";

  let isMobile = false;

  // Load saved state from localStorage
  function loadSavedState() {
    if (browser) {
      const savedState = localStorage.getItem(
        `course_${$page.params.id}_state`,
      );
      if (savedState) {
        const state = JSON.parse(savedState);
        // Only load non-critical states from localStorage
        isBookmarked = state.isBookmarked ?? false;
        hasLiked = state.hasLiked ?? false;
      }
    }
  }

  // Save state to localStorage
  function saveState(updates = {}) {
    if (browser) {
      const currentState = {
        isEnrolled,
        showProgress,
        isBookmarked,
        hasLiked,
        ...updates,
      };
      // Only save if we have valid enrollment status
      if (isEnrolled !== null && isEnrolled !== undefined) {
        localStorage.setItem(
          `course_${$page.params.id}_state`,
          JSON.stringify(currentState),
        );
      }
    }
  }

  // Load saved state initially
  loadSavedState();

  // Watch for state changes and save them
  $: if (isEnrolled !== null && isEnrolled !== undefined) {
    saveState();
  }

  onMount(async () => {
    try {
      // Reset enrollment progress store before loading new course data
      enrollmentProgressStore.set(null);

      if ($user) {
        // Get enrollment status first
        const enrollmentStatus = await getEnrollmentStatus($user.uid, $page.params.id);
        
        // Set enrollment status immediately
        isEnrolled = enrollmentStatus.isEnrolled;
        
        // Then get course data
        const courseData = await getUserCourse($user.uid, $page.params.id);
        console.log("courseData", courseData);
        if (!courseData) {
          throw new Error('Course not found');
        }

        courseDetails = courseData as FinalCourseStructure;
        isCreator = courseData.isCreator;
        
        showProgress = enrollmentStatus.isEnrolled || courseData.isCreator;

        // If enrolled, get progress immediately
        if (isEnrolled) {
          const progress = await getEnrollmentProgress($user.uid, $page.params.id);
          enrollmentProgress = progress as EnrollmentProgress;
          enrollmentProgressStore.set(progress as EnrollmentProgress);
        }

        // Save initial server state
        saveState();

        // Get current server states
        const [bookmarkStatus, likeStatus] = await Promise.all([
          checkBookmarkStatus($user.uid, $page.params.id),
          hasLikedCourse($user.uid, $page.params.id)
        ]);

        isBookmarked = bookmarkStatus;
        hasLiked = likeStatus;

        // Fetch creator profile if needed
        if (courseDetails?.createdBy) {
          creatorProfile = await getUserProfile(courseDetails.createdBy);
        }

      } else {
        // Handle non-logged-in user
        courseDetails = await getSharedCourse($page.params.id);
        isCreator = false;
        isEnrolled = false;
        showProgress = false;
        
        if (!initialModuleSet) {
          currentModuleStore.set(-1);
          initialModuleSet = true;
        }
      }
    } catch (err) {
      console.error("Error:", err);
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  });

  // Helper function to check if all modules are completed
  function hasCompletedAllModules(): boolean {
    if (!courseDetails || !moduleProgress.length) return false;

    const totalModules = courseDetails.Final_Module_Title.length;
    const completedModules = isCreator
      ? moduleProgress.filter((m) => m?.completed).length
      : enrollmentProgress?.completedModules?.length || 0;

    return completedModules === totalModules;
  }

  // Enrollment handler
  async function handleEnroll() {
    if (!$user) {
      goto("/login");
      return;
    }

    try {
      enrolling = true;
      await enrollInCourse($user.uid, $page.params.id);
      currentModuleStore.set(-1); // Start with introduction
      goto(`/course/${$page.params.id}/learn`);
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      enrolling = false;
    }
  }

  // Bookmark handler
  async function handleBookmark() {
    if (!$user) {
      goto("/login");
      return;
    }

    // Immediately update UI
    const newBookmarkState = !isBookmarked;
    isBookmarked = newBookmarkState;

    try {
      // Update in background
      await toggleBookmark($user.uid, $page.params.id);
      saveState({ isBookmarked: newBookmarkState });
    } catch (error) {
      // Revert on error
      console.error("Error bookmarking course:", error);
      isBookmarked = !newBookmarkState;
      saveState({ isBookmarked: !newBookmarkState });
    }
  }

  // Add like handler
  async function handleLike() {
    if (!$user) {
      goto("/login");
      return;
    }

    try {
      liking = true;
      const newLikeState = await likeCourse($user.uid, $page.params.id);
      hasLiked = newLikeState;
      saveState({ hasLiked: newLikeState });

      // Update local likes count
      if (courseDetails) {
        courseDetails.likes =
          (courseDetails.likes || 0) + (newLikeState ? 1 : -1);
      }
    } catch (error) {
      console.error("Error liking course:", error);
    } finally {
      liking = false;
    }
  }

  // Add this helper function in your script section
  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }

  // Add this function to handle scroll
  function handleScroll() {
    if (contentStartElement) {
      const contentStartPosition = contentStartElement.offsetTop;
      const scrollPosition = window.scrollY + window.innerHeight;
      showFloatingButton = scrollPosition > contentStartPosition;
    }
  }

  onMount(() => {
    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  // Update onDestroy
  onDestroy(() => {
    // Reset enrollment progress store when leaving the page
    enrollmentProgressStore.set(null);
  });

  // Update the module card styling
  $: activeModuleClass = (index: number) =>
    $currentModuleStore === index ? "bg-[rgba(66,193,200,0.1)]" : "";

  // Handle enrollment removal
  async function handleRemoveCourseEnrollment() {
    if (!$user) return;

    try {
      removing = true;

      // Only remove enrollment, not the course itself
      await removeEnrollment($user.uid, $page.params.id);

      // Update local state
      isEnrolled = false;
      enrollmentProgress = null;
      enrollmentProgressStore.set(null);
      showProgress = false;

      // Save updated state
      saveState({
        isEnrolled: false,
        showProgress: false,
      });

      // Show success message or handle UI updates
      console.log("Successfully unenrolled from course");
      goto(`/course/${$page.params.id}/intro`);
    } catch (error) {
      console.error("Error removing enrollment:", error);
    } finally {
      removing = false;
    }
  }

  // Add this function with other functions
  function handleShare() {
    showShareModal = true;
  }

  // Add this helper function
  function hasCompletedModuleQuiz(moduleIndex: number): boolean {
    if (!enrollmentProgress?.quizResults?.moduleQuizzes) return false;
    const quizResult: QuizResult =
      enrollmentProgress.quizResults.moduleQuizzes[moduleIndex];
    return quizResult?.completed || false;
  }

  function hasTakenFinalQuiz(): boolean {
    return enrollmentProgress?.quizResults?.finalQuiz?.completed || false;
  }

  // Subscribe to quiz store
  quizStore.subscribe(store => {
    showNewQuizPage = store.showResult;
  });

  // Update the quiz completion handler
  async function handleQuizComplete(score: number, timeSpent: number) {
    if (!$user || !courseDetails) return;

    const moduleId = $currentModuleStore;
    try {
        // Update enrollment progress with quiz result
        const updatedProgress = await updateEnrollmentQuizResult(
            $user.uid,
            courseDetails.id!,
            moduleId,
            {
                attempts: 1,
                score,
                timeSpent,
                completedAt: new Date(),
                completed: score >= 70, // Mark as completed if score is 70% or higher
                passed: score >= 70
            }
        );

        // Update module progress to mark it as completed
        if (score >= 70) {
            await updateModuleProgress($user.uid, courseDetails.id!, moduleId, {
                completed: true,
                completedAt: new Date()
            });
        }

        // Update the store with new progress
        enrollmentProgressStore.set(updatedProgress as EnrollmentProgress);

        // Update local module progress state
        moduleProgress = moduleProgress.map((module, index) => 
            index === moduleId ? { ...module, completed: score >= 70 } : module
        );

    } catch (error) {
        console.error('Error updating quiz result:', error);
    }
  }

  function handleResize() {
    isMobile = window.innerWidth < 1024;
  }

  onMount(() => {
    if (browser) {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  });

  function handleModuleQuiz() {
    if (isMobile) {
      goto(`/course/${$page.params.id}/quiz/module/${$currentModuleStore + 1}`);
    } else {
      currentQuiz = courseDetails?.Final_Module_Quiz?.[$currentModuleStore];
      quizModuleTitle = courseDetails?.Final_Module_Title?.[$currentModuleStore] || "";
      showNewQuizPage = true;
    }
  }
</script>

<!-- Main Container -->
<div class="w-full min-h-screen pt-0 pb-24 overflow-x-hidden">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise"
      ></div>
    </div>
  {:else if error}
    <div class="text-brand-red text-center p-4">{error}</div>
  {:else if courseDetails}
    <div class="w-full lg:container lg:mx-auto lg:pb-8">
      <!-- Two Column Layout -->
      <div class="w-full lg:grid lg:grid-cols-12 lg:gap-8">
        <!-- Left Column - Video and Course Info -->
        <div class="w-full lg:col-span-8">
          <!-- Video Player Container -->
          <div class="relative w-full lg:rounded-2xl overflow-hidden">
            {#if $currentModuleStore >= 0 && $currentModuleStore < courseDetails?.Final_Module_Title?.length}
              <div
                class="fixed lg:relative top-[85px] lg:top-0 left-0 right-0 z-30 bg-black aspect-video"
              >
                <div class="video-container w-full h-full">
                  {#if courseDetails?.Final_Module_YouTube_Video_URL?.length > 0 && courseDetails?.Final_Module_YouTube_Video_URL[$currentModuleStore]}
                    <iframe
                      title={courseDetails?.Final_Module_Title[
                        $currentModuleStore
                      ] || "Course Video"}
                      class="absolute inset-0 w-full h-full"
                      src={(() => {
                        try {
                          const videoUrl =
                            courseDetails.Final_Module_YouTube_Video_URL[
                              $currentModuleStore
                            ];
                          const videoId = videoUrl?.match(
                            /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i,
                          )?.[1];
                          return videoId
                            ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=0&origin=${window.location.origin}`
                            : "";
                        } catch (error) {
                          console.error("Error parsing YouTube URL:", error);
                          return "";
                        }
                      })()}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                      loading="lazy"
                    />
                  {:else}
                    <div
                      class="absolute inset-0 flex items-center justify-center bg-black/5"
                    >
                      <p class="text-light-text-tertiary">No video available</p>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Course Info Section -->
          <div
            class=" {$currentModuleStore >= 0 &&
            $currentModuleStore < courseDetails?.Final_Module_Title?.length
              ? 'mt-[calc(59vw)] lg:mt-[calc(1vw)]'
              : ''}"
            bind:this={contentStartElement}
          >
            <!-- Course Module Title -->
            <div class="mb-4">
              <h4 class="text-h4-medium text-Black">
                {#if $currentModuleStore === -1}
                  Course Introduction and Objectives
                {:else if $currentModuleStore === courseDetails?.Final_Module_Title?.length}
                  Course Conclusion
                  <!-- {:else}
                  <span class="text-h2-mobile-bold text-Black"
                    >{($currentModuleStore + 1)
                      .toString()
                      .padStart(2, "0")}</span
                  >: 
                  {courseDetails.Final_Module_Title[$currentModuleStore] ||
                    "Loading module..."} -->
                {/if}
              </h4>
              {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length}
              <div class="mt-6">
                <p class="text-h2-mobile-bold lg:text-h2-bold text-Black">
                  {courseDetails.Final_Module_Title[$currentModuleStore]}
                </p>
              </div>
              {/if}

              <!-- <div class="mt-6">
                    <p class="text-h2-mobile-bold lg:text-h2-bold text-Black">
                      {courseDetails?.Final_Course_Title}
                    </p>
                  </div> -->
            </div>

            <!-- Course Title -->
            {#if $currentModuleStore === -1}
              <div class="mt-6">
                <p class="text-h2-mobile-bold lg:text-h2-bold text-Black">
                  {courseDetails?.Final_Course_Title}
                </p>
              </div>
            {/if}

            <!-- Creator Info with Bookmark and Share Button -->
            <CourseHeader
              {courseDetails}
              {creatorProfile}
              {isCreator}
              {isBookmarked}
              {hasLiked}
              {liking}
              {showShareModal}
              {isEnrolled}
              on:like={handleLike}
              on:bookmark={handleBookmark}
              on:share={() => (showShareModal = true)}
            />

            <!-- Module Content -->
            <div class="mt-6">
              {#if $currentModuleStore === -1}
                <!-- Course Introduction and Objectives -->
                <div>
                  <!-- Add Course Title here -->
                  <!-- <div class="mt-6 mb-2">
                    <p class="text-h2-mobile-bold lg:text-h2-bold text-Black">
                      {courseDetails?.Final_Course_Title}
                    </p>
                  </div> -->

                  <!-- <h3 class="text-h4-medium text-Black mb-4">Course Introduction</h3> -->
                  <p class="text-body text-light-text-secondary">
                    {courseDetails?.Final_Course_Introduction}
                  </p>

                  <div class="mt-6">
                    <h3 class="text-h4-medium text-Black mb-4">
                      Course Objective
                    </h3>
                    <p
                      class="text-body text-light-text-secondary dark:text-dark-text-secondary"
                    >
                      {courseDetails?.Final_Course_Objective}
                    </p>
                  </div>
                </div>
              {:else if $currentModuleStore === courseDetails?.Final_Module_Title?.length}
                <!-- Course Conclusion -->
                <div>
                  <!-- Add Course Title here too -->
                  <div class="mt-6 mb-8">
                    <p class="text-h2-mobile-bold lg:text-h2-bold text-Black">
                      {courseDetails?.Final_Course_Title}
                    </p>
                  </div>
                  <p class="text-body text-light-text-secondary">
                    {courseDetails?.Final_Course_Conclusion}
                  </p>
                  {#if hasCompletedAllModules()}
                    <div class="flex items-center gap-4 mt-4">
                      <div class="flex items-center gap-2">
                        <img
                          src="/icons/check-circle.svg"
                          alt="Completed"
                          class="w-5 h-5"
                        />
                        <span class="text-semibody-medium text-Black">
                          All {courseDetails.Final_Module_Title.length} modules completed
                        </span>
                      </div>
                    </div>
                  {/if}
                  <div class="mt-6">
                  <button
                    on:click={() => {
                      goto(`/course/${$page.params.id}/quiz`);
                    }}
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green hover:bg-GreenHover text-white"
                  >
                    Take Final Quiz
                    </button>
                  </div>
                </div>
              {:else}
                <!-- Regular Module Content -->
                <div>
                  <!-- Course Title -->
                  <!-- <div class="mt-6">
                    <p class="text-h2-mobile-bold lg:text-h2-bold text-Black">
                      {courseDetails?.Final_Course_Title}
                    </p>
                  </div> -->

                  <!-- Module Objective -->
                  <div class="mt-6">
                    <h3 class="text-h4-medium text-Black mb-4">
                      Module Objective
                    </h3>
                    <p
                      class="text-body text-light-text-secondary dark:text-dark-text-secondary"
                    >
                      {courseDetails?.Final_Module_Objective[
                        $currentModuleStore
                      ] || "Loading module..."}
                    </p>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Move Reviews Section after Course Conclusion for mobile -->
            <div class="lg:hidden mt-6">
              <!-- module quiz button -->
              {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length && courseDetails?.Final_Module_Quiz?.[$currentModuleStore]}
                <div class="mt-6 flex flex-col gap-3">
                  <!-- <button
                    on:click={() => {
                      currentQuiz = courseDetails?.Final_Module_Quiz?.[$currentModuleStore];
                      quizModuleTitle = courseDetails?.Final_Module_Title?.[$currentModuleStore] || "";
                      showNewQuizPage = true;
                    }}
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green hover:bg-GreenHover text-white"
                  >
                    Take Module Quiz
                  </button> -->
                  <button
                  on:click={handleModuleQuiz}
                  class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green hover:bg-GreenHover text-white"
                >
                  Take Module Quiz
                </button>
                </div>
              {/if}


              <!-- Course Enrollment Progress for mobile -->
              {#if isEnrolled && ($currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length)}
              <div class="mt-6">
                <CourseModuleList
                  {courseDetails}
                  {isCreator}
                  {isEnrolled}
                  showProgress={true}
                  bind:currentModule
                />
              </div>
              {/if}

              <!-- Reviews Section for mobile -->
              <!-- {#if courseDetails.isPublic}
                <div class="w-full mt-6">
                  <CourseRatings
                    courseId={$page.params.id}
                    showReadAll={true}
                  />
                </div>
              {/if} -->

              <!-- Remove Course Button - Mobile -->
              {#if isEnrolled && $user}
                <div class="lg:hidden mt-6 pb-20">
                  <button
                    class="w-full px-4 py-2 flex items-center justify-center gap-2 border border-[#FF0000] hover:bg-[#FF0000]/5 text-[#FF0000] rounded-lg transition-colors disabled:opacity-50"
                    on:click={handleRemoveCourseEnrollment}
                    disabled={removing}
                  >
                    {#if removing}
                      <span class="text-semibody-medium"
                        >Removing Enrollment...</span
                      >
                    {:else}
                      <span class="text-semibody">Remove Course</span>
                      <img
                        src="/icons/delete.svg"
                        alt="Remove"
                        class="w-6 h-6"
                      />
                    {/if}
                  </button>
                </div>
              {/if}
            </div>

            <!-- Desktop Reviews Section -->
            <div class="hidden lg:block">
              <!-- Desktop Action Buttons -->
              <!-- Enroll/Start button -->
              {#if $currentModuleStore === -1}
                <div class="mt-6 flex flex-col gap-3">
                  <button
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors {isEnrolled
                      ? 'bg-brand-red hover:bg-ButtonHover text-white'
                      : 'bg-Green hover:bg-GreenHover text-white'}"
                    on:click={isEnrolled
                      ? () => {
                          // Get last accessed module from enrollment progress
                          const lastModule =
                            enrollmentProgress?.lastAccessedModule || -1;
                          currentModuleStore.set(lastModule);
                          goto(`/course/${$page.params.id}`);
                        }
                      : handleEnroll}
                    disabled={enrolling}
                  >
                    {#if enrolling}
                      <span>Enrolling...</span>
                    {:else}
                      <span>{isEnrolled ? "Continue" : "Enroll"}</span>
                      <img
                        src="/icons/arrow-right-white.svg"
                        alt={isEnrolled ? "Start" : "Enroll"}
                        class="w-6 h-6 ml-2"
                      />
                    {/if}
                  </button>
                </div>
              {/if}

              <!-- Mobile module quiz button -->
              <!-- {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length && courseDetails?.Final_Module_Quiz?.[$currentModuleStore]}
                <div class="mt-6 flex flex-col gap-3">
                  <button
                    on:click={handleModuleQuiz}
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green hover:bg-GreenHover text-white"
                  >
                    Take Module Quiz
                  </button>
                </div>
              {/if} -->

              <!-- Desktop module quiz button -->
              {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length && courseDetails?.Final_Module_Quiz?.[$currentModuleStore]}
                <div class="mt-6 flex flex-col gap-3">
                  <button
                    on:click={() => {
                      currentQuiz = courseDetails?.Final_Module_Quiz?.[$currentModuleStore];
                      quizModuleTitle = courseDetails?.Final_Module_Title?.[$currentModuleStore] || "";
                      showNewQuizPage = true;
                    }}
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green hover:bg-GreenHover text-white"
                  >
                    Take Module Quiz
                  </button>
                </div>
              {/if}

              <!-- final quiz button -->
              {#if $currentModuleStore === courseDetails?.Final_Module_Title?.length && courseDetails?.Final_Course_Quiz}
                <div class="mt-6 flex flex-col gap-3">
                  <!-- <button
                    on:click={() => {
                      currentQuiz = courseDetails?.Final_Course_Quiz;
                      quizModuleTitle = courseDetails?.Final_Course_Title || "";
                      showNewQuizPage = true;
                    }}
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green hover:bg-GreenHover text-white"
                  >
                    Take Final Quiz
                  </button> -->
                  <!-- <button
                    on:click={() => {
                      goto(`/course/${$page.params.id}/quiz`);
                    }}
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green hover:bg-GreenHover text-white"
                  >
                    Take Final Quiz
                  </button> -->
                </div>
              {/if}

              <!-- Reviews Section -->
              {#if courseDetails.isPublic}
                <div class="w-full mt-6">
                  <CourseRatings
                    courseId={$page.params.id}
                    showReadAll={true}
                  />
                </div>
              {/if}

              <!-- Remove Course Button - Desktop -->
              {#if isEnrolled && $user}
                <div class="mt-6 col-span-2">
                  <button
                    class="px-4 py-2 flex items-center justify-center gap-2 border border-[#FF0000] hover:bg-[#FF0000]/5 text-[#FF0000] rounded-lg transition-colors disabled:opacity-50"
                    on:click={handleRemoveCourseEnrollment}
                    disabled={removing}
                  >
                    {#if removing}
                      <span class="text-semibody-medium"
                        >Removing Course...</span
                      >
                    {:else}
                      <span class="text-semibody">Remove Course</span>
                      <img
                        src="/icons/delete.svg"
                        alt="Unenroll"
                        class="w-6 h-6"
                      />
                    {/if}
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Right Column - Progress and Modules -->
        <div class="hidden lg:block w-full lg:col-span-4">
          <!-- Course Modules Section -->

          <CourseModuleList
            {courseDetails}
            {isCreator}
            {isEnrolled}
            showProgress={true}
            bind:currentModule
          />
        </div>
      </div>
    </div>
  {/if}
</div>


<!-- Update the Floating Action Button -->
<!-- only show on intro Page -->
 {#if $currentModuleStore === -1}
<div
  class="fixed bottom-0 left-0 right-0 pb-36 pt-4 z-[60] lg:hidden transition-opacity duration-300"
  class:opacity-0={!showFloatingButton}
  class:pointer-events-none={!showFloatingButton}
>
  <div class="container mx-auto pl-5">
    <button
      class="px-4 py-2 flex items-center justify-center gap-2 text-white rounded-2xl transition-opacity disabled:opacity-50 text-semibody-medium shadow-lg {isEnrolled
        ? 'bg-brand-red'
        : 'bg-Green'}"
      on:click={() => {
            // Get last accessed module from enrollment progress
            const lastModule = enrollmentProgress?.lastAccessedModule || 1;
            currentModuleStore.set(lastModule);
            goto(`/course/${$page.params.id}`);
          }
          }
    >
     
        <span>Continue</span>
        <img
          src="/icons/arrow-right-white.svg"
          alt=Continue
          class="w-6 h-6"
        />
    </button>
  </div>
</div>
{/if}


<!-- Add the ShareModal component at the bottom of the template, just before the style tag -->
<ShareModal
  show={showShareModal}
  courseId={$page.params.id}
  onClose={() => (showShareModal = false)}
/>

<!-- Add the new ModuleQuizPage component -->
{#if showNewQuizPage && currentQuiz}
    <ModuleQuizModal
        quiz={currentQuiz}
        moduleIndex={$currentModuleStore}
        onClose={() => {
            showNewQuizPage = false;
            currentQuiz = null;
        }}
        onSubmit={handleQuizComplete}
    />
{/if}

<style>
  .video-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  }
</style>
