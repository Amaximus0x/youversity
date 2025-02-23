<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { user } from "$lib/stores/auth";
  // import QuizResult from './QuizResult.svelte';

  // Static quiz data for now
  const quiz = {
      title: "Mastering motion design: From concept to creation",
      quiz: [
          {
              id: 1,
              question:
                  "How can principles of motion design enhance storytelling and user engagement across different media?",
              answer: 'a',
              options: {
                 a: "Guide attention with smooth transitions.",
                 b: "Establish hierarchy and emphasize key elements.",
                 c: "Evoke emotions through timing and pacing.",
                 d: "Ensure consistency in branding and visuals.",
              },
              type: "checkbox",
          },
          {
              id: 2,
              question:
                  "What are the key steps in transforming a static concept into a dynamic motion design project?",
              answer: 'a',
              options: {
                 a: "True",
                 b: "False",
              },
              type: "radio",
          },
          {
              id: 3,
              question:
                  "How do timing, easing, and transitions improve motion design?",
              answer: 'c',
              options: {
                 a: "Guide attention with smooth transitions.",
                 b: "Establish hierarchy and emphasize key elements.",
                 c: "Evoke emotions through timing and pacing.",
                 d: "Ensure consistency in branding and visuals.",
              },
              type: "checkbox",
          },
          {
              id: 4,
              question:
                  "How do timing, easing, and transitions improve motion design?",
              answer: 'b',
              options: {
                 a: "Guide attention with smooth transitions.",
                 b: "Establish hierarchy and emphasize key elements.",
                 c: "Evoke emotions through timing and pacing.",
                 d: "Ensure consistency in branding and visuals.",
              },
              type: "checkbox",
          },
          {
              id: 5,
              question:
                  "How do timing, easing, and transitions improve motion design?",
              answer: 'a',
              options: {
                 a: "Guide attention with smooth transitions.",
                 b: "Establish hierarchy and emphasize key elements.",
                 c: "Evoke emotions through timing and pacing.",
                 d: "Ensure consistency in branding and visuals.",
              },
              type: "checkbox",
          },
      ],
  };

  let selectedAnswers: { [key: number]: string | string[] } = {};
  let showQuizResult = false;
  let quizScore = 60; // This will come from your quiz logic

  // Track if all questions are answered
  $: isAllAnswered =
      quiz?.quiz.every((q) => selectedAnswers[q.id] !== undefined) ||
      false;

  function handleOptionSelect(questionId: number, option: string) {
      selectedAnswers[questionId] = option;
  }

  function isOptionSelected(questionId: number, option: string): boolean {
      return selectedAnswers[questionId] === option;
  }

  function handleSubmit() {
      // Calculate score and show result
      showQuizResult = true;
  }

  function handleQuizRetake() {
      showQuizResult = false;
      // Reset quiz state
  }

  function handleQuizReview() {
      // Implement review logic
  }

  onMount(() => {
      // if (!$user) {
      //   goto('/login');
      // }
  });
</script>

<div class="w-full -mx-5 min-h-[calc(100vh-85px)] flex flex-col">
  <!-- Mobile Layout -->
  <div class="lg:hidden flex flex-col min-h-[calc(100vh-85px)]">
      <!-- Mobile header -->
      <div class="w-[calc(100%+40px)] -mr-5 sticky top-[85px] z-40 bg-BackgroundRed">
          <div class="px-5 pt-1 pb-4">
              <div class="flex flex-col gap-4 items-start">
                  <!-- back button -->
                  <button
                      class="flex items-center gap-2 text-Black hover:opacity-70"
                      on:click={() => goto(`/course/${$page.params.id}`)}
                  >
                      <img
                          src="/icons/arrow-left.svg"
                          alt="Back"
                          class="w-6 h-6"
                      />
                  </button>
                  <!-- quiz title -->
                  <div
                      class="w-full flex flex-col gap-6 bg-BackgroundRed border border-light-border dark:border-dark-border rounded-2xl p-4"
                  >
                      <h1 class="text-light-text-secondary dark:text-dark-text-secondary text-h4-medium">
                          Final Quiz
                      </h1>
                      <p class="text-light-text-primary dark:text-dark-text-primary text-h4 font-bold">
                          {quiz.title}
                      </p>
                  </div>
              </div>
          </div>
      </div>

      <!-- Mobile content -->
      <div class="mt-[23px] pl-5 flex-1 pb-8">
          <!-- Questions -->
          <div class="space-y-8">
              {#each quiz.quiz as question, index}
                  <div class="flex flex-col gap-4 text-body-semibold">
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
                                          name={`question-${question.id}`}
                                          value={key}
                                          checked={isOptionSelected(question.id, key)}
                                          on:change={() => handleOptionSelect(question.id, key)}
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
                                  <span class="text-semi-body text-Black group-hover:opacity-90">
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
                  class="w-full px-6 py-3 rounded-2xl text-semibody-medium transition-colors flex items-center justify-center gap-2 {isAllAnswered 
                      ? 'bg-brand-red hover:bg-ButtonHover text-white' 
                      : 'bg-Black/5 text-light-text-tertiary'}"
                  disabled={!isAllAnswered}
                  on:click={handleSubmit}
              >
                  Submit
                  <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g id="arrow-right">
                      <path id="Vector" d="M20.5 12H4.50002" stroke={isAllAnswered ? "white" : "Grey"} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path id="Vector_2" d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7" stroke={isAllAnswered ? "white" : "Grey"} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </g>
              </svg>
              </button>
          </div>
      </div>
  </div>

  <!-- Desktop Layout -->
  <div class="hidden lg:flex lg:flex-col lg:h-[calc(100vh-118px)] lg:fixed lg:w-[calc(100%-284px)] lg:top-[116px] bg-light-background dark:bg-dark-background">
      <!-- Desktop Header - Fixed -->
      <div class="flex-shrink-0 pl-5 pb-6 ">
          <div class="p-4 flex gap-6 items-center justify-between border border-light-border dark:border-dark-border rounded-2xl">
              <p class="text-Black text-h4 font-bold">{quiz.title}</p>
              <h1 class="text-light-text-secondary dark:text-dark-text-secondary text-h4-medium text-nowrap">Final Quiz</h1>
          </div>
      </div>

      <!-- Questions Container - Scrollable -->
      <div class="flex-1 overflow-hidden relative ">
          <div class="absolute inset-0 overflow-y-auto custom-scrollbar pl-5 pr-8">
              <div class="space-y-8 pb-8">
                  {#each quiz.quiz as question, index}
                      <div class="flex flex-col gap-4 text-body-semibold">
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
                                              name={`question-${question.id}`}
                                              value={key}
                                              checked={isOptionSelected(question.id, key)}
                                              on:change={() => handleOptionSelect(question.id, key)}
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
                                      <span class="text-semi-body text-Black group-hover:opacity-90">
                                          {value}
                                      </span>
                                  </label>
                              {/each}
                          </div>
                      </div>
                  {/each}
              </div>
          </div>
      </div>

      <!-- Desktop Footer - Fixed -->
      <div class="flex-shrink-0 flex justify-between items-center px-5 pr-8 py-5 pt-8 border-t border-light-border">
          <button 
              class="flex items-center gap-2 px-4 py-2 text-brand-red text-semi-body bg-Black/5 rounded-lg border border-light-border dark:border-dark-border"
              on:click={() => goto(`/course/${$page.params.id}`)}
          >
              Leave Quiz
              <img src="/icons/logout-03.svg" alt="Leave" class="w-6 h-6" />
          </button>
          <button
              class="px-4 py-2 rounded-lg text-semibody-medium transition-colors flex items-center justify-center gap-2 {isAllAnswered 
                  ? 'bg-brand-red hover:bg-ButtonHover text-white' 
                  : 'bg-Black/5 text-light-text-tertiary'}"
              disabled={!isAllAnswered}
              on:click={handleSubmit}
          >
              Submit
              <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g id="arrow-right">
                      <path id="Vector" d="M20.5 12H4.50002" stroke={isAllAnswered ? "white" : "Grey"} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path id="Vector_2" d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7" stroke={isAllAnswered ? "white" : "Grey"} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </g>
              </svg>
          </button>
      </div>
  </div>
</div>

<!-- {#if showQuizResult}
<QuizResult
  score={quizScore}
  courseId={$page.params.id}
  quizData={quiz}
  selectedAnswers={selectedAnswers}
  on:retake={handleQuizRetake}
  on:review={handleQuizReview}
  on:close={() => showQuizResult = false}
/>
{/if} -->

<style>
.radio-circle {
  color: rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease-in-out;
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
</style>
