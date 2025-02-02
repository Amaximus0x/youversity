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
  } from "$lib/firebase";
  import { browser } from '$app/environment';

  // Initialize states with null to indicate not loaded yet
  let courseDetails: any = null;
  let loading = true;
  let error: string | null = null;
  let isCreator: boolean | null = null;
  let isEnrolled: boolean | null = null;
  let showProgress: boolean | null = null;
  let isBookmarked: boolean | null = null;
  let hasLiked: boolean | null = null;

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

  // Load saved state from localStorage
  function loadSavedState() {
    if (browser) {
      const savedState = localStorage.getItem(`course_${$page.params.id}_state`);
      if (savedState) {
        const state = JSON.parse(savedState);
        // Only set states if they're not already set from server
        if (isCreator === null) isCreator = state.isCreator;
        if (isEnrolled === null) isEnrolled = state.isEnrolled;
        if (showProgress === null) showProgress = state.showProgress;
        if (isBookmarked === null) isBookmarked = state.isBookmarked;
        if (hasLiked === null) hasLiked = state.hasLiked;
      }
    }
  }

  // Save state to localStorage
  function saveState(updates = {}) {
    if (browser) {
      const currentState = {
        isCreator,
        isEnrolled,
        showProgress,
        isBookmarked,
        hasLiked,
        ...updates // Allow updating specific states
      };
      localStorage.setItem(
        `course_${$page.params.id}_state`,
        JSON.stringify(currentState)
      );
    }
  }

  // Load saved state initially
  loadSavedState();

  // Watch for state changes and save them
  $: if (isCreator !== null && isEnrolled !== null && showProgress !== null) {
    saveState();
  }

  onMount(async () => {
    try {
      if ($user) {
        // Get course data first
        const courseData = await getUserCourse($user.uid, $page.params.id);
        courseDetails = courseData;

        // Set server states
        const serverStates = {
          isCreator: Boolean(courseData.isCreator),
          isEnrolled: Boolean(courseData.isEnrolled),
          showProgress: Boolean(courseData.isEnrolled || courseData.isCreator)
        };

        // Get bookmark and like status
        try {
          const [bookmarkStatus, likeStatus] = await Promise.all([
            checkBookmarkStatus($user.uid, $page.params.id),
            hasLikedCourse($user.uid, $page.params.id)
          ]);
          
          serverStates.isBookmarked = bookmarkStatus;
          serverStates.hasLiked = likeStatus;
        } catch (statusError) {
          console.error("Error checking status:", statusError);
        }

        // Now load saved state, but only if server states aren't set
        if (!localStorage.getItem(`course_${$page.params.id}_state`)) {
          // If no saved state, use server states
          isCreator = serverStates.isCreator;
          isEnrolled = serverStates.isEnrolled;
          showProgress = serverStates.showProgress;
          isBookmarked = serverStates.isBookmarked;
          hasLiked = serverStates.hasLiked;
          
          // Save initial server state
          saveState();
        } else {
          // Load saved state
          loadSavedState();
        }

        // Get enrollment progress if needed
        if (courseData.enrollmentData) {
          enrollmentProgress = courseData.enrollmentData;
        } else if (isEnrolled) {
          enrollmentProgress = await getEnrollmentProgress($user.uid, $page.params.id);
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
        isCreator = false;
        isEnrolled = false;
        showProgress = false;
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

      // Update local state and save
      isEnrolled = true;
      showProgress = true;
      saveState({ isEnrolled: true, showProgress: true });

      // Initialize enrollment progress
      enrollmentProgress = {
        userId: $user.uid,
        courseId: $page.params.id,
        completedModules: [],
        moduleProgress: Array(courseDetails?.Final_Module_Title.length).fill(null),
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

    try {
      bookmarking = true;
      const newBookmarkState = await toggleBookmark($user.uid, $page.params.id);
      isBookmarked = newBookmarkState;
      saveState({ isBookmarked: newBookmarkState });
    } catch (error) {
      console.error("Error bookmarking course:", error);
    } finally {
      bookmarking = false;
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
        courseDetails.likes = (courseDetails.likes || 0) + (newLikeState ? 1 : -1);
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

  // Clean up when leaving the page
  onDestroy(() => {
    if (browser) {
      localStorage.removeItem(`course_${$page.params.id}_state`);
    }
    courseDetails = null;
    isCreator = null;
    isEnrolled = null;
    showProgress = null;
    enrollmentProgress = null;
    currentModuleStore.reset();
  });

  // Update the module card styling
  $: activeModuleClass = (index: number) => 
    $currentModuleStore === index ? "bg-[rgba(66,193,200,0.1)]" : "";
</script>

<!-- Main Container -->
<div class="w-full min-h-screen pt-0 overflow-x-hidden">
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
            <div
              class="fixed lg:relative top-[86px] lg:top-0 left-0 right-0 z-30 bg-black aspect-video"
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
          </div>

          <!-- Course Info Section -->
          <div
            class="mt-[calc(56.25vw+24px)] lg:mt-8"
            bind:this={contentStartElement}
          >
            <!-- Course Module Title -->
            <div class="mb-4">
              <h4 class="text-h4-medium text-Black">
                <span class="text-h4-medium text-Black2"
                  >{($currentModuleStore + 1).toString().padStart(2, "0")}</span
                >: {courseDetails.Final_Module_Title[$currentModuleStore] ||
                  "Loading module..."}
              </h4>
            </div>

            <!-- Stats Section -->
            <div class="flex items-center gap-4">
              <!-- Upvotes -->
              <button
                class="flex items-center gap-2 bg-Black/5 px-2 py-2 rounded-2xl hover:opacity-80 transition-opacity disabled:opacity-50"
                on:click={handleLike}
                disabled={liking}
              >
                <img
                  src={hasLiked
                    ? "/icons/upvote-filled.svg"
                    : "/icons/upvote.svg"}
                  alt="Upvotes"
                  class="w-5 h-5"
                />
                <span
                  class={hasLiked
                    ? "text-semibody-medium text-Black"
                    : "text-semibody text-Black2 hover:text-Black"}
                >
                  {formatNumber(courseDetails?.likes || 0)} Upvotes
                </span>
              </button>

              <!-- Views -->
              <div class="flex items-center gap-2">
                <img src="/icons/view.svg" alt="Views" class="w-5 h-5" />
                <span class="text-semibody-medium text-light-text-secondary">
                  {formatNumber(courseDetails?.views || 0)} views
                </span>
              </div>
            </div>

            <!-- Creator Info with Bookmark Button -->
            <div class="flex items-center justify-between mt-4">
              <!-- Creator Info -->
              <div class="flex items-center gap-3">
                <div>
                  {#if creatorProfile?.photoURL}
                    <img
                      src={creatorProfile.photoURL}
                      alt="Creator"
                      class="w-12 h-12 rounded-full object-cover"
                    />
                  {:else}
                    <div
                      class="w-12 h-12 rounded-full bg-Black/5 flex items-center justify-center"
                    >
                      <span class="text-[#2A4D61] font-medium">
                        {(
                          creatorProfile?.username?.[0] ||
                          creatorProfile?.displayName?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </span>
                    </div>
                  {/if}
                </div>

                <div>
                  <p
                    class="text-semi-body text-light-text-tertiary dark:text-dark-text-tertiary"
                  >
                    <span
                      class="text-body-semibold text-light-text-primary dark:text-dark-text-primary"
                      >Creator:</span
                    >
                    {creatorProfile?.username ||
                      creatorProfile?.displayName ||
                      "Unknown Creator"}
                  </p>
                  <div class="self-stretch text-[#a2a2a2] text-mini-body">
                    {new Date(
                      courseDetails.createdAt?.toDate?.() ||
                        courseDetails.createdAt ||
                        Date.now(),
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <!-- Bookmark Button -->
              {#if !isCreator}
                <div class="block lg:hidden">
                  <button
                    class="flex p-2 items-center justify-center rounded-2xl bg-Black/5 hover:bg-Black/5 transition-colors disabled:opacity-50"
                    on:click={handleBookmark}
                    disabled={bookmarking}

                    aria-label={isBookmarked
                      ? "Remove bookmark"
                      : "Add bookmark"}
                  >
                    {#if bookmarking}
                      <div
                        class="w-6 h-6 border-2 border-Green border-t-transparent rounded-full animate-spin"
                      ></div>
                    {:else}
                      <img
                        src={isBookmarked
                          ? "/icons/bookmark-filled.svg"
                          : "/icons/bookmark.svg"}
                        alt="Bookmark"
                        class="w-6 h-6"
                      />
                    {/if}
                  </button>
                </div>
              {/if}
            </div>

            <!-- Module Content -->
            <div class="mt-6">
              <!-- Course Title -->
              <div class="mt-6 ">
                <p class="text-h2-mobile lg:text-h2 text-Black">


                  {courseDetails?.Final_Course_Title}
                </p>
              </div>
              <!-- Course Introduction - Show for first module when not enrolled or is creator -->
              {#if $currentModuleStore === 0 && (!isEnrolled || isCreator)}
                <div class="mt-6 ">
                  <h3 class="text-h4-medium text-Black mb-4">Course Introduction</h3>
                  <p class="text-body text-light-text-secondary">
                    {courseDetails?.Final_Course_Introduction}
                  </p>
                </div>
              {/if}

              <!-- Course Objectives - Show for first module when not enrolled or is creator -->
              {#if $currentModuleStore === 0 && (!isEnrolled || isCreator)}
                <div class="mt-6">
                  <h3 class="text-h4-medium text-Black mb-4">Course Objective</h3>
                  <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
                    {courseDetails?.Final_Course_Objective}
                  </p>
                </div>
              {/if}

              <!-- Module Objective - Show for all modules -->
              <div class="mt-6">
                <h3 class="text-h4-medium text-Black mb-4">Module Objective</h3>
                <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
                  {courseDetails?.Final_Module_Objective[$currentModuleStore] || "Loading module..."}
                </p>
              </div>

              <!-- Course Conclusion - Show only for last module when completed -->
              {#if $currentModuleStore === courseDetails.Final_Module_Title.length - 1 && hasCompletedAllModules()}
                <div class="mt-6 p-6 bg-[#F5F5F5] rounded-2xl">
                  <h3 class="text-h4-medium text-Black mb-4">Course Conclusion</h3>
                  <p class="text-body text-light-text-secondary">
                    {courseDetails?.Final_Course_Conclusion}
                  </p>
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
                </div>
              {/if}
            </div>

            <!-- Move Reviews Section after Course Conclusion for mobile -->
            <div class="lg:hidden">
              <!-- Course Progress and Modules for mobile -->
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
              <div
                class="mt-6 border border-light-border dark:border-dark-border rounded-3xl overflow-hidden"
              >
                <div>
                  <h3
                    class="text-body-semibold text-Black p-2 border-b border-light-border dark:border-dark-border bg-BackgroundRed"
                  >
                    Course Module
                  </h3>
                </div>

                <div class="p-2 space-y-2.5">
                  <!-- Course Modules List -->
                  {#if courseDetails?.Final_Module_Title?.length > 0}
                    {#each courseDetails.Final_Module_Title as title, index}
                      <div
                        class="p-2 rounded-2xl border border-light-border hover:bg-Black/5 dark:hover:bg-Black/5 transition-colors duration-200 {activeModuleClass(index)}"
                      >
                        <button
                          class="w-full flex items-start gap-4"
                          on:click={() => {
                            currentModuleStore.set(index);
                            if (typeof currentModule !== "undefined") {
                              currentModule = index;
                            }
                          }}
                        >
                          <!-- Module Info -->
                          <div class="flex-1 min-w-0 text-left">
                            <p class="text-semibody-medium text-Black mb-2 inline-block">
                              <span class="text-semibody-medium text-Black2">
                                {(index + 1).toString().padStart(2, "0")}:
                              </span>
                              
                                {title}
                            
                            </p>
                            <p class="text-mini-body text-light-text-tertiary">
                              {courseDetails?.Final_Module_Video_Duration?.[
                                index
                              ] || "0"} min
                            </p>
                          </div>

                          <!-- Thumbnail Container -->
                          <div class="relative w-[30%] max-w-[139px] aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-black/5">
                            {#if courseDetails?.Final_Module_Thumbnails?.[index]}
                              <img
                                src={courseDetails.Final_Module_Thumbnails[
                                  index
                                ]}
                                alt="Video Thumbnail"
                                class="absolute inset-0 w-full h-full object-cover"
                              />
                            {:else}
                              <div class="absolute inset-0 flex items-center justify-center bg-black/5">
                                <img
                                  src="/icons/youtube.svg"
                                  alt="Video"
                                  class="w-8 h-8"
                                />
                              </div>
                            {/if}
                            <!-- Play Button Overlay -->
                            <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                              <img
                                src="/icons/youtube-icon.svg"
                                alt="Play"
                                class="w-8 h-8"
                              />
                            </div>
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

              <!-- Reviews Section for mobile -->
              {#if courseDetails.isPublic}
                <div class="w-full mt-6">
                  <CourseRatings courseId={$page.params.id} />
                </div>
              {/if}
            </div>

            <!-- Desktop Reviews Section -->
            <div class="hidden lg:block">
              <!-- Desktop Action Buttons -->
              <div class="mt-6 flex flex-col gap-3">
                {#if !isEnrolled && !isCreator}
                  <!-- Enroll button -->
                  <button
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium bg-Green text-white rounded-2xl hover:bg-GreenHover transition-opacity"
                    on:click={handleEnroll}
                    disabled={enrolling}
                  >
                    {#if enrolling}
                      <span>Enrolling...</span>
                    {:else}
                      <span>Enroll</span>
                    {/if}
                  </button>
                {/if}

                <!-- Bookmark button -->
                <button
                  class="w-full px-4 py-2 text-semibody-medium flex items-center justify-center bg-Black/5 text-Green rounded-2xl hover:bg-Black/5 transition-colors"
                  on:click={handleBookmark}
                  disabled={bookmarking}
                >
                  {#if bookmarking}
                    <span>Processing...</span>
                  {:else}
                    <span>{isBookmarked ? "Remove Bookmark" : "Bookmark Course"}</span>
                  {/if}
                </button>
              </div>

              <!-- Reviews Section -->
              {#if courseDetails.isPublic}
                <div class="w-full mt-6">
                
                  <CourseRatings courseId={$page.params.id} />
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Right Column - Progress and Modules -->
        <div class="hidden lg:block w-full lg:col-span-4">
          <!-- Progress Section -->
          {#if showProgress && $user && (isCreator || isEnrolled)}
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
          {/if}
          <!-- Course Modules Section -->

          <div
                class=" border border-light-border dark:border-dark-border rounded-3xl overflow-hidden"
              >
                <div>
                  <h3
                    class="text-body-semibold text-Black p-2 border-b border-light-border dark:border-dark-border bg-BackgroundRed"
                  >
                    Course Module
                  </h3>
                </div>

                <div class="p-2 space-y-2.5">
                  <!-- Course Modules List -->
                  {#if courseDetails?.Final_Module_Title?.length > 0}
                    {#each courseDetails.Final_Module_Title as title, index}
                      <div
                        class="p-2 rounded-2xl border border-light-border hover:bg-Black/5 dark:hover:bg-Black/5 transition-colors duration-200 {activeModuleClass(index)}"
                      >
                        <button
                          class="w-full flex items-center gap-4"
                          on:click={() => {
                            currentModuleStore.set(index);
                            if (typeof currentModule !== "undefined") {
                              currentModule = index;
                            }
                          }}
                        >
                          <!-- Module Info -->
                          <div class="flex-1 min-w-0 text-left inline-block">
                            <p class="text-semibody-medium text-Black mb-2">
                              <span class="text-semibody-medium text-Black2">
                                {(index + 1).toString().padStart(2, "0")}:
                              </span>
                              {title}
                            </p>
                            <p class="text-mini-body text-light-text-tertiary">
                              {courseDetails?.Final_Module_Video_Duration?.[
                                index
                              ] || "0"} min
                            </p>
                          </div>

                          <!-- Thumbnail Container -->
                          <div class="relative w-[30%] max-w-[139px] aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-black/5">
                            {#if courseDetails?.Final_Module_Thumbnails?.[index]}
                              <img
                                src={courseDetails.Final_Module_Thumbnails[
                                  index
                                ]}
                                alt="Video Thumbnail"
                                class="absolute inset-0 w-full h-full object-cover"
                              />
                            {:else}
                              <div class="absolute inset-0 flex items-center justify-center bg-black/5">
                                <img
                                  src="/icons/youtube.svg"
                                  alt="Video"
                                  class="w-8 h-8"
                                />
                              </div>
                            {/if}
                            <!-- Play Button Overlay -->
                            <div class="absolute inset-0 flex items-center justify-center bg-black/20">
                              <img
                                src="/icons/youtube-icon.svg"
                                alt="Play"
                                class="w-8 h-8"
                              />
                            </div>
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

<!-- Update the Floating Action Button -->
{#if !isEnrolled && !isCreator}
  <div
    class="fixed bottom-0 left-0 right-0 pb-36 pt-4 z-[100] lg:hidden transition-opacity duration-300"
    class:opacity-0={!showFloatingButton}
    class:pointer-events-none={!showFloatingButton}
  >
    <div class="container mx-auto pl-5">
      <!-- Enroll button -->
      <button
        class="px-4 py-2 flex items-center justify-center gap-4 bg-Green text-white rounded-2xl transition-opacity disabled:opacity-50 text-semibody-medium shadow-lg"
        on:click={handleEnroll}
        disabled={enrolling}
      >
        {#if enrolling}
          <span>Enrolling...</span>
        {:else}
          <span>Enroll</span>
          <img
            src="/icons/arrow-right-white.svg"
            alt="Enroll"
            class="w-6 h-6"
          />
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
