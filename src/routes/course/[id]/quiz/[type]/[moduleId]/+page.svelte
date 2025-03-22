<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { user } from "$lib/stores/auth";
  import { quizStore } from "$lib/stores/quiz";
  import { currentModuleStore, enrollmentProgressStore } from "$lib/stores/course";
  import type { Quiz, QuizQuestion } from "$lib/types/course";
  import ModuleResultModal from "./ModuleResultModal.svelte";
  import { updateEnrollmentQuizResult } from "$lib/firebase";

  export let data: {
    quiz: Quiz;
    moduleTitle: string;
    moduleId: number;
  };
  const { quiz, moduleTitle, moduleId } = data;

  let selectedAnswers: Record<number, string> = {};
  let showQuizResult = false;
  let quizScore = 0;
  let startTime: Date;
  let isLoading = false;

  // Track if all questions are answered
  $: isAllAnswered = quiz?.quiz.every((_, index) => selectedAnswers[index] !== undefined) || false;

  function handleOptionSelect(questionIndex: number, option: string) {
    selectedAnswers[questionIndex] = option;
  }

  function isOptionSelected(questionIndex: number, option: string): boolean {
    return selectedAnswers[questionIndex] === option;
  }

  function calculateScore() {
    let correctAnswers = 0;
    const totalQuestions = quiz.quiz.length;

    quiz.quiz.forEach((question: QuizQuestion, index: number) => {
      const selectedAnswer = selectedAnswers[index];
      if (selectedAnswer === question.answer) {
        correctAnswers++;
      }
    });

    return Math.round((correctAnswers / totalQuestions) * 100);
  }

  async function handleSubmit() {
    isLoading = true;
    const endTime = new Date();
    const timeSpent = Math.round((endTime.getTime() - startTime.getTime()) / 1000); // in seconds
    quizScore = calculateScore();
    
    // Check if quiz is passed
    const isPassed = quizScore >= 80;
    
    // Create quiz result object
    const quizResult = {
      attempts: 1, // This will be handled by the backend
      score: quizScore,
      timeSpent,
      completedAt: new Date(),
      completed: true,
      passed: isPassed
    };

    try {
      if ($user) {
        // Update enrollment progress with quiz result
        const updatedProgress = await updateEnrollmentQuizResult(
          $user.uid,
          $page.params.id,
          moduleId,
          quizResult
        );

        // Update the enrollment progress store if we got updated data
        if (updatedProgress) {
          const typedProgress = {
            quizResults: updatedProgress.quizResults || { moduleQuizzes: {} },
            moduleProgress: updatedProgress.moduleProgress || {},
            completedModules: Array.isArray(updatedProgress.completedModules) 
              ? [...updatedProgress.completedModules] 
              : [],
            lastAccessedModule: updatedProgress.lastAccessedModule || 0
          };
          enrollmentProgressStore.set(typedProgress);
        }
      }
    } catch (error) {
      console.error('Error updating quiz result:', error);
    } finally {
      isLoading = false;
    }
    
    // Store quiz data in the store for the result page
    quizStore.update(store => ({
      ...store,
      quizData: quiz,
      selectedAnswers,
      score: quizScore,
      moduleIndex: moduleId
    }));

    showQuizResult = true;
  }

  function handleQuizRetake() {
    // Reset all local state
    selectedAnswers = {};
    showQuizResult = false;
    quizScore = 0;
    startTime = new Date();
    
    // Reset the quiz store completely
    quizStore.reset();
    
    // Force radio inputs to reset by clearing their checked state
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    radioInputs.forEach((input) => {
      (input as HTMLInputElement).checked = false;
    });
  }

  function handleQuizReview() {
    goto(`/course/${$page.params.id}/quiz/answers`);
  }

  onMount(() => {
    if (!$user) {
      goto("/login");
      return;
    }
    startTime = new Date();
  });
</script>

<div class="w-full -mx-5 min-h-[calc(100vh-85px)] flex flex-col">
  <!-- Mobile Layout -->
  <div class="lg:hidden flex flex-col min-h-[calc(100vh-70px)]">
      <!-- Mobile header -->
      <div class="w-[calc(100%+40px)] -mr-5 sticky top-[70px] z-40 bg-light-bg-secondary dark:bg-dark-bg-secondary">
          <div class="px-5 pt-6 pb-4">
              <div class="flex  gap-2 items-start">
                  <!-- back button -->
                  <button
                      class="flex items-center gap-2 text-Black hover:opacity-70"
                      on:click={() => goto(`/course/${$page.params.id}`)}
                  >
                  <svg class="w-6 h-6 text-light-text-primary dark:text-dark-text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8.99997 17C8.99997 17 4.00002 13.3176 4 12C3.99999 10.6824 9 7 9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <!-- quiz title -->
                  
                      <p class="text-light-text-primary dark:text-dark-text-primary text-h4-medium">
                          Module {moduleId + 1} Quiz
                      </p>
                  
              </div>
          </div>
      </div>

      <!-- Mobile content -->
      <div class="mt-[23px] pl-5 flex-1 pb-8">
          <!-- Questions -->
          <div class="space-y-8">
              {#each quiz.quiz as question, index}
                  <div class="flex flex-col gap-4 text-body-semibold text-light-text-primary dark:text-dark-text-primary">
                      <div class="flex items-start gap-2">
                          <p>
                              {index + 1}. 
                          </p>
                          <p>
                              {question.question}
                          </p>
                      </div>
                      <div class="space-y-4">
                          {#each Object.entries(question.options) as [key, value]}
                              <label
                                  class="flex items-center gap-3 cursor-pointer group"
                              >
                                  <div class="relative flex items-center">
                                      <input
                                          type="radio"
                                          name={`question-${index}`}
                                          value={key}
                                          checked={isOptionSelected(index, key)}
                                          on:change={() => handleOptionSelect(index, key)}
                                          class="absolute opacity-0 w-6 h-6 cursor-pointer"
                                      />
                                      <div class="radio-circle w-6 h-6 flex items-center justify-center">
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                              <path 
                                                  d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" 
                                                  stroke="currentColor" 
                                                  stroke-width="1.5"
                                              />
                                          </svg>
                                      </div>
                                  </div>
                                  <span class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary group-hover:opacity-90">
                                      {value}
                                  </span>
                              </label>
                          {/each}
                      </div>
                  </div>
              {/each}
          </div>

          <!-- Mobile submit button -->
          <div class="mt-8">
              <button
                  class="w-full px-4 py-2 rounded-lg text-body transition-colors flex items-center justify-center gap-2 {isAllAnswered 
                      ? 'bg-brand-red hover:bg-ButtonHover text-white' 
                      : 'bg-Black/5 dark:bg-White/10 text-light-text-tertiary dark:text-dark-text-tertiary'}"
                  disabled={!isAllAnswered || isLoading}
                  on:click={handleSubmit}
              >
                  {#if isLoading}
                    <div class="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting...</span>
                  {:else}
                    <span>Submit</span>
                    <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g id="arrow-right">
                        <path id="Vector" d="M20.5 12H4.50002" stroke={isAllAnswered ? "white" : "Grey"} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path id="Vector_2" d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7" stroke={isAllAnswered ? "white" : "Grey"} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </g>
                    </svg>
                  {/if}
              </button>
          </div>
      </div>
  </div>
</div>

  

{#if showQuizResult}
<ModuleResultModal
  score={quizScore}
  courseId={$page.params.id}
  quizData={quiz}
  selectedAnswers={selectedAnswers}
  moduleId={moduleId}
  on:retake={handleQuizRetake}
  on:review={handleQuizReview}
  on:close={() => showQuizResult = false}
/>
{/if}

<style>
.radio-circle {
  color: rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease-in-out;
}
:global(.dark) .radio-circle {
        color: rgba(255, 255, 255, 0.1);
    }

input[type="radio"]:checked + .radio-circle {
  color: #EE434A;  /* brand-red color */
}

input[type="radio"]:checked + .radio-circle::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: #EE434A;
  border-radius: 50%;
}

input[type="radio"]:hover:not(:checked) + .radio-circle {
  color: rgba(0, 0, 0, 0.4);
}

/* Remove focus outline */
input[type="radio"]:focus {
  outline: none;
}

input[type="radio"]:focus + .radio-circle {
  outline: none;
}

/* Custom scrollbar styles */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #EE434A #FFF2F3;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #FFF2F3;
  border-radius: 20px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #EE434A;
  border-radius: 20px;
  border: none;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
