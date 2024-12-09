<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import type { FinalCourseStructure, Quiz, QuizQuestion, ModuleProgress } from '$lib/types/course';
  import { getUserCourse, updateUserCourse, getCourseProgress, updateModuleProgress, getSharedCourse } from '$lib/firebase';

  let courseDetails: FinalCourseStructure | null = null;
  let loading = true;
  let error: string | null = null;
  let isSharedView = false;
  let moduleProgress: ModuleProgress[] = [];
  let selectedAnswers: { [key: string]: string } = {};
  let currentModule = 0;
  let showQuiz = false;
  let quizSubmitted = false;
  let quizScore = 0;
  let currentQuiz: Quiz | null = null;
  let quizResults: { [key: string]: boolean } = {};

  $: if (courseDetails?.Final_Module_Quiz) {
    // Initialize selectedAnswers array based on number of questions
    selectedAnswers = new Array(courseDetails.Final_Module_Quiz[currentModule]?.questions?.length || 0).fill('');
  }

  onMount(async () => {
    try {
      const courseId = $page.params.id;
      if (!courseId) {
        throw new Error('Course ID not found');
      }

      loading = true;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          if ($user) {
            // Authenticated user flow
            const [course, progress] = await Promise.all([
              getUserCourse($user.uid, courseId),
              getCourseProgress($user.uid, courseId)
            ]);
            
            moduleProgress = progress?.moduleProgress || [];
            
            if (!course) {
              // Try to load as shared course if not found in user's courses
              courseDetails = await getSharedCourse(courseId);
              isSharedView = true;
            } else {
              courseDetails = course;
            }
          } else {
            // Unauthenticated user flow - load shared course
            courseDetails = await getSharedCourse(courseId);
            isSharedView = true;
          }

          if (courseDetails) {
            break; // Successfully loaded the course
          }
        } catch (err) {
          console.log(`Attempt ${attempts + 1} failed:`, err);
        }

        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
        }
      }

      if (!courseDetails) {
        throw new Error('Course not found after multiple attempts');
      }

      // Initialize module progress if not exists
      if (!moduleProgress.length && courseDetails) {
        moduleProgress = Array(courseDetails.Final_Module_Title.length).fill(null);
        if ($user) {
          moduleProgress[0] = {
            completed: false,
            quizAttempts: 0,
            bestScore: 0,
            lastAttemptDate: new Date()
          };
          
          // Save initial progress
          try {
            await updateModuleProgress($user.uid, courseId, 0, moduleProgress[0]);
          } catch (err) {
            console.error('Error initializing course progress:', err);
          }
        }
      }

    } catch (err) {
      console.error('Error loading course:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  });

  function startQuiz(quiz: Quiz | null, moduleIndex?: number) {
    if (!quiz) {
      console.error('No quiz provided');
      return;
    }
    
    currentModule = moduleIndex ?? -1;
    currentQuiz = quiz;
    selectedAnswers = {};
    quizResults = {};
    quizSubmitted = false;
    quizScore = 0;
    showQuiz = true;
  }

  function resetQuiz() {
    if (!currentQuiz) return;
    selectedAnswers = {};
    quizResults = {};
    quizSubmitted = false;
    quizScore = 0;
  }

  async function handleQuizSubmit() {
    if (!currentQuiz) return;
    
    let correctAnswers = 0;
    currentQuiz.quiz.forEach((question, index) => {
      const isCorrect = selectedAnswers[index] === question.answer;
      quizResults[index] = isCorrect;
      if (isCorrect) correctAnswers++;
    });

    quizScore = Math.round((correctAnswers / currentQuiz.quiz.length) * 100);
    quizSubmitted = true;

    if ($user && moduleProgress[currentModule]) {
      const updatedProgress = {
        ...moduleProgress[currentModule],
        completed: quizScore >= 70,
        quizAttempts: (moduleProgress[currentModule].quizAttempts || 0) + 1,
        bestScore: Math.max(quizScore, moduleProgress[currentModule].bestScore || 0),
        lastAttemptDate: new Date()
      };

      try {
        await updateModuleProgress($user.uid, $page.params.id, currentModule, updatedProgress);
        moduleProgress[currentModule] = updatedProgress;
      } catch (err) {
        console.error('Error updating module progress:', err);
      }
    }
  }

  function handlePlaylistClick() {
    if (!courseDetails?.Final_Module_YouTube_Video_URL?.length) return;
    
    try {
      // Extract video IDs from URLs
      const videoIds = courseDetails.Final_Module_YouTube_Video_URL
        .map(url => {
          const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)/i);
          return match ? match[1] : null;
        })
        .filter(id => id !== null);

      if (videoIds.length > 0) {
        // Create a YouTube playlist URL with the video IDs and course title
        const playlistTitle = encodeURIComponent(courseDetails.Final_Course_Title || '');
        const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}&title=${playlistTitle}`;
        window.open(playlistUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating YouTube playlist URL:', error);
    }
  }

  async function checkAnswers() {
    if (!currentQuiz) return;
    
    quizResults = currentQuiz.quiz.map((question, index) => 
      selectedAnswers[index] === question.answer
    );
    
    const correctAnswers = quizResults.filter(result => result).length;
    quizScore = Math.round((correctAnswers / currentQuiz.quiz.length) * 100);
    quizSubmitted = true;

    if ($user) {
      try {
        const updatedProgress = {
          completed: quizScore >= 70,
          quizAttempts: (moduleProgress[currentModule]?.quizAttempts || 0) + 1,
          bestScore: Math.max(quizScore, moduleProgress[currentModule]?.bestScore || 0),
          lastAttemptDate: new Date()
        };

        await updateModuleProgress($user.uid, $page.params.id, currentModule, updatedProgress);
        moduleProgress[currentModule] = updatedProgress;
      } catch (err) {
        console.error('Error updating module progress:', err);
      }
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-red-50 to-white text-red-900">
  <main class="container mx-auto px-4 py-8 max-w-4xl">
    {#if loading}
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto"></div>
        <p class="mt-4">Loading course...</p>
      </div>
    {:else if error}
      <div class="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    {:else if courseDetails}
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-red-800 mb-4">{courseDetails.Final_Course_Title}</h1>
        <p class="text-lg text-red-700">{courseDetails.Final_Course_Objective}</p>
      </header>
      <!-- Course Progress bar-->
      <div class="mb-8">
        <div class="flex justify-between text-sm text-gray-600 mb-2">
          <span>Course Progress</span>
          <span>{moduleProgress.filter(m => m?.completed).length} of {courseDetails?.Final_Module_Title.length} modules completed</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style="width: {courseDetails ? (moduleProgress.filter(m => m?.completed).length / courseDetails.Final_Module_Title.length * 100) : 0}%"
          />
        </div>
      </div>

      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Course Introduction</h2>
        <p class="text-gray-700">{courseDetails.Final_Course_Introduction}</p>
      </div>

      {#each courseDetails.Final_Module_Title as moduleTitle, index}
        <section class="border rounded-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">Module {index + 1}: {moduleTitle}</h2>
            {#if moduleProgress[index]?.completed}
              <span class="text-green-500 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Completed
              </span>
            {/if}
          </div>
          <p class="mb-4 text-gray-600">{courseDetails.Final_Module_Objective[index]}</p>
          
          {#if courseDetails.Final_Module_YouTube_Video_URL[index]}
            <div class="flex-grow mb-4 relative" style="min-height: 400px;">
              <iframe
                src={`https://www.youtube.com/embed/${new URL(courseDetails.Final_Module_YouTube_Video_URL[index]).searchParams.get('v')}?enablejsapi=0&origin=${window.location.origin}`}
                title={moduleTitle}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
                class="absolute inset-0 w-full h-full rounded"
              ></iframe>
            </div>
          {/if}

          <div class="mt-auto">
            {#if courseDetails?.Final_Module_Quiz?.[index]?.quiz?.length > 0}
              <button
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                on:click={() => {
                  const moduleQuiz = courseDetails?.Final_Module_Quiz?.[index];
                  if (!moduleQuiz) {
                    console.error(`No quiz found for module ${index + 1}`);
                    return;
                  }
                  startQuiz(moduleQuiz, index);
                }}
              >
                Take Module Quiz
              </button>
            {/if}
          </div>
        </section>
      {/each}

      <div class="mt-8">
        <h2 class="text-2xl font-semibold mb-4">Final Course Quiz</h2>
        <button
          class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
          on:click={() => startQuiz(courseDetails?.Final_Course_Quiz)}
        >
          Take Final Quiz
        </button>
      </div>

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
                    on:click={resetQuiz}
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

      <div class="mt-8">
        <h2 class="text-2xl font-semibold mb-4">Course Conclusion</h2>
        <p class="text-gray-700">{courseDetails.Final_Course_Conclusion}</p>
      </div>

      <div class="mt-12 border-t pt-8">
        <div class="flex flex-col items-center gap-4">
          <h3 class="text-xl font-semibold">Watch Complete Course</h3>
          <button
            on:click={handlePlaylistClick}
            class="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Open YouTube Playlist
          </button>
          <p class="text-sm text-gray-600 text-center max-w-md">
            Watch all course videos in sequence on YouTube. This will open in a new tab.
          </p>
        </div>
      </div>
    {:else}
      <div class="text-center py-8">No course data available</div>
    {/if}
  </main>
</div> 