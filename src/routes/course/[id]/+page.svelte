<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/auth";
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
  } from "$lib/firebase";
  import type {
    FinalCourseStructure,
    Quiz,
    QuizQuestion,
    ModuleProgress,
    EnrollmentProgress,
  } from "$lib/types/course";
  import {
    Play,
    CheckCircle,
    Circle,
    Timer,
    Trophy,
    XCircle,
    Loader,
  } from "lucide-svelte";
  import CourseActions from "$lib/components/CourseActions.svelte";
  import { Timestamp } from "firebase/firestore";
  import CourseRatings from "$lib/components/CourseRatings.svelte";

  let courseDetails: FinalCourseStructure | null = null;
  let enrollmentProgress: EnrollmentProgress | null = null;
  let isCreator = false;
  let currentModule = 0;
  let loading = true;
  let error: string | null = null;
  let moduleProgress: ModuleProgress[] = [];
  let selectedAnswers: { [key: string]: string } = {};
  let showQuiz = false;
  let quizSubmitted = false;
  let quizScore = 0;
  let currentQuiz: Quiz | null = null;
  let quizResults: { [key: string]: boolean } = {};
  let showProgress = false;
  let isEnrolled = false;
  let quizTimer = 0;
  let timerInterval: NodeJS.Timeout;
  let previousScores: { score: number; date: Date; timeTaken?: number }[] = [];
  let showResultAnimation = false;
  let likeCount = 0;
  let isLiked = false;
  let isLikeLoading = false;

  onMount(async () => {
    try {
      const courseId = $page.params.id;
      if (!courseId) throw new Error("Course ID not found");

      loading = true;
      courseDetails = await getSharedCourse(courseId);

      if (!courseDetails) throw new Error("Course not found");

      if ($user) {
        isCreator = courseDetails.createdBy === $user.uid;

        // Check if user is creator or if course is public
        if (!isCreator && !courseDetails.isPublic) {
          throw new Error("You do not have access to this course");
        }

        // Always check enrollment status for non-creators
        if (!isCreator) {
          isEnrolled = await getEnrollmentStatus($user.uid, courseId);
        }

        // Show progress if user is creator or enrolled
        if (isCreator || isEnrolled) {
          showProgress = true;
          if (isEnrolled) {
            enrollmentProgress = await getEnrollmentProgress(
              $user.uid,
              courseId,
            );
            moduleProgress = enrollmentProgress?.moduleProgress || [];
          } else {
            // Load creator's progress
            try {
              const progress = await getCourseProgress($user.uid, courseId);
              moduleProgress = progress?.moduleProgress || [];
            } catch (err) {
              console.log("No existing progress found:", err);
            }
          }
        }
      } else {
        // For non-authenticated users, only allow access to public courses
        if (!courseDetails.isPublic) {
          throw new Error("Please login to access this course");
        }
      }

      // Initialize module progress if needed
      if (showProgress && !moduleProgress.length && courseDetails) {
        moduleProgress = Array(courseDetails.Final_Module_Title.length).fill(
          null,
        );
        if ($user) {
          moduleProgress[0] = {
            completed: false,
            quizAttempts: 0,
            bestScore: 0,
            lastAttemptDate: Timestamp.fromDate(new Date()),
          };
        }
      }

      if (courseDetails && $user) {
        isLiked = courseDetails.likedBy?.includes($user.uid) || false;
        likeCount = courseDetails.likes || 0;
      }
    } catch (err) {
      console.error("Error loading course:", err);
      error = err instanceof Error ? err.message : "An unknown error occurred";
    } finally {
      loading = false;
    }
  });

  function startQuizTimer() {
    if (timerInterval) clearInterval(timerInterval);
    quizTimer = 0;
    timerInterval = setInterval(() => {
      quizTimer++;
    }, 1000);
  }

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  function resetQuizState() {
    selectedAnswers = {};
    quizResults = {};
    quizSubmitted = false;
    quizScore = 0;
    showResultAnimation = false;
    previousScores = [];
    quizTimer = 0;
    if (timerInterval) clearInterval(timerInterval);
  }

  async function handleQuizSubmit() {
    if (!currentQuiz || !courseDetails || !$user) return;

    if (timerInterval) clearInterval(timerInterval);

    let correctAnswers = 0;
    currentQuiz.quiz.forEach((question, index) => {
      const isCorrect = selectedAnswers[index] === question.answer;
      quizResults[index] = isCorrect;
      if (isCorrect) correctAnswers++;
    });

    quizScore = Math.round((correctAnswers / currentQuiz.quiz.length) * 100);
    quizSubmitted = true;
    showResultAnimation = true;

    setTimeout(() => {
      showResultAnimation = false;
    }, 3000);

    try {
      const updatedProgress = {
        completed: quizScore >= 70,
        quizAttempts: (moduleProgress[currentModule]?.quizAttempts || 0) + 1,
        bestScore: Math.max(
          quizScore,
          moduleProgress[currentModule]?.bestScore || 0,
        ),
        lastAttemptDate: Timestamp.fromDate(new Date()),
        timeTaken: quizTimer,
      };

      if (isCreator) {
        await updateModuleProgress(
          $user.uid,
          $page.params.id,
          currentModule,
          updatedProgress,
        );
        moduleProgress[currentModule] = updatedProgress;

        // Don't update previous scores here - they will be loaded when starting a new attempt
      } else {
        await updateEnrollmentQuizResult(
          $user.uid,
          $page.params.id,
          currentModule,
          quizScore,
          quizScore >= 70,
          quizTimer,
        );

        enrollmentProgress = await getEnrollmentProgress(
          $user.uid,
          $page.params.id,
        );
        if (enrollmentProgress) {
          moduleProgress = enrollmentProgress.moduleProgress;
          // Don't update previous scores here - they will be loaded when starting a new attempt
        }
      }
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  }

  function handlePlaylistClick() {
    if (!courseDetails?.Final_Module_YouTube_Video_URL?.length) return;

    try {
      const videoIds = courseDetails.Final_Module_YouTube_Video_URL.map(
        (url) => {
          const match = url.match(
            /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i,
          );
          return match ? match[1] : null;
        },
      ).filter((id) => id !== null);

      if (videoIds.length > 0) {
        const playlistTitle = encodeURIComponent(
          courseDetails.Final_Course_Title || "",
        );
        const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(",")}&title=${playlistTitle}`;
        window.open(playlistUrl, "_blank");
      }
    } catch (error) {
      console.error("Error creating YouTube playlist URL:", error);
    }
  }

  async function handleLike() {
    if (!$user) {
      goto('/login');
      return;
    }

    try {
      isLikeLoading = true;
      const result = await likeCourse(courseDetails.id, $user.uid);
      // Update the local state
      courseDetails = {
        ...courseDetails,
        likes: result.likes,
        likedBy: result.likedBy
      };
      // Update isLiked state
      isLiked = result.likedBy.includes($user.uid);
    } catch (error) {
      console.error('Error liking course:', error);
    } finally {
      isLikeLoading = false;
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1);
    }
    return num.toString();
  }
</script>

<div class="w-full min-h-screen overflow-x-hidden">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
      ></div>
    </div>
  {:else if error}
    <div class="text-red-500 text-center p-4">{error}</div>
  {:else if courseDetails}
    <div class="w-full lg:container lg:mx-auto lg:py-8">
      <div class="w-full lg:grid lg:grid-cols-12 lg:gap-8">
        <div class="w-full lg:col-span-8">
          <div class="relative w-full lg:rounded-2xl overflow-hidden">
            <!-- h-[94px] for mobile view video player and header space -->
            <div
              class="fixed lg:relative top-[86px] lg:top-0 left-0 right-0 z-30 bg-black"
            >
              <div class="video-container w-full">
                {#if courseDetails?.Final_Module_YouTube_Video_URL?.[currentModule]}
                  <iframe
                    title={courseDetails.Final_Module_Title[currentModule]}
                    class="absolute inset-0 w-full h-full"
                    src={(() => {
                      try {
                        const videoUrl =
                          courseDetails.Final_Module_YouTube_Video_URL[
                            currentModule
                          ];
                        const videoId = videoUrl.match(
                          /(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i,
                        )?.[1];
                        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=0&origin=${window.location.origin}`;
                      } catch (error) {
                        console.error("Error parsing YouTube URL:", error);
                        return "";
                      }
                    })()}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    loading="lazy"
                  ></iframe>
                {:else}
                  <div
                    class="w-full h-full flex items-center justify-center bg-gray-100"
                  >
                    <span class="text-gray-500">No video available</span>
                  </div>
                {/if}
              </div>
            </div>
            <!-- <div class="fixed h-[calc(56.25vw+5.5rem)] lg:hidden"></div> -->
          </div>

          <!-- <div class="fixed top-[calc(94px+56.25vw)] bottom-0 left-0 right-0 overflow-y-auto lg:static"> -->
          <!-- <div class="px-4 lg:px-0 lg:pt-8"> -->
            <!-- Course details section -->
          <div class="mobile-scroll-container pt-28 lg:static">
            <div class="px-0 pt-[calc(56.25vw-155px)] lg:pt-8">
              <h1
                class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-4"
              >
                {courseDetails.Final_Course_Title}
              </h1>
              <div class="flex items-center gap-2 mb-4">
                <!-- Upvote section -->
                <div class="flex items-center gap-1 bg-black/5 rounded-2xl p-2">
                  <button 
                    on:click={handleLike} 
                    disabled={isLikeLoading}
                    class="p-1 rounded-full hover:bg-black/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {#if isLikeLoading}
                      <Loader class="w-4 h-4 animate-spin text-brand-turquoise" />
                    {:else}
                      <img 
                        src="/icons/upvote.svg" 
                        alt="upvote" 
                        class="w-4 h-4 {isLiked ? 'text-brand-turquoise filter-turquoise' : ''}" 
                      />
                    {/if}
                  </button>
                  <span class="text-mini-body text-light-text-secondary dark:text-dark-text-secondary">
                    <!-- {`${courseDetails?.likes ?? 0} ${(courseDetails?.likes ?? 0) === 1 ? "Upvote" : "Upvotes"}`} -->
                    {formatNumber(courseDetails?.likes ?? 0)} {(courseDetails?.likes ?? 0) === 1 ? "Upvote" : "Upvotes"}`
                  </span>
                </div>
                
                <!-- Views section -->
                <div class="flex items-center  gap-1">
                  <img src="/icons/view.svg" alt="views" class="w-4 h-4" />
                  <span class="text-mini-body text-light-text-secondary dark:text-dark-text-secondary">
                    {formatNumber(courseDetails?.views ?? 0)} views
                  </span>
                </div>
              </div>

              <!-- Creator section -->
              <div class="flex items-center justify-between mb-4">
                <!-- Creator info -->
                <div class="flex items-center gap-3">
                  <img 
                    src={courseDetails?.creatorPhotoURL || '/images/default-avatar.png'} 
                    alt="Creator" 
                    class="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-body font-medium text-light-text-primary dark:text-dark-text-primary">Creator:</span>
                      <span class="text-body text-light-text-secondary dark:text-dark-text-secondary">
                        {courseDetails?.creatorDisplayName || 'Unknown'}
                      </span>
                    </div>
                    <span class="text-mini-body text-light-text-tertiary dark:text-dark-text-tertiary">
                      {new Date(
                        courseDetails.createdAt?.toDate?.() ||
                          courseDetails.createdAt ||
                          Date.now(),
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <!-- Bookmark button -->
                <button 
                  class="p-2 rounded-2xl bg-black/5 hover:bg-black/10 transition-colors duration-200"
                  aria-label="Bookmark course"
                >
                  <img src="/icons/bookmark-03.svg" alt="Bookmark" class="w-6 h-6" />
                </button>
              </div>

              <div class="flex items-center gap-2 mb-4">
                <h2
                  class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary"
                >
                  Module {currentModule + 1}: {courseDetails
                    ?.Final_Module_Title?.[currentModule] || "Untitled Module"}
                </h2>
              </div>

              <div class="prose dark:prose-invert max-w-none mb-8">
                <p
                  class="text-body lg:text-body text-light-text-secondary dark:text-dark-text-secondary"
                >
                  {courseDetails?.Final_Module_Objective?.[currentModule] ||
                    "No objectives available"}
                </p>
              </div>

              

              <div class="space-y-6">
                {#if courseDetails?.Final_Module_Objective?.[currentModule]}
                  <div>
                    <h3 class="text-xl font-medium text-[#1E3443] mb-4">
                      Module Objectives
                    </h3>
                    <p class="text-base text-[#494848]">
                      {courseDetails.Final_Module_Objective[currentModule]}
                    </p>
                  </div>
                {/if}

                {#if courseDetails?.Final_Course_Introduction}
                  <div>
                    <h3 class="text-xl font-medium text-[#1E3443] mb-4">
                      Course Introduction
                    </h3>
                    <p class="text-base text-[#494848]">
                      {courseDetails.Final_Course_Introduction}
                    </p>
                  </div>
                {/if}

                {#if courseDetails?.Final_Course_Conclusion}
                  <div>
                    <h3 class="text-xl font-medium text-[#1E3443] mb-4">
                      Course Conclusion
                    </h3>
                    <p class="text-base text-[#494848]">
                      {courseDetails.Final_Course_Conclusion}
                    </p>
                  </div>
                {/if}


                <!-- Quiz buttons -->
                <!-- Only show if user has enrolled the course -->
                {#if isEnrolled}
                <div class="flex flex-col gap-4">
                  <button
                    class="h-[37px] px-6 bg-Green text-white rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center w-full"
                    disabled={(!isEnrolled && !isCreator) ||
                      !courseDetails?.Final_Module_Quiz?.[currentModule]}
                    on:click={() => {
                      try {
                        resetQuizState();

                        if (
                          isCreator &&
                          moduleProgress?.[currentModule]?.quizAttempts > 0
                        ) {
                          const moduleData = moduleProgress[currentModule];
                          const date =
                            moduleData.lastAttemptDate instanceof Date
                              ? moduleData.lastAttemptDate
                              : moduleData.lastAttemptDate?.toDate?.() ||
                                new Date();
                          previousScores = [
                            {
                              score: moduleData.bestScore || 0,
                              date,
                              timeTaken: moduleData.timeTaken || 0,
                            },
                          ];
                        } else if (
                          enrollmentProgress?.quizResults?.moduleQuizzes?.[
                            currentModule
                          ]?.attempts > 0
                        ) {
                          const moduleQuizData =
                            enrollmentProgress.quizResults.moduleQuizzes[
                              currentModule
                            ];
                          const date =
                            moduleQuizData.lastAttemptDate instanceof Date
                              ? moduleQuizData.lastAttemptDate
                              : moduleQuizData.lastAttemptDate?.toDate?.() ||
                                new Date();
                          previousScores = [
                            {
                              score: moduleQuizData.bestScore || 0,
                              date,
                              timeTaken: moduleQuizData.timeTaken || 0,
                            },
                          ];
                        }

                        const moduleQuiz =
                          courseDetails.Final_Module_Quiz[currentModule];
                        if (moduleQuiz) {
                          currentQuiz = moduleQuiz;
                          showQuiz = true;
                          startQuizTimer();
                        } else {
                          console.error("Module quiz data is not available");
                        }
                      } catch (error) {
                        console.error("Error creating module quiz:", error);
                      }
                    }}
                  >
                    Take Module Quiz
                  </button>

                  <button
                    class="h-[37px] px-6 bg-[#F5F5F5] text-black rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center w-full"
                    disabled={(!isEnrolled && !isCreator) ||
                      !courseDetails?.Final_Course_Quiz}
                    on:click={() => {
                      try {
                        resetQuizState();
                        currentModule = -1;

                        if (
                          isCreator &&
                          moduleProgress?.[currentModule]?.quizAttempts > 0
                        ) {
                          const moduleData = moduleProgress[currentModule];
                          const date =
                            moduleData.lastAttemptDate instanceof Date
                              ? moduleData.lastAttemptDate
                              : moduleData.lastAttemptDate?.toDate?.() ||
                                new Date();
                          previousScores = [
                            {
                              score: moduleData.bestScore || 0,
                              date,
                              timeTaken: moduleData.timeTaken || 0,
                            },
                          ];
                        } else if (
                          enrollmentProgress?.quizResults?.finalQuiz?.attempts >
                          0
                        ) {
                          const finalQuizData =
                            enrollmentProgress.quizResults.finalQuiz;
                          const date =
                            finalQuizData.lastAttemptDate instanceof Date
                              ? finalQuizData.lastAttemptDate
                              : finalQuizData.lastAttemptDate?.toDate?.() ||
                                new Date();
                          previousScores = [
                            {
                              score: finalQuizData.bestScore || 0,
                              date,
                              timeTaken: finalQuizData.timeTaken || 0,
                            },
                          ];
                        }

                        if (courseDetails?.Final_Course_Quiz) {
                          currentQuiz = courseDetails.Final_Course_Quiz;
                          showQuiz = true;
                          startQuizTimer();
                        } else {
                          console.error("Final quiz data is not available");
                        }
                      } catch (error) {
                        console.error("Error creating final quiz:", error);
                      }
                    }}
                  >
                    Take Final Course Quiz
                  </button>
                </div>
                {/if}

                <!-- If user not enrolled then show enroll and bookmark button only on desktop -->
                {#if !isEnrolled}
                  <div class="hidden lg:flex-col lg:block space-y-[17px]">
                    <button class="h-[37px] px-6 bg-Green text-white text-semibody-medium rounded-2xl hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full">Enroll</button>
                    <button class="h-[37px] px-6 bg-Black/5 text-Green text-semibody-medium rounded-2xl hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed  flex items-center justify-center w-full">Bookmark Course</button>
                  </div>
                {/if}
                </div>
            </div>
          </div>
        </div>
<!-- Progress and modules section -->
        <div class="hidden lg:block lg:col-span-4 space-y-8">
          {#if showProgress && $user && (isCreator || isEnrolled)}
            <div
              class=" w-[362px] h-[94px] rounded-2xl border border-black/[0.05] p-4"
            >
              <div class="pb-2 border-b border-black/[0.05]">
                <h3 class="text-base font-medium text-black">Your Progress</h3>
              </div>

              <div class="flex items-center gap-4 pt-2">
                <div
                  class="flex-1 h-3 bg-black/[0.05] rounded-[2000px] overflow-hidden"
                >
                  <div
                    class="h-full bg-[#42C1C8] rounded-[200000px] transition-all duration-300"
                    style="width: {isCreator
                      ? (moduleProgress.filter((m) => m?.completed).length /
                          courseDetails.Final_Module_Title.length) *
                        100
                      : ((enrollmentProgress?.completedModules?.length || 0) /
                          courseDetails.Final_Module_Title.length) *
                        100}%"
                  />
                </div>
                <span class="text-base text-black">
                  {isCreator
                    ? moduleProgress.filter((m) => m?.completed).length
                    : enrollmentProgress?.completedModules?.length ||
                      0}/{courseDetails.Final_Module_Title.length}
                </span>
              </div>
            </div>
          {/if}

          <div class="w-[362px] border border-[rgba(0,0,0,0.05)] rounded-2xl">
            <div class="p-4 border-b border-black/[0.05]">
              <h3 class="text-base font-medium text-black">Course Modules</h3>
            </div>
            <div class="max-h-[400px] overflow-y-auto">
              {#each courseDetails.Final_Module_Title as title, index}
                <div
                  class="w-[362px] h-[94px] border border-[rgba(0,0,0,0.05)] rounded-2xl p-2 m-2 hover:bg-black/[0.02] transition-colors"
                >
                  <button
                    class="w-full flex items-start gap-4"
                    on:click={() => (currentModule = index)}
                  >
                    <div class="flex-1 min-w-0 p-2">
                      <div class="flex flex-col gap-4">
                        <div class="flex items-start gap-2">
                          <span class="text-[#A3A3A3] text-sm whitespace-nowrap"
                            >{(index + 1).toString().padStart(2, "0")}:</span
                          >
                          <h4
                            class="text-base font-medium text-[#1E3443] leading-[21px] line-clamp-2"
                          >
                            {title}
                          </h4>
                        </div>
                        <span class="text-sm text-[#A3A3A3]">
                          {#if courseDetails?.Final_Module_Video_Duration?.[index]}
                            {Math.floor(
                              courseDetails.Final_Module_Video_Duration[index],
                            )} min {Math.round(
                              (courseDetails.Final_Module_Video_Duration[
                                index
                              ] %
                                1) *
                                60,
                            )} sec
                          {:else}
                            -- min
                          {/if}
                        </span>
                      </div>
                    </div>
                    <div
                      class="w-[120px] h-[78px] rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={courseDetails?.Final_Module_Thumbnails?.[index] ||
                          "/images/course-placeholder.png"}
                        alt={title}
                        class="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="w-full lg:hidden px-4 py-6">
          <div
            class="w-full border border-light-border dark:border-dark-border rounded-2xl"
          >
            <div
              class="p-4 border-b border-light-border dark:border-dark-border"
            >
              <h3
                class="text-body-semibold text-light-text-primary dark:text-dark-text-primary"
              >
                Course Modules
              </h3>
            </div>
            <div class="max-h-[400px] overflow-y-auto w-full">
              {#each courseDetails.Final_Module_Title as title, index}
                <div
                  class="w-full border border-[rgba(0,0,0,0.05)] rounded-2xl p-2 mx-0 my-2 hover:bg-black/[0.02] transition-colors"
                >
                  <button
                    class="w-full flex items-start gap-4"
                    on:click={() => (currentModule = index)}
                  >
                    <div class="flex-1 min-w-0 p-2">
                      <div class="flex flex-col gap-4">
                        <div class="flex items-start gap-2">
                          <span class="text-[#A3A3A3] text-sm whitespace-nowrap"
                            >{(index + 1).toString().padStart(2, "0")}:</span
                          >
                          <h4
                            class="text-base font-medium text-[#1E3443] leading-[21px] line-clamp-2"
                          >
                            {title}
                          </h4>
                        </div>
                        <span class="text-sm text-[#A3A3A3]">
                          {#if courseDetails?.Final_Module_Video_Duration?.[index]}
                            {Math.floor(
                              courseDetails.Final_Module_Video_Duration[index],
                            )} min {Math.round(
                              (courseDetails.Final_Module_Video_Duration[
                                index
                              ] %
                                1) *
                                60,
                            )} sec
                          {:else}
                            -- min
                          {/if}
                        </span>
                      </div>
                    </div>
                    <div
                      class="w-[120px] h-[78px] rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={courseDetails?.Final_Module_Thumbnails?.[index] ||
                          "/images/course-placeholder.png"}
                        alt={title}
                        class="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>

    {#if courseDetails.isPublic}
      <div class="mt-12">
        <CourseRatings courseId={$page.params.id} />
      </div>
    {/if}
  {/if}
</div>

{#if showQuiz && currentQuiz}
  <div
    class="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50"
  >
    <div
      class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
    >
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-[#2A4D61]">Quiz</h3>
        {#if !quizSubmitted}
          <div class="flex items-center gap-2 text-gray-600">
            <Timer class="w-5 h-5" />
            <span
              >{Math.floor(quizTimer / 60)}:{(quizTimer % 60)
                .toString()
                .padStart(2, "0")}</span
            >
          </div>
        {/if}
      </div>

      {#if previousScores.length > 0}
        <div class="mb-6 bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium mb-2">Previous Attempts</h4>
          <div class="space-y-2">
            {#each previousScores as { score, date, timeTaken }}
              <div class="flex justify-between text-sm">
                <span>{score}%</span>
                <div class="text-gray-500 flex gap-4">
                  {#if timeTaken !== undefined}
                    <span
                      >Time: {Math.floor(timeTaken / 60)}m {timeTaken %
                        60}s</span
                    >
                  {/if}
                  <span>
                    {date instanceof Date && !isNaN(date.getTime())
                      ? date.toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Invalid Date"}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="space-y-6">
        {#each currentQuiz.quiz as question, index}
          <div class="mb-6">
            <p class="font-medium mb-3 text-[#2A4D61]">
              {index + 1}. {question.question}
            </p>

            <div class="space-y-3">
              {#each Object.entries(question.options) as [key, value]}
                <label
                  class="flex items-start space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="question_{index}"
                    value={key}
                    checked={selectedAnswers[index] === key}
                    on:change={() => {
                      selectedAnswers[index] = key;
                    }}
                    disabled={quizSubmitted}
                    class="mt-1"
                  />
                  <span class="text-gray-700">{value}</span>
                </label>
              {/each}
            </div>

            {#if quizSubmitted}
              <p
                class={quizResults[index]
                  ? "text-green-500 mt-2"
                  : "text-red-500 mt-2"}
              >
                {quizResults[index] ? "Correct!" : "Incorrect"}
              </p>
            {/if}
          </div>
        {/each}

        <div class="flex justify-end gap-4 mt-6">
          {#if !quizSubmitted}
            <button
              type="button"
              class="bg-[#42C1C8] text-white px-6 py-2 rounded-lg hover:bg-[#3BA7AD] transition-colors duration-200"
              on:click={handleQuizSubmit}
            >
              Submit Quiz
            </button>
          {:else}
            <button
              type="button"
              class="bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45A049] transition-colors duration-200"
              on:click={() => {
                resetQuizState();
                startQuizTimer();
              }}
            >
              Try Again
            </button>
          {/if}
          <button
            type="button"
            class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            on:click={() => {
              showQuiz = false;
              resetQuizState();
            }}
          >
            Close
          </button>
        </div>

        {#if quizSubmitted}
          <div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-lg font-semibold text-[#2A4D61]">
              Your Score: {quizScore}%
            </p>
            <p class="text-sm mt-1 text-gray-600">
              {quizScore >= 70
                ? "Congratulations! You passed the quiz."
                : "Keep trying! You need 70% to pass."}
            </p>
            <p class="text-sm text-gray-500 mt-2">
              Time taken: {Math.floor(quizTimer / 60)}m {quizTimer % 60}s
            </p>
          </div>
        {/if}
      </div>

      {#if showResultAnimation}
        <div
          class="fixed inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            class="transform scale-150 transition-transform duration-500 {quizScore >=
            70
              ? 'text-green-500'
              : 'text-red-500'}"
          >
            {#if quizScore >= 70}
              <Trophy class="w-24 h-24 animate-bounce" />
            {:else}
              <XCircle class="w-24 h-24 animate-bounce" />
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Update mobile styles */
  @media (max-width: 430px) {
    :global(body) {
      min-width: 320px;
      overflow-x: hidden;
    }
  }

  :global(#app) {
    overflow-x: hidden;
  }

  .video-container {
    aspect-ratio: 16 / 9;
  }

  @media (max-width: 1023px) {
    .mobile-scroll-container {
      width: 100%;
      min-width: 320px;
      height: calc(100vh - var(--header-height));
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: 100px;
    }

    /* Add padding to prevent content from scrolling under the header */
    .mobile-scroll-container:before {
      content: "";
      display: block;
      height: var(--header-height);
    }

    /* Hide scrollbar but keep functionality */
    .mobile-scroll-container {
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }

    .mobile-scroll-container::-webkit-scrollbar {
      display: none; /* Chrome, Safari and Opera */
    }
  }

  .filter-turquoise {
    filter: invert(70%) sepia(64%) saturate(426%) hue-rotate(134deg) brightness(87%) contrast(84%);
  }
</style>
