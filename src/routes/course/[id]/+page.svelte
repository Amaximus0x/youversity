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
  let selectedAnswers: string[] = [];
  let currentModule = 0;
  let showQuiz = false;
  let quizSubmitted = false;
  let quizScore = 0;
  let currentQuiz: Quiz | null = null;
  let quizResults: (boolean | undefined)[] = [];

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
    
    currentModule = moduleIndex ?? -1; // -1 indicates final quiz
    currentQuiz = quiz;
    selectedAnswers = new Array(quiz.quiz?.length || 0).fill('');
    quizResults = new Array(quiz.quiz?.length || 0).fill(undefined);
    quizSubmitted = false;
    quizScore = 0;
    showQuiz = true;
  }

  async function handleQuizSubmit() {
    if (!courseDetails?.Final_Module_Quiz?.[currentModule]) return;
    
    const quiz = courseDetails.Final_Module_Quiz[currentModule];
    let correctAnswers = 0;
    
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    quizScore = Math.round((correctAnswers / quiz.questions.length) * 100);
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

  function resetQuiz() {
    selectedAnswers = new Array(courseDetails?.Final_Module_Quiz?.[currentModule]?.questions?.length || 0).fill('');
    quizSubmitted = false;
    quizScore = 0;
  }

  function handlePlaylistClick() {
    if (!courseDetails?.Final_Module_YouTube_Video_URL?.length) return;
    
    // Create a YouTube playlist URL from the video URLs
    const videoIds = courseDetails.Final_Module_YouTube_Video_URL
      .map(url => {
        try {
          return new URL(url).searchParams.get('v');
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (videoIds.length) {
      // Open YouTube playlist in a new tab
      const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
      window.open(playlistUrl, '_blank');
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
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 class="text-xl font-semibold mb-4">Quiz</h3>
            
            {#each currentQuiz.quiz as question, index}
              <div class="mb-6">
                <p class="font-medium mb-2">{index + 1}. {question.question}</p>
                
                {#each Object.entries(question.options) as [key, value]}
                  <label class="block mb-2">
                    <input
                      type="radio"
                      name="question{index}"
                      value={key}
                      bind:group={selectedAnswers[index]}
                      class="mr-2"
                    />
                    {value}
                  </label>
                {/each}

                {#if quizResults[index] !== undefined}
                  <p class={quizResults[index] ? "text-green-500" : "text-red-500"}>
                    {quizResults[index] ? "Correct!" : "Incorrect"}
                  </p>
                {/if}
              </div>
            {/each}

            <div class="flex justify-end gap-4">
              <button
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                on:click={async () => {
                  await checkAnswers();
                }}
              >
                Check Answers
              </button>
              <button
                class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                on:click={() => showQuiz = false}
              >
                Close
              </button>
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