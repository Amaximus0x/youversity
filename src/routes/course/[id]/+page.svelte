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
  import { get } from "svelte/store";

  // Initialize states with null to indicate not loaded yet
  let courseDetails: FinalCourseStructure | null = null;
  let loading = true;
  let error: string | null = null;
  let isCreator = false; // This won't change after initial set
  let isEnrolled = false;
  let showProgress = false;
  let isBookmarked = false;
  let hasLiked = false;
  let isIntroPage = false;
  let isModulePage = false;
  let isCoursePage = true;
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
    console.log('Enrollment state saved:', isEnrolled);
  }

  // Subscribe to auth state changes
  user.subscribe(async (userData) => {
    console.log('Auth state changed in course page:', { userData });
    if (userData) {
      // Always reload course data when user becomes available
      await loadCourseData(userData);
    } else {
      // No user, get shared course data
      console.log('Getting shared course data');
      try {
        courseDetails = await getSharedCourse($page.params.id);
        if (courseDetails?.createdBy) {
          creatorProfile = await getUserProfile(courseDetails.createdBy);
        }
        isEnrolled = false;
        isCreator = false;
        enrollmentProgressStore.set(null);
      } catch (error) {
        console.error('Error loading shared course data:', error);
      }
    }
  });

  async function loadCourseData(userData: any) {
    loading = true;
    console.log('Loading course data with user:', userData);
    try {
      if (userData) {
        // User is authenticated, get full course data
        const courseData = await getUserCourse(userData.uid, $page.params.id);
        console.log('Got course data:', courseData);
        courseDetails = courseData;
        
        // Ensure these are set based on actual values from the course data
        isEnrolled = courseData.isEnrolled || false;
        isCreator = courseData.isCreator || false;

        if (courseData.createdBy) {
          creatorProfile = await getUserProfile(courseData.createdBy);
          console.log('Got creator profile:', creatorProfile);
        }

        // Load enrollment progress if enrolled
        if (isEnrolled) {
          const progress = await getEnrollmentProgress(userData.uid, $page.params.id);
          console.log('Got enrollment progress:', progress);
          if (progress) {
            // Ensure progress has all required fields
            const typedProgress: EnrollmentProgress = {
              quizResults: progress.quizResults || { moduleQuizzes: {} },
              moduleProgress: progress.moduleProgress || {},
              completedModules: Array.isArray(progress.completedModules) 
                ? [...progress.completedModules] 
                : [],
              lastAccessedModule: progress.lastAccessedModule || 0
            };
            // Set both local state and store
            enrollmentProgress = typedProgress;
            enrollmentProgressStore.set(typedProgress);
            console.log('Updated enrollment progress:', typedProgress);
          } else {
            // Initialize empty progress if none exists
            const emptyProgress: EnrollmentProgress = {
              quizResults: { moduleQuizzes: {} },
              moduleProgress: {},
              completedModules: [],
              lastAccessedModule: 0
            };
            enrollmentProgress = emptyProgress;
            enrollmentProgressStore.set(emptyProgress);
          }
        } else {
          // Reset progress if not enrolled
          enrollmentProgress = null;
          enrollmentProgressStore.set(null);
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      loading = false;
    }
  }

  // Add this interface to extend the QuizStore
  interface ExtendedQuizStore {
    quizData: any | null;
    selectedAnswers: Record<number, string>;
    score: number;
    moduleIndex: number;
    isFinalQuiz: boolean;
    showResult?: boolean;
  }

  // Subscribe to quiz store
  quizStore.subscribe((store: ExtendedQuizStore) => {
    showNewQuizPage = store.showResult || false;
  });

  // Update the onMount function
  onMount(() => {
    console.log('Course page mounted');
    // Get initial user state
    const userData = get(user);
    if (userData) {
      loadCourseData(userData);
    } else {
      // No user, get shared course data
      console.log('Getting shared course data');
      try {
        getSharedCourse($page.params.id).then(data => {
          courseDetails = data;
          if (courseDetails?.createdBy) {
            getUserProfile(courseDetails.createdBy).then(profile => {
              creatorProfile = profile;
            });
          }
          isEnrolled = false;
          isCreator = false;
          enrollmentProgressStore.set(null);
        });
      } catch (error) {
        console.error('Error loading shared course data:', error);
      }
    }

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Handle hash navigation after data is loaded
    if (window.location.hash) {
      setTimeout(() => {
        const hash = window.location.hash;
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400); // Increased timeout to ensure content is loaded
    }

    // Return cleanup function
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  // Helper function to check if all modules are completed
  function hasCompletedAllModules(): boolean {
    if (!courseDetails || !enrollmentProgress) return false;

    // Get modules that have quiz data
    const modulesWithQuiz = courseDetails.Final_Module_Quiz?.reduce((acc: number[], quiz, index) => {
      if (quiz) acc.push(index);
      return acc;
    }, []) || [];

    // Get completed modules
    const completedModules = enrollmentProgress.completedModules || [];

    // Check if all modules are completed
    const allModulesCompleted = completedModules.length === courseDetails.Final_Module_Title.length;

    // Get quiz results
    const moduleQuizzes = enrollmentProgress.quizResults?.moduleQuizzes || {};

    // Check if all quizzes that exist have been passed
    const allQuizzesPassed = modulesWithQuiz.every(moduleIndex => {
      const quizResult = moduleQuizzes[moduleIndex];
      return quizResult?.passed;
    });

    // Log detailed information for debugging
    console.log('Module completion check:', {
      modulesWithQuiz,
      completedModules,
      moduleQuizzes,
      allQuizzesPassed,
      allModulesCompleted,
      quizResults: enrollmentProgress.quizResults,
    });

    // Return true if all modules are completed and all available quizzes are passed
    // return allModulesCompleted && allQuizzesPassed;
    return allModulesCompleted;
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
      
      // Update local state before redirecting
      isEnrolled = true;
      saveState({ isEnrolled: true });
      
      // Load enrollment progress
      const progress = await getEnrollmentProgress($user.uid, $page.params.id);
      if (progress) {
        const typedProgress = {
          quizResults: progress.quizResults || { moduleQuizzes: {} },
          moduleProgress: progress.moduleProgress || {},
          completedModules: Array.isArray(progress.completedModules) 
            ? [...progress.completedModules] 
            : [],
          lastAccessedModule: progress.lastAccessedModule || 0
        };
        enrollmentProgress = typedProgress;
        enrollmentProgressStore.set(typedProgress);
      }
      
      // Set current module and redirect after a small delay
      currentModuleStore.set(-1);
      
      // Small timeout to allow UI to update before redirect
      setTimeout(() => {
        goto(`/course/${$page.params.id}`);
      }, 300);
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

  // Update the quiz completion handler
  async function handleQuizComplete(score: number, timeSpent: number) {
    if (!$user || !courseDetails) return;

    const moduleId = $currentModuleStore;
    try {
        const isPassed = score >= 80;
        console.log('Quiz completed:', { moduleId, score, isPassed });

        // Get existing quiz data for this module
        const existingQuizData = enrollmentProgress?.quizResults?.moduleQuizzes?.[moduleId] || {
            attempts: [],
            score: 0,
            passed: false
        };
        
        // Create new attempt
        const newAttempt = {
            score,
            timeSpent,
            completedAt: new Date(),
            passed: isPassed
        };
        
        // Ensure attempts is an array and add new attempt
        const attempts = Array.isArray(existingQuizData.attempts) ? existingQuizData.attempts : [];
        
        // Get the best score from all attempts including the new one
        const bestScore = Math.max(score, ...attempts.map((a: any) => (a?.score || 0)));
        
        // Determine if the module was previously passed or is now passed
        const wasPreviouslyPassed = existingQuizData?.passed || false;
        const isNowPassed = wasPreviouslyPassed || isPassed;

        // Create updated quiz result
        const updatedQuizResult: any = {
            attempts: [...attempts, newAttempt],
            score: bestScore,
            timeSpent,
            completedAt: new Date(),
            completed: true,
            passed: isNowPassed
        };

        // Update enrollment progress with quiz result
        const updatedProgress = await updateEnrollmentQuizResult(
            $user.uid,
            courseDetails.id!,
            moduleId,
            updatedQuizResult
        );

        console.log('Updated progress from server:', updatedProgress);

        // Update the store with new progress
        if (updatedProgress) {
            // Convert the DocumentData to EnrollmentProgress type
            const typedProgress: EnrollmentProgress = {
                quizResults: updatedProgress.quizResults || { moduleQuizzes: {} },
                moduleProgress: updatedProgress.moduleProgress || [],
                completedModules: Array.isArray(updatedProgress.completedModules) 
                    ? [...updatedProgress.completedModules] 
                    : [],
                lastAccessedModule: updatedProgress.lastAccessedModule || 0
            };
            
            // Only add to completedModules if not already there and module is passed
            if (isNowPassed && !typedProgress.completedModules.includes(moduleId)) {
                typedProgress.completedModules = [...typedProgress.completedModules, moduleId].sort((a, b) => a - b);
                console.log('Updated completedModules:', typedProgress.completedModules);
            }
            
            // Update both the store and local state
            enrollmentProgressStore.set(typedProgress);
            enrollmentProgress = typedProgress;
            
            // Update local module progress state
            moduleProgress = moduleProgress.map((module, index) => 
                index === moduleId ? { ...module, completed: isNowPassed } : module
            );

            // Force a UI update with proper type handling
            enrollmentProgressStore.update(current => {
                if (current) {
                    return {...current};
                }
                return {
                    quizResults: { moduleQuizzes: {} },
                    moduleProgress: {},
                    completedModules: [],
                    lastAccessedModule: 0
                };
            });
            
            console.log('Final enrollment progress state:', {
                storeValue: $enrollmentProgressStore,
                localValue: enrollmentProgress,
                completedModules: typedProgress.completedModules,
                quizResult: updatedQuizResult
            });
        }

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

  // Add this new function to format bullet points
  function formatBulletPoints(text: string): string {
    if (!text) return '';
    
    // If text contains bullet points (•), format as a list
    if (text.includes('•')) {
      const lines = text.split('\n');
      const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('•')) {
          return `<div class="flex mb-2">
                    <span class="text-brand-turquoise dark:text-brand-turquoise mr-2 text-lg">•</span>
                    <span>${trimmed.substring(1).trim()}</span>
                  </div>`;
        }
        return `<p class="mb-2">${trimmed}</p>`;
      });
      return formattedLines.join('');
    }
    
    // If no bullet points, just handle line breaks
    return text.replace(/\n/g, '<br>');
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
                class="fixed pt-3 lg:pt-0 lg:relative top-[70px] lg:top-0 left-0 right-0 z-30 bg-BackgroundRed dark:bg-dark-bg-secondary aspect-video"
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
                      class="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5"
                    >
                      <p class="text-light-text-tertiary dark:text-dark-text-tertiary">No video available</p>
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
              <h4 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary">
                {#if $currentModuleStore === -1}
                  Course Introduction and Objectives
                {:else if $currentModuleStore === courseDetails?.Final_Module_Title?.length}
                  Course Conclusion
                {/if}
              </h4>
              {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length}
              <div class="mt-6">
                <p class="text-h4-medium text-Green dark:text-Green2 mb-2">
                  Module {$currentModuleStore + 1}
                </p>
                <p class="text-h2-mobile-bold lg:text-h2-bold text-light-text-primary dark:text-dark-text-primary">
                  {courseDetails.Final_Module_Title[$currentModuleStore]}
                </p>
              </div>
              {/if}
              {#if $currentModuleStore !== -1 && $currentModuleStore == courseDetails?.Final_Module_Title?.length}
              <div class="mt-6">
                <p class="text-h2-mobile-bold lg:text-h2-bold text-light-text-primary dark:text-dark-text-primary">
                  {courseDetails.Final_Course_Title}
                </p>
              </div>
              {/if}
            </div>

            <!-- Course Title -->
            {#if $currentModuleStore === -1}
              <div class="mt-6">
                <p class="text-h2-mobile-bold lg:text-h2-bold text-light-text-primary dark:text-dark-text-primary">
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
              {isIntroPage}
              {isModulePage}  
              {isCoursePage}
              on:like={handleLike}
              on:bookmark={handleBookmark}
              on:share={() => (showShareModal = true)}
            />

            <!-- Module Content -->
            <div class="mt-6">
              {#if $currentModuleStore === -1}
                <!-- Course Introduction and Objectives -->
                <div>

                  <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
                    {courseDetails?.Final_Course_Introduction}
                  </p>

                  <div class="mt-6">
                    <h3 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-4">
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
                  <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
                    {courseDetails?.Final_Course_Conclusion}
                  </p>
                 
                  <div class="mt-6">
                    <button
                      on:click={() => {
                        goto(`/course/${$page.params.id}/quiz`);
                      }}
                      disabled={!hasCompletedAllModules()}
                      class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors {hasCompletedAllModules() 
                        ? 'bg-Green dark:bg-Green2 hover:bg-GreenHover text-white' 
                        : 'bg-Black/5 dark:bg-White/10 text-light-text-tertiary dark:text-dark-text-tertiary'}"
                    >
                      Take Final Quiz
                      
                    </button>
                  </div>
                </div>
              {:else}
                <!-- Regular Module Content -->
                <div>

                  <!-- Module Objective -->
                  <div class="mt-6">
                    <h3 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-4">
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

                  <!-- Module Summary -->
                  {#if courseDetails?.Final_Module_Summary && courseDetails.Final_Module_Summary[$currentModuleStore]}
                    <div class="mt-6">
                      <h3 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-4">
                        Key Points
                      </h3>
                      <div 
                        class="text-body text-light-text-secondary dark:text-dark-text-secondary module-summary"
                      >
                        {@html formatBulletPoints(courseDetails.Final_Module_Summary[$currentModuleStore])}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Move Reviews Section after Course Conclusion for mobile -->
            <div class="lg:hidden mt-6">
              <!-- module quiz button -->
              {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length && courseDetails?.Final_Module_Quiz?.[$currentModuleStore]}
                <div class="mt-6 flex flex-col gap-3">
                  <button
                  on:click={handleModuleQuiz}
                  class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green dark:bg-Green2 hover:bg-GreenHover text-white"
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


              <!-- Remove Course Button - Mobile -->
              {#if isEnrolled && $user}
                <div class="lg:hidden mt-6 pb-20">
                  <button
                    class="w-full px-4 py-2 flex items-center justify-center gap-2 border border-[#FF0000] hover:bg-[#FF0000]/5 text-[#FF0000] rounded-lg transition-colors disabled:opacity-50 bg-light-bg-primary dark:bg-dark-bg-primary"
                    on:click={handleRemoveCourseEnrollment}
                    disabled={removing}
                  >
                    {#if removing}
                      <span class="text-semibody-medium"
                        >Removing Enrollment...</span
                      >
                    {:else}
                      <span class="text-semibody">Unenroll from Course</span>
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
                      : 'bg-Green dark:bg-Green2 hover:bg-GreenHover text-white'}"
                    on:click={isEnrolled
                      ? () => {
                          // Get last accessed module from enrollment progress
                          const lastModule =
                            enrollmentProgress?.lastAccessedModule || 0;
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


              <!-- Desktop module quiz button -->
              {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length && courseDetails?.Final_Module_Quiz?.[$currentModuleStore]}
                <div class="mt-6 flex flex-col gap-3">
                  <button
                    on:click={() => {
                      currentQuiz = courseDetails?.Final_Module_Quiz?.[$currentModuleStore];
                      quizModuleTitle = courseDetails?.Final_Module_Title?.[$currentModuleStore] || "";
                      showNewQuizPage = true;
                    }}
                    class="w-full px-4 py-2 flex items-center justify-center text-semibody-medium rounded-2xl transition-colors bg-Green dark:bg-Green2 hover:bg-GreenHover text-white"
                  >
                    Take Module Quiz
                  </button>
                </div>
              {/if}

              <!-- final quiz button -->
              {#if $currentModuleStore === courseDetails?.Final_Module_Title?.length && courseDetails?.Final_Course_Quiz}
                <div class="mt-6 flex flex-col gap-3">
                </div>
              {/if}

              <!-- Reviews Section -->
              <section id="reviews" class="pt-8">
                {#if courseDetails.isPublic}
                  <div class="w-full">
                    <CourseRatings
                      courseId={$page.params.id}
                      showReadAll={true}
                    />
                  </div>
                {/if}
              </section>

              <!-- Remove Course Button - Desktop -->
              {#if isEnrolled && $user}
                <div class="mt-6 col-span-2">
                  <button
                    class="px-4 py-2 flex items-center justify-center gap-2 border border-[#FF0000] hover:bg-[#FF0000]/5 text-[#FF0000] rounded-lg transition-colors disabled:opacity-50 bg-light-bg-primary dark:bg-dark-bg-primary"
                    on:click={handleRemoveCourseEnrollment}
                    disabled={removing}
                  >
                    {#if removing}
                      <span class="text-semibody-medium"
                        >Removing Course...</span
                      >
                    {:else}
                      <span class="text-semibody">Unenroll from Course</span>
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
  class="fixed bottom-0 left-0 right-0 pb-24 pt-4 z-[60] lg:hidden transition-opacity duration-300"
  class:opacity-0={!showFloatingButton}
  class:pointer-events-none={!showFloatingButton}
>
  <div class="container mx-auto pl-5">
    <button
      class="px-4 py-2 flex items-center justify-center gap-2 text-white rounded-2xl transition-opacity disabled:opacity-50 text-semibody-medium shadow-lg {isEnrolled
        ? 'bg-brand-red'
        : 'bg-Green'}"
      on:click={isEnrolled 
        ? () => {
            // Get last accessed module from enrollment progress
            const lastModule = enrollmentProgress?.lastAccessedModule || 0;
            currentModuleStore.set(lastModule);
            goto(`/course/${$page.params.id}`);
          }
        : handleEnroll
      }
    >
     
        <span>{isEnrolled ? "Continue" : "Enroll"}</span>
        <img
          src="/icons/arrow-right-white.svg"
          alt={isEnrolled ? "Continue" : "Enroll"}
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
        courseId={$page.params.id}
    />
{/if}

<style>
  .video-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  }

  /* Module summary styling */
  .module-summary :global(span.text-brand-turquoise) {
    margin-right: 0.5rem;
    font-size: 1.2em;
  }
  
  .module-summary {
    line-height: 1.6;
  }
  
  .module-summary :global(br) {
    margin-bottom: 0.75rem;
    content: "";
    display: block;
  }
</style>
