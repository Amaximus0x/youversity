<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import { 
    getUserCourse, 
    updateUserCourse, 
    getCourseProgress, 
    updateModuleProgress, 
    getSharedCourse,
    getEnrollmentProgress,
    updateEnrollmentQuizResult,
    getEnrollmentStatus
  } from '$lib/firebase';
  import type { FinalCourseStructure, Quiz, QuizQuestion, ModuleProgress, EnrollmentProgress } from '$lib/types/course';
  import { Play, CheckCircle, Circle } from 'lucide-svelte';
  import CourseActions from '$lib/components/CourseActions.svelte';

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

  onMount(async () => {
    try {
      const courseId = $page.params.id;
      if (!courseId) throw new Error('Course ID not found');

      loading = true;
      courseDetails = await getSharedCourse(courseId);
      
      if (!courseDetails) throw new Error('Course not found');

      if ($user) {
        isCreator = courseDetails.createdBy === $user.uid;
        
        // Check if user is creator or if course is public
        if (!isCreator && !courseDetails.isPublic) {
          throw new Error('You do not have access to this course');
        }
        
        if (!isCreator) {
          // Check enrollment status for non-creators
          isEnrolled = await getEnrollmentStatus($user.uid, courseId);
          if (isEnrolled) {
            enrollmentProgress = await getEnrollmentProgress($user.uid, courseId);
            showProgress = true;
            moduleProgress = enrollmentProgress?.moduleProgress || [];
          }
        } else {
          // Load creator's progress
          try {
            const progress = await getCourseProgress($user.uid, courseId);
            moduleProgress = progress?.moduleProgress || [];
            showProgress = true;
          } catch (err) {
            console.log('No existing progress found:', err);
          }
        }
      } else {
        // For non-authenticated users, only allow access to public courses
        if (!courseDetails.isPublic) {
          throw new Error('Please login to access this course');
        }
      }

      // Initialize module progress if needed
      if (showProgress && !moduleProgress.length && courseDetails) {
        moduleProgress = Array(courseDetails.Final_Module_Title.length).fill(null);
        if ($user) {
          moduleProgress[0] = {
            completed: false,
            quizAttempts: 0,
            bestScore: 0,
            lastAttemptDate: new Date()
          };
        }
      }
    } catch (err) {
      console.error('Error loading course:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  });

  async function handleQuizSubmit() {
    if (!currentQuiz || !courseDetails) return;
    
    let correctAnswers = 0;
    currentQuiz.quiz.forEach((question, index) => {
      const isCorrect = selectedAnswers[index] === question.answer;
      quizResults[index] = isCorrect;
      if (isCorrect) correctAnswers++;
    });

    quizScore = Math.round((correctAnswers / currentQuiz.quiz.length) * 100);
    quizSubmitted = true;

    if ($user) {
      try {
        if (isCreator) {
          // Update creator's progress
          const updatedProgress = {
            completed: quizScore >= 70,
            quizAttempts: (moduleProgress[currentModule]?.quizAttempts || 0) + 1,
            bestScore: Math.max(quizScore, moduleProgress[currentModule]?.bestScore || 0),
            lastAttemptDate: new Date()
          };

          await updateModuleProgress($user.uid, courseDetails.id, currentModule, updatedProgress);
          moduleProgress[currentModule] = updatedProgress;
        } else {
          // Update enrolled user's progress
          await updateEnrollmentQuizResult(
            $user.uid,
            courseDetails.id,
            currentModule,
            quizScore,
            quizScore >= 70
          );
          enrollmentProgress = await getEnrollmentProgress($user.uid, courseDetails.id);
          if (enrollmentProgress) {
            moduleProgress = enrollmentProgress.moduleProgress;
          }
        }
      } catch (err) {
        console.error('Error updating progress:', err);
      }
    }
  }

  function handlePlaylistClick() {
    if (!courseDetails?.Final_Module_YouTube_Video_URL?.length) return;
    
    try {
      const videoIds = courseDetails.Final_Module_YouTube_Video_URL
        .map(url => {
          const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i);
          return match ? match[1] : null;
        })
        .filter(id => id !== null);

      if (videoIds.length > 0) {
        const playlistTitle = encodeURIComponent(courseDetails.Final_Course_Title || '');
        const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}&title=${playlistTitle}`;
        window.open(playlistUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating YouTube playlist URL:', error);
    }
  }
</script>

{#if loading}
  <div class="flex justify-center items-center min-h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
{:else if error}
  <div class="text-red-500 text-center p-4">{error}</div>
{:else if courseDetails}
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Course Header with Actions -->
    <div class="flex justify-between items-start mb-8">
      <div>
        <h1 class="text-3xl font-bold text-red-800 mb-4">{courseDetails.Final_Course_Title}</h1>
        <p class="text-lg text-red-700">{courseDetails.Final_Course_Objective}</p>
      </div>
      
      {#if !isCreator && courseDetails}
        <CourseActions 
          courseId={$page.params.id} 
          {isEnrolled} 
        />
      {/if}
    </div>

    <!-- Course Introduction -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Course Introduction</h2>
      <p class="text-gray-700">{courseDetails.Final_Course_Introduction}</p>
    </div>

    <!-- Progress Section -->
    {#if showProgress && $user}
    <div class="mb-12">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="font-semibold text-lg mb-4">Your Progress</h3>
        <div class="space-y-4">
          <div class="flex justify-between text-sm text-gray-600 mb-2">
            <span>Module Completion</span>
            <span>
              {isCreator 
                ? moduleProgress.filter(m => m?.completed).length
                : enrollmentProgress?.completedModules.length} / {courseDetails.Final_Module_Title.length}
            </span>
          </div>
          <div class="w-full h-2.5 bg-gray-200 rounded-full">
            <div 
              class="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style="width: {isCreator 
                ? (moduleProgress.filter(m => m?.completed).length / courseDetails.Final_Module_Title.length * 100)
                : (enrollmentProgress?.completedModules.length / courseDetails.Final_Module_Title.length * 100)}%"
            />
          </div>
        </div>
      </div>
    </div>
  {/if}

    <!-- Course Content -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Module List -->
      <div class="lg:col-span-1 bg-white rounded-lg shadow-md p-4">
        <h2 class="font-semibold text-lg mb-4">Course Modules</h2>
        <div class="space-y-2">
          {#each courseDetails.Final_Module_Title as title, index}
            <button
              class="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors
                {currentModule === index ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}
                {enrollmentProgress?.completedModules.includes(index) ? 'text-green-600' : ''}"
              on:click={() => currentModule = index}
            >
              {#if enrollmentProgress?.completedModules.includes(index)}
                <CheckCircle class="w-5 h-5 text-green-600" />
              {:else}
                <Circle class="w-5 h-5" />
              {/if}
              <span class="line-clamp-2">{title}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Module Content -->
      <div class="lg:col-span-3 space-y-6">
        <!-- Video/Quiz Section -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          {#if currentModule >= 0}
            <div class="flex-grow relative" style="min-height: 400px;">
              <iframe
                src={`https://www.youtube.com/embed/${new URL(courseDetails.Final_Module_YouTube_Video_URL[currentModule]).searchParams.get('v')}?enablejsapi=0&origin=${window.location.origin}`}
                title={courseDetails.Final_Module_Title[currentModule]}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
                class="absolute inset-0 w-full h-full rounded"
              ></iframe>
            </div>
            <div class="p-4">
              <h3 class="text-xl font-semibold mb-2">{courseDetails.Final_Module_Title[currentModule]}</h3>
              <p class="text-[#1E3443]/80">{courseDetails.Final_Module_Objective[currentModule]}</p>
            </div>
          {/if}
        </div>

        <!-- Module Quiz Section -->
        {#if currentModule >= 0 && courseDetails.Final_Module_Quiz[currentModule]?.quiz?.length > 0}
          <h3 class="font-semibold text-lg mb-4">Module Quiz</h3>
          <button
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            on:click={() => {
              const moduleQuiz = courseDetails?.Final_Module_Quiz?.[currentModule];
              if (!moduleQuiz) {
                console.error(`No quiz found for module ${currentModule + 1}`);
                return;
              }
              currentQuiz = moduleQuiz;
              showQuiz = true;
            }}
          >
            Take Module Quiz
          </button>
        {/if}

        <!-- Final Quiz Section -->
        {#if courseDetails.Final_Course_Quiz?.quiz?.length > 0 && currentModule >= 0}
          <div class="bg-white rounded-lg shadow-md p-4 mt-8">
            <h2 class="text-2xl font-semibold mb-4">Final Course Quiz</h2>
            <p class="text-gray-600 mb-4">Test your knowledge of the entire course material.</p>
            <button
              class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
              on:click={() => {
                currentModule = -1; // Indicate this is the final quiz
                currentQuiz = courseDetails.Final_Course_Quiz;
                selectedAnswers = {};
                quizResults = {};
                quizSubmitted = false;
                quizScore = 0;
                showQuiz = true;
              }}
            >
              Take Final Quiz
            </button>
          </div>
        {/if}

        <!-- Course Conclusion -->
        <div class="mt-8">
          <h2 class="text-2xl font-semibold mb-4">Course Conclusion</h2>
          <p class="text-gray-700">{courseDetails.Final_Course_Conclusion}</p>
        </div>

        <!-- YouTube Playlist Button -->
        <div class="mt-12 border-t pt-8">
          <div class="flex flex-col items-center gap-4">
            <h3 class="text-xl font-semibold">Watch Complete Course</h3>
            <button
              on:click={handlePlaylistClick}
              class="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
            >
              <Play class="w-6 h-6" />
              <span>Open YouTube Playlist</span>
            </button>
            <p class="text-sm text-gray-600 text-center max-w-md">
              Watch all course videos in sequence on YouTube. This will open in a new tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showQuiz && currentQuiz}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-semibold mb-4 text-[#2A4D61]">Quiz</h3>
      
      <div class="space-y-6">
        {#each currentQuiz.quiz as question, index}
          <div class="mb-6">
            <p class="font-medium mb-3 text-[#2A4D61]">{index + 1}. {question.question}</p>
            
            <div class="space-y-3">
              {#each Object.entries(question.options) as [key, value]}
                <label class="flex items-start space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
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
              <p class={quizResults[index] ? "text-green-500 mt-2" : "text-red-500 mt-2"}>
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
                selectedAnswers = {};
                quizResults = {};
                quizSubmitted = false;
                quizScore = 0;
              }}
            >
              Try Again
            </button>
          {/if}
          <button
            type="button"
            class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            on:click={() => showQuiz = false}
          >
            Close
          </button>
        </div>

        {#if quizSubmitted}
          <div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-lg font-semibold text-[#2A4D61]">Your Score: {quizScore}%</p>
            <p class="text-sm mt-1 text-gray-600">
              {quizScore >= 70 ? 'Congratulations! You passed the quiz.' : 'Keep trying! You need 70% to pass.'}
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if} 