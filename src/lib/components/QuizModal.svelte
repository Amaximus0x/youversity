<script lang="ts">
  import { onDestroy } from 'svelte';
  import QuizTimer from './QuizTimer.svelte';
  import type { Quiz } from '$lib/types/course';

  export let show = false;
  export let quiz: Quiz | null = null;
  export let onClose: () => void;
  export let onSubmit: (score: number, timeSpent: number) => void;
  export let moduleTitle: string = '';

  let currentQuestionIndex = 0;
  let selectedAnswer: string | null = null;
  let userAnswers: string[] = [];
  let quizStarted = false;
  let quizCompleted = false;
  let score = 0;
  let timeSpent = 0;

  $: progress = quiz?.quiz ? ((currentQuestionIndex + 1) / quiz.quiz.length) * 100 : 0;
  $: questionsRemaining = quiz?.quiz ? quiz.quiz.length - (currentQuestionIndex + 1) : 0;

  function startQuiz() {
    if (!quiz?.quiz) return;
    quizStarted = true;
    userAnswers = new Array(quiz.quiz.length).fill(null);
  }

  function handleAnswerSelect(answer: string) {
    selectedAnswer = answer;
    userAnswers[currentQuestionIndex] = answer;
  }

  function nextQuestion() {
    if (!quiz?.quiz) return;
    if (currentQuestionIndex < quiz.quiz.length - 1) {
      currentQuestionIndex++;
      selectedAnswer = userAnswers[currentQuestionIndex];
    } else {
      completeQuiz();
    }
  }

  function completeQuiz() {
    if (!quiz?.quiz) return;
    score = userAnswers.reduce((acc, answer, index) => {
      return answer === quiz.quiz[index].answer ? acc + 1 : acc;
    }, 0);

    const scorePercentage = (score / quiz.quiz.length) * 100;
    quizCompleted = true;
    onSubmit(scorePercentage, timeSpent);
  }

  function handleClose() {
    show = false;
    onClose();
  }
</script>

{#if show && quiz}
  <div class="fixed inset-0 bg-Black/30 flex items-center justify-center p-4 z-[100]">
    <div class="bg-white dark:bg-dark-bg-primary rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Quiz Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-h4-medium text-Black dark:text-White">
            {moduleTitle}
          </h1>
          <p class="text-semi-body text-Black2">Quiz</p>
        </div>
        <button
          class="flex items-center gap-2 text-semi-body text-Black2 hover:text-Black"
          on:click={handleClose}
        >
          <img src="/icons/close.svg" alt="Leave" class="w-6 h-6" />
          Leave Quiz
        </button>
      </div>

      {#if !quizStarted}
        <!-- Quiz Start Screen -->
        <div class="max-w-2xl mx-auto text-center">
          <p class="text-body text-Black2 mb-4">
            This assessment evaluates the learner's basic understanding of the module content.
          </p>
          <p class="text-semi-body text-Black2 mb-8">
            {quiz.quiz.length} Questions
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
          <p class="text-h4 text-Black2 mb-8">Your Score: {score}/{quiz.quiz.length}</p>
          <button
            class="px-8 py-3 bg-Green hover:bg-GreenHover text-white rounded-2xl transition-colors"
            on:click={handleClose}
          >
            Return to Course
          </button>
        </div>
      {:else}
        <!-- Quiz Progress -->
        <div class="max-w-2xl mx-auto mb-8">
          <div class="flex items-center justify-between mb-2">
            <span class="text-semi-body text-Black2">Question {currentQuestionIndex + 1}/{quiz.quiz.length}</span>
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
              {quiz.quiz[currentQuestionIndex].question}
            </h3>

            <!-- Answer Options -->
            <div class="space-y-4">
              {#each Object.entries(quiz.quiz[currentQuestionIndex].options) as [key, value]}
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
                {currentQuestionIndex === quiz.quiz.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if} 