<script lang="ts">
  import { page } from "$app/stores";
  import { onMount, onDestroy } from "svelte";
  import { user } from "$lib/stores/auth";
  import { goto } from "$app/navigation";
  import { currentModuleStore } from "$lib/stores/course";
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

  // Initialize states with null to indicate not loaded yet
  let courseDetails: any = null;
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

  // Load saved state from localStorage
  function loadSavedState() {
    if (browser) {
      const savedState = localStorage.getItem(
        `course_${$page.params.id}_state`,
      );
      if (savedState) {
        const state = JSON.parse(savedState);
        // Only load states that can change
        isEnrolled = state.isEnrolled ?? false;
        showProgress = state.showProgress ?? false;
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
      localStorage.setItem(
        `course_${$page.params.id}_state`,
        JSON.stringify(currentState),
      );
    }
  }

  // Load saved state initially
  loadSavedState();

  // Watch for state changes and save them
  $: if (isEnrolled !== null && showProgress !== null) {
    saveState();
  }

  onMount(async () => {
    try {
      if ($user) {
        // Get course data first
        const courseData = await getUserCourse($user.uid, $page.params.id);
        courseDetails = courseData;
        console.log("User Course Details", courseDetails);

        // Set creator status once (won't change)
        isCreator = Boolean(courseData.isCreator);

        // Get current server states
        const [enrollmentStatus, bookmarkStatus, likeStatus] =
          await Promise.all([
            getEnrollmentStatus($user.uid, $page.params.id),
            checkBookmarkStatus($user.uid, $page.params.id),
            hasLikedCourse($user.uid, $page.params.id),
          ]);

        // Set states from server
        isEnrolled = enrollmentStatus.isEnrolled;
        showProgress = isEnrolled || isCreator;
        isBookmarked = bookmarkStatus;
        hasLiked = likeStatus;

        // Save initial state
        saveState();

        // Get enrollment progress if needed
        if (enrollmentStatus.enrollmentData) {
          enrollmentProgress = enrollmentStatus.enrollmentData;
        } else if (isEnrolled) {
          enrollmentProgress = await getEnrollmentProgress(
            $user.uid,
            $page.params.id,
          );
        }

        // Fetch creator profile
        if (courseDetails?.createdBy) {
          try {
            creatorProfile = await getUserProfile(courseDetails.createdBy);
          } catch (profileError) {
            console.error("Error fetching creator profile:", profileError);
          }
        }

        // Save the updated state
        saveState();
      } else {
        courseDetails = await getSharedCourse($page.params.id);
        console.log("Shared Course Details", courseDetails);
        isCreator = false;
        isEnrolled = false;
        showProgress = false;
        // Set initial module to introduction for non-enrolled users
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

      // Update states and save to localStorage
      const newState = {
        isEnrolled: true,
        showProgress: true,
        isBookmarked,
        hasLiked,
      };

      // Update local states
      isEnrolled = true;
      showProgress = true;

      // Save to localStorage
      if (browser) {
        localStorage.setItem(
          `course_${$page.params.id}_state`,
          JSON.stringify(newState),
        );
      }

      // Initialize enrollment progress
      enrollmentProgress = {
        userId: $user.uid,
        courseId: $page.params.id,
        completedModules: [],
        moduleProgress: Array(courseDetails?.Final_Module_Title.length).fill(
          null,
        ),
        isCompleted: false,
        enrolledAt: new Date(),
        lastAccessedAt: new Date(),
      };
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
    // Only cleanup if we're navigating away from the course page
    if (browser && $page.url.pathname !== currentPath) {
      localStorage.removeItem(`course_${$page.params.id}_state`);
      courseDetails = null;
      isEnrolled = false;
      showProgress = false;
      enrollmentProgress = null;
      currentModuleStore.reset();
    }
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
      showProgress = false;

      // Save updated state
      saveState({
        isEnrolled: false,
        showProgress: false,
      });

      // Show success message or handle UI updates
      console.log("Successfully unenrolled from course");
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
                {:else}
                  <span class="text-h4-medium text-Black2"
                    >{($currentModuleStore + 1)
                      .toString()
                      .padStart(2, "0")}</span
                  >: {courseDetails.Final_Module_Title[$currentModuleStore] ||
                    "Loading module..."}
                {/if}
              </h4>
            </div>

            <!-- Creator Info with Bookmark and Share Button -->
            <CourseHeader
              {courseDetails}
              {creatorProfile}
              {isCreator}
              {isBookmarked}
              {hasLiked}
              {liking}
              {showShareModal}
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
                  <div class="mt-6 mb-2">
                    <p class="text-h2-mobile lg:text-h2 text-Black">
                      {courseDetails?.Final_Course_Title}
                    </p>
                  </div>

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
                    <p class="text-h2-mobile lg:text-h2 text-Black">
                      {courseDetails?.Final_Course_Title}
                    </p>
                  </div>

                  <h3 class="text-h4-medium text-Black mb-4">
                    Course Conclusion
                  </h3>
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
                </div>
              {:else}
                <!-- Regular Module Content -->
                <div>
                  <!-- Course Title -->
                  <div class="mt-6">
                    <p class="text-h2-mobile lg:text-h2 text-Black">
                      {courseDetails?.Final_Course_Title}
                    </p>
                  </div>

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
            <div class="lg:hidden">
              <!-- Course Enrollment Progress for mobile -->
              {#if showProgress && $user && (isCreator || isEnrolled)}
                <div
                  class="mt-6 rounded-2xl border border-light-border dark:border-dark-border"
                >
                  <h3
                    class="text-body-semibold border-b border-light-border dark:border-dark-border p-2 text-light-text-primary dark:text-dark-text-primary mb-4"
                  >
                    Your Progress
                  </h3>

                  <div class="flex items-center gap-4 px-2 pb-2">
                    <div
                      class="flex-1 h-3 bg-black/[0.05] rounded-[2000px] overflow-hidden"
                    >
                      <div
                        class="h-full bg-brand-turquoise rounded-[200000px] transition-all duration-300"
                        style="width: {isCreator
                          ? (moduleProgress.filter((m) => m?.completed).length /
                              courseDetails.Final_Module_Title.length) *
                            100
                          : ((enrollmentProgress?.completedModules?.length ||
                              0) /
                              courseDetails.Final_Module_Title.length) *
                            100}%"
                      />
                    </div>
                    <span
                      class="text-body text-light-text-primary dark:text-dark-text-primary"
                    >
                      {isCreator
                        ? moduleProgress.filter((m) => m?.completed).length
                        : enrollmentProgress?.completedModules?.length ||
                          0}/{courseDetails.Final_Module_Title.length}
                    </span>
                  </div>
                </div>
              {/if}

              <!-- Course Modules for mobile -->

              <!-- Reviews Section for mobile -->
              {#if courseDetails.isPublic}
                <div class="w-full mt-6">
                  <CourseRatings
                    courseId={$page.params.id}
                    showReadAll={true}
                  />
                </div>
              {/if}
            </div>

            <!-- Desktop Reviews Section -->
            <div class="hidden lg:block">
              <!-- Desktop Action Buttons -->
              <div class="mt-6 flex flex-col gap-3">
                <!-- Enroll/Start button -->
                {#if !isEnrolled && !isCreator}
                  <button
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors {isEnrolled
                      ? 'bg-brand-red hover:bg-ButtonHover text-white'
                      : 'bg-Green hover:bg-GreenHover text-white'}"
                    on:click={isEnrolled
                      ? () => goto(`/course/${$page.params.id}/learn`)
                      : handleEnroll}
                    disabled={enrolling}
                  >
                    {#if enrolling}
                      <span>Enrolling...</span>
                    {:else}
                      <span>{isEnrolled ? "Start Course" : "Enroll"}</span>
                      <img
                        src="/icons/arrow-right-white.svg"
                        alt={isEnrolled ? "Start" : "Enroll"}
                        class="w-6 h-6 ml-2"
                      />
                    {/if}
                  </button>
                {/if}

                <!-- Finish Course Button -->
                {#if (isEnrolled || isCreator) && $currentModuleStore === courseDetails?.Final_Module_Title?.length}
                  <button
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors {isEnrolled
                      ? 'bg-brand-red hover:bg-ButtonHover text-white'
                      : 'bg-Green hover:bg-GreenHover text-white'}"
                    on:click={isEnrolled
                      ? () => goto(`/course/${$page.params.id}/learn`)
                      : handleEnroll}
                    disabled={enrolling}
                  >
                    <span>{isEnrolled ? "Finish Course" : "Completed"}</span>
                  </button>
                {/if}

                <!-- Bookmark button -->
                <button
                  class="w-full px-4 py-2 text-semibody-medium flex items-center justify-center gap-2 bg-Black/5 text-Green rounded-2xl hover:bg-Black/5 transition-colors"
                  on:click={handleBookmark}
                >
                  <span>{isBookmarked ? "Bookmarked" : "Bookmark Course"}</span>
                </button>
              </div>

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
          <!-- Progress Section -->
          <!-- {#if showProgress && $user && (isCreator || isEnrolled)}
            <div
              class="mb-4 rounded-2xl border border-light-border dark:border-dark-border"
            >
              <h3
                class="text-body-semibold border-b border-light-border dark:border-dark-border p-2 text-light-text-primary dark:text-dark-text-primary mb-4"
              >
                Your Progress
              </h3>

              <div class="flex items-center gap-4 px-2 pb-2">
                <div
                  class="flex-1 h-3 bg-black/[0.05] rounded-[2000px] overflow-hidden"
                >
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
                <span
                  class="text-body text-light-text-primary dark:text-dark-text-primary"
                >
                  {isCreator
                    ? moduleProgress.filter((m) => m?.completed).length
                    : enrollmentProgress?.completedModules?.length ||
                      0}/{courseDetails.Final_Module_Title.length}
                </span>
              </div>
            </div>
          {/if} -->
          <!-- Course Modules Section -->

          <CourseModuleList
            {courseDetails}
            {isCreator}
            {isEnrolled}
            showProgress={true}
            completedModules={isCreator
              ? moduleProgress
                  .map((m, i) => (m?.completed ? i : -1))
                  .filter((i) => i !== -1)
              : enrollmentProgress?.completedModules || []}
            bind:currentModule
          />
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Update the Floating Action Button -->
<!-- {#if !isEnrolled && !isCreator} -->
<div
  class="fixed bottom-0 left-0 right-0 pb-36 pt-4 z-[60] lg:hidden transition-opacity duration-300"
  class:opacity-0={!showFloatingButton}
  class:pointer-events-none={!showFloatingButton}
>
  <div class="container mx-auto pl-5">
    <button
      class="px-8 py-2 flex items-center justify-center gap-2 text-white rounded-2xl transition-opacity disabled:opacity-50 text-semibody-medium shadow-lg {isEnrolled
        ? 'bg-brand-red'
        : 'bg-Green'}"
      on:click={isEnrolled
        ? () => goto(`/course/${$page.params.id}/learn`)
        : handleEnroll}
      disabled={enrolling}
    >
      {#if enrolling}
        <span>Enrolling...</span>
      {:else}
        <span>{isEnrolled ? "Continue" : "Enroll"}</span>
        <img
          src="/icons/arrow-right-white.svg"
          alt={isEnrolled ? "Continue" : "Enroll"}
          class="w-6 h-6"
        />
      {/if}
    </button>
  </div>
</div>
<!-- {/if} -->

<!-- Move the mobile version to a conditional render -->
<!-- Remove Course Button - Mobile -->
{#if isEnrolled && $user}
  <div class="lg:hidden mt-6 pb-20">
    <button
      class="w-full px-4 py-2 flex items-center justify-center gap-2 border border-[#FF0000] hover:bg-[#FF0000]/5 text-[#FF0000] rounded-2xl transition-colors disabled:opacity-50"
      on:click={handleRemoveCourseEnrollment}
      disabled={removing}
    >
      {#if removing}
        <span class="text-semibody-medium">Removing Enrollment...</span>
      {:else}
        <span class="text-semibody">Remove Course</span>
        <img src="/icons/delete.svg" alt="Remove" class="w-6 h-6" />
      {/if}
    </button>
  </div>
{/if}

<!-- Add the ShareModal component at the bottom of the template, just before the style tag -->
<ShareModal
  show={showShareModal}
  courseId={$page.params.id}
  onClose={() => (showShareModal = false)}
/>

<style>
  .video-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  }
</style>
