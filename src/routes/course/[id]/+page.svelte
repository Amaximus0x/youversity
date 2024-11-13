<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import type { FinalCourseStructure, Quiz, QuizQuestion } from '$lib/types/course';
  import { getUserCourse, updateUserCourse } from '$lib/firebase';

  let courseDetails: FinalCourseStructure | null = null;
  let loading = true;
  let error: string | null = null;
  let playlistUrl: string | null = null;

  let showQuiz = false;
  let currentQuiz: Quiz | null = null;
  let selectedAnswers: { [key: string]: string } = {};
  let quizResults: { [key: string]: boolean } = {};

  const handleCreatePlaylist = () => {
    if (courseDetails?.YouTube_Playlist_URL) {
      playlistUrl = courseDetails.YouTube_Playlist_URL;
      window.open(playlistUrl, '_blank');
    }
  };

  async function toggleModuleCompletion(index: number) {
    if (!courseDetails || !$user) return;
    
    const updatedModules = [...courseDetails.completed_modules];
    updatedModules[index] = !updatedModules[index];
    
    try {
      await updateUserCourse($user.uid, $page.params.id, {
        completed_modules: updatedModules
      });
      courseDetails.completed_modules = updatedModules;
    } catch (err) {
      console.error('Error updating module completion:', err);
    }
  }

  function startQuiz(quiz: Quiz | undefined, moduleIndex?: number) {
    if (!quiz) {
      console.error('Quiz not found');
      return;
    }

    // Check if quiz has the correct structure
    if (!Array.isArray(quiz.quiz)) {
      console.error('Invalid quiz structure');
      return;
    }

    // Ensure there are questions
    if (quiz.quiz.length === 0) {
      console.error('No questions found in quiz');
      return;
    }

    currentQuiz = quiz;
    selectedAnswers = {};
    quizResults = {};
    showQuiz = true;
  }

  function checkAnswers() {
    if (!currentQuiz || !currentQuiz.quiz) return;
    
    quizResults = {};
    currentQuiz.quiz.forEach((question, index) => {
      quizResults[index] = selectedAnswers[index] === question.answer;
    });
  }

  function handlePlaylistClick() {
    if (courseDetails?.YouTube_Playlist_URL) {
      window.open(courseDetails.YouTube_Playlist_URL, '_blank');
    }
  }

  onMount(async () => {
    try {
      if (!$user) {
        goto('/login');
        return;
      }

      const courseId = $page.params.id;
      if (!courseId) {
        throw new Error('Course ID not found');
      }

      loading = true;
      const course = await getUserCourse($user.uid, courseId);
      
      if (!course) {
        throw new Error('Course not found');
      }

      console.log('Course data loaded:', {
        hasModuleQuizzes: Boolean(course.Final_Module_Quiz),
        moduleQuizCount: course.Final_Module_Quiz?.length,
        hasCourseQuiz: Boolean(course.Final_Course_Quiz),
        firstModuleQuiz: course.Final_Module_Quiz?.[0]
      });

      if (!course.completed_modules) {
        course.completed_modules = new Array(course.Final_Module_Title.length).fill(false);
      }

      courseDetails = course;
    } catch (err) {
      console.error('Error loading course:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      loading = false;
    }
  });
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

      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Course Introduction</h2>
        <p class="text-gray-700">{courseDetails.Final_Course_Introduction}</p>
      </div>

      {#each courseDetails.Final_Module_Title as moduleTitle, index}
        <section class="mb-8 bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-semibold mb-4">Module {index + 1}: {moduleTitle}</h3>
          <p class="mb-4 text-gray-600">{courseDetails.Final_Module_Objective[index]}</p>
          
          {#if courseDetails.Final_Module_YouTube_Video_URL[index]}
            <div class="aspect-w-16 aspect-h-9 mb-4">
              <iframe
                src={`https://www.youtube.com/embed/${new URL(courseDetails.Final_Module_YouTube_Video_URL[index]).searchParams.get('v')}?enablejsapi=0&origin=${window.location.origin}`}
                title={moduleTitle}
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
                class="w-full h-full rounded"
              ></iframe>
            </div>
          {/if}

          <div class="mt-4">
            <button
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              on:click={() => {
                const moduleQuiz = courseDetails?.Final_Module_Quiz?.[index];
                if (!moduleQuiz) {
                  console.error(`No quiz found for module ${index + 1}`);
                  return;
                }
                console.log('Module Quiz Data:', {
                  moduleIndex: index,
                  quizData: courseDetails?.Final_Module_Quiz?.[index],
                  hasQuiz: Boolean(courseDetails?.Final_Module_Quiz?.[index]?.quiz),
                  questionCount: courseDetails?.Final_Module_Quiz?.[index]?.quiz?.length
                });
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
                on:click={checkAnswers}
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