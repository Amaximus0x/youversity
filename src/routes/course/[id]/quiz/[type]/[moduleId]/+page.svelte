<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/auth";
  import { getUserCourse, updateEnrollmentQuizResult } from "$lib/firebase";
  import QuizTimer from "$lib/components/QuizTimer.svelte";
  import type { FinalCourseStructure } from "$lib/types/course";

  let courseDetails: FinalCourseStructure | null = null;
  let loading = true;
  let error: string | null = null;
  let currentQuestionIndex = 0;
  let selectedAnswer: string | null = null;
  let quizQuestions: any[] = [];
  let userAnswers: string[] = [];
  let quizStarted = false;
  let quizCompleted = false;
  let score = 0;
  let timeSpent = 0;

  $: isModuleQuiz = $page.params.type === 'module';
  $: moduleId = parseInt($page.params.moduleId);
  $: progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
  $: questionsRemaining = quizQuestions.length - (currentQuestionIndex + 1);

  onMount(async () => {
    try {
      if (!$user) {
        goto("/login");
        return;
      }

      const courseData = await getUserCourse($user.uid, $page.params.id);
      if (!courseData) {
        error = "Course not found";
        return;
      }

      // Extract course details from the response
      courseDetails = courseData.course as FinalCourseStructure;
      
      // Get quiz questions based on type
      if (isModuleQuiz && courseDetails?.Final_Module_Quiz?.[moduleId]?.quiz) {
        quizQuestions = courseDetails.Final_Module_Quiz[moduleId].quiz;
      } else if (courseDetails?.Final_Course_Quiz?.quiz) {
        quizQuestions = courseDetails.Final_Course_Quiz.quiz;
      }

      if (!quizQuestions.length) {
        error = "No quiz questions found";
        return;
      }

      loading = false;
    } catch (err) {
      console.error("Error loading quiz:", err);
      error = err instanceof Error ? err.message : "Failed to load quiz";
    }
  });

  function startQuiz() {
    quizStarted = true;
    userAnswers = new Array(quizQuestions.length).fill(null);
  }

  function handleAnswerSelect(answer: string) {
    selectedAnswer = answer;
    userAnswers[currentQuestionIndex] = answer;
  }

  function nextQuestion() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      currentQuestionIndex++;
      selectedAnswer = userAnswers[currentQuestionIndex];
    } else {
      completeQuiz();
    }
  }

  async function completeQuiz() {
    // Calculate score
    score = userAnswers.reduce((acc, answer, index) => {
      return answer === quizQuestions[index].answer ? acc + 1 : acc;
    }, 0);

    const scorePercentage = (score / quizQuestions.length) * 100;

    // Update quiz results in Firebase
    try {
      await updateEnrollmentQuizResult(
        $user!.uid,
        $page.params.id,
        isModuleQuiz ? moduleId : null,
        scorePercentage,
        timeSpent,
        true // completed parameter
      );
    } catch (error) {
      console.error("Error updating quiz results:", error);
    }

    quizCompleted = true;
  }

  function handleLeaveQuiz() {
    goto(`/course/${$page.params.id}`);
  }
</script>

<div class="min-h-screen bg-white dark:bg-dark-bg-primary">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise" />
    </div>
  {:else if error}
    <div class="text-brand-red text-center p-4">{error}</div>
  {:else}
    <div class="container mx-auto px-5 py-8">
      <!-- Quiz Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-h4-medium text-Black dark:text-White">
            {isModuleQuiz && courseDetails?.Final_Module_Title?.[moduleId] 
              ? courseDetails.Final_Module_Title[moduleId] 
              : courseDetails?.Final_Course_Title || 'Quiz'}
          </h1>
          <p class="text-semi-body text-Black2">Quiz</p>
        </div>
        <button
          class="flex items-center gap-2 text-semi-body text-Black2 hover:text-Black"
          on:click={handleLeaveQuiz}
        >
          <img src="/icons/close.svg" alt="Leave" class="w-6 h-6" />
          Leave Quiz
        </button>
      </div>

      {#if !quizStarted}
        <!-- Quiz Start Screen -->
        <div class="max-w-2xl mx-auto text-center">
          <p class="text-body text-Black2 mb-4">
            This assessment evaluates the learner's basic understanding of motion design, principles, and tools.
          </p>
          <p class="text-semi-body text-Black2 mb-8">
            {quizQuestions.length} Questions
          </p>
          <button
            class="px-8 py-3 bg-Green hover:bg-GreenHover text-white rounded-2xl transition-colors"
            on:click={startQuiz}
          >
            Start Quiz
          </button>
        </div>
      {:else if quizCompleted}
        <!-- Quiz Results -->
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-h2 text-Black mb-4">Quiz Completed!</h2>
          <p class="text-h4 text-Black2 mb-8">Your Score: {score}/{quizQuestions.length}</p>
          <button
            class="px-8 py-3 bg-Green hover:bg-GreenHover text-white rounded-2xl transition-colors"
            on:click={handleLeaveQuiz}
          >
            Return to Course
          </button>
        </div>
      {:else}
        <!-- Quiz Progress -->
        <div class="max-w-2xl mx-auto mb-8">
          <div class="flex items-center justify-between mb-2">
            <span class="text-semi-body text-Black2">Question {currentQuestionIndex + 1}/{quizQuestions.length}</span>
            <QuizTimer bind:timeSpent />
          </div>
          <div class="w-full h-2 bg-Black/5 rounded-full overflow-hidden">
            <div
              class="h-full bg-brand-red transition-all duration-300"
              style="width: {progress}%"
            />
          </div>
        </div>

        <!-- Question Card -->
        <div class="max-w-2xl mx-auto">
          <div class="bg-white dark:bg-dark-bg-primary rounded-2xl p-6 shadow-sm">
            <h3 class="text-h4-medium text-Black mb-8">
              {quizQuestions[currentQuestionIndex].question}
            </h3>

            <!-- Answer Options -->
            <div class="space-y-4">
              {#each Object.entries(quizQuestions[currentQuestionIndex].options) as [key, value]}
                <button
                  class="w-full p-4 flex items-center gap-4 rounded-xl border {selectedAnswer === key ? 'border-brand-red bg-brand-red/5' : 'border-Black/5 hover:border-brand-red hover:bg-brand-red/5'} transition-colors"
                  on:click={() => handleAnswerSelect(key)}
                >
                  <span class="w-8 h-8 flex items-center justify-center rounded-full border border-current {selectedAnswer === key ? 'text-brand-red' : 'text-Black2'}">
                    {key.toUpperCase()}
                  </span>
                  <span class="text-body text-Black">{value}</span>
                </button>
              {/each}
            </div>

            <!-- Navigation -->
            <div class="flex justify-between mt-8">
              <span class="text-semi-body text-Black2">
                {questionsRemaining} questions remaining
              </span>
              <button
                class="px-6 py-2 bg-Green hover:bg-GreenHover text-white rounded-xl transition-colors disabled:opacity-50"
                on:click={nextQuestion}
                disabled={!selectedAnswer}
              >
                {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div> 