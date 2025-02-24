<script lang="ts">
  import { goto } from "$app/navigation";
  import { createEventDispatcher } from "svelte";
  import { quizStore } from "$lib/stores/quiz";

  const dispatch = createEventDispatcher();

  export let courseId: string;
  export let moduleIndex: number;
  export let quiz: any;

  // Subscribe to the quiz store
  let score: number;
  let quizData: any;
  
  quizStore.subscribe(store => {
      score = store.score;
      quizData = store.quizData;
      console.log('QuizResultModal store data:', { score, quizData });
  });

  $: message = getScoreMessage(score);

  function getScoreMessage(score: number): {
      title: string;
      description: string;
  } {
      console.log('Calculating message for score:', score);
      if (score === 100) {
          return {
              title: "Perfect Score! You're on fire! 🔥",
              description: "You scored 100% on this quiz. Amazing work! You've mastered this module. You can review your answers, retake the quiz for fun, or move on to the next module.",
          };
      } else if (score >= 70) {
          return {
              title: "Great job, you passed!",
              description:
                  `You scored ${score}% on this quiz. Keep up the momentum! You can review your answers, retake the quiz for a better score, or move on to the next module.`,
          };
      } else {
          return {
              title: "You're Almost there,\nKeep going!",
              description:
                  `You scored ${score}% on this quiz. No worries! You can review your answers, try again, or move on to the next module. Learning is all about progress!`,
          };
      }
  }

  function handleRetake() {
      const quizToRetake = quiz || quizData;
      console.log('Retaking quiz with data:', quizToRetake);
      
      if (!quizToRetake) {
          console.error('No quiz data available for retake');
          return;
      }

      // First dispatch the retake event with the quiz data
      dispatch("retake", { quiz: quizToRetake });
      
      // Then close modal and reset store
      handleClose();
      quizStore.reset();
  }

  function handleReview() {
      // Store the quiz data before navigation
      goto(`/course/${courseId}/quiz/answers`);
  }

  function handleContinue() {
      handleClose();
      goto(`/course/${courseId}`);
  }

  function handleClose() {
      dispatch("close");
  }
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center">
  <!-- Backdrop - Add on:click handler -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div 
      class="absolute inset-0 bg-black/50" 
      on:click={handleClose}
      on:keydown={(e) => e.key === 'Escape' && handleClose()}
  ></div>

  <!-- Modal - Add stopPropagation to prevent closing when clicking inside -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
      class="relative w-full max-w-[390px] lg:max-w-[808px] pb-4 bg-gradient-light dark:bg-gradient-dark rounded-2xl lg:rounded-2xl overflow-hidden"
      on:click|stopPropagation={() => {}}
  >
      <!-- Header -->
      <div
          class="hidden lg:flex items-center pl-14 pr-4 pt-8 pb-4 border-b border-light-border dark:border-dark-border"
      >
          <div class="w-full flex items-center justify-center">
              <span
                  class=" text-h4-medium text-light-text-primary dark:text-dark-text-primary"
                  >Not using it Module {moduleIndex + 1} Quiz</span
              >
          </div>
          <button
              class="items-end justify-end p-2 border border-light-border dark:border-dark-border rounded-full"
              on:click={handleClose}
              on:keydown={(e) => e.key === 'Enter' && handleClose()}
          >
              <img
                  src="/icons/cancel-circle.svg"
                  alt="Close"
                  class="w-6 h-6"
              />
          </button>
      </div>

      <!-- Content -->
      <div class="pt-6 lg:pt-2 flex flex-col items-center text-center pb-8">
          <!-- Retake Icon -->
          <div class="w-[100px] h-[100px]">
              {#if score === 100}
                  <img src="/images/quiz-perfect.gif" alt="Perfect Score" />
              {:else if score >= 70}
                  <img src="/images/quiz-passed.gif" alt="Quiz Passed" />
              {:else}
                  <div class="relative">
                      <img
                          src="/images/quiz-failed.gif"
                          alt="Quiz Failed"
                          class="w-full h-full"
                      />
                      <div
                          class="left-[31px] top-[44px] absolute text-white text-[11px] font-semibold font-['Poppins'] leading-tight"
                      >
                          Retake
                      </div>
                  </div>
              {/if}
          </div>

          <!-- Score Display -->
          <div
              class="pt-4 h-[122px] flex-col justify-start items-center inline-flex"
          >
              <div class="px-2.5 py-1 bg-black/5 rounded-[20px]">
                  <div
                      class="text-black text-base font-normal font-['Poppins'] leading-normal"
                  >
                      Your score
                  </div>
              </div>
              <div
                  class="w-[123px] h-[90px] text-center text-black text-5xl font-bold font-['Poppins'] leading-[104px]"
              >
                  {score}%
              </div>
          </div>

          <!-- Message -->
          <h3
              class="pt-4 text-h4 font-bold lg:text-h4-medium lg:font-bold text-light-text-primary dark:text-dark-text-primary whitespace-pre-line mb-4"
          >
              {message.title}
          </h3>
          <p
              class="px-4 text-semi-body text-light-text-tertiary dark:text-dark-text-tertiary max-w-[400px]"
          >
              {message.description}
          </p>
      </div>

      <!-- Footer -->
      <div
          class="px-4 lg:px-2.5 py-4 flex flex-col gap-2.5 items-center justify-center border-t border-light-border dark:border-dark-border"
      >
          <!-- quiz passed footer -->
          {#if score >= 70}
          <div class="flex flex-col gap-2.5">
            <button
                class="w-full lg:w-[300px] px-4 py-2 bg-brand-red hover:bg-ButtonHover text-white rounded-2xl text-semi-body transition-colors"
                on:click={handleContinue}
                >Continue to module {moduleIndex + 2}
            </button>
            <button
                class="w-full lg:w-[300px] px-4 py-2 bg-Green text-dark-text-primary dark:text-dark-text-primary rounded-2xl text-semi-body transition-colors"
                on:click={handleReview}
                >Review answers
            </button>
            <button
                class="w-full lg:w-[300px] px-4 py-2 text-brand-turquoise rounded-2xl text-semi-body transition-colors"
                on:click={handleRetake}
                >Retake quiz
            </button>
        </div>
          {/if}

          <!-- quiz faild footer -->
          {#if score < 70}
              <div class="flex flex-col gap-2.5">
                  <button
                      class="w-full lg:w-[300px] px-4 py-2 bg-brand-red hover:bg-ButtonHover text-white rounded-2xl text-semi-body transition-colors"
                      on:click={handleRetake}
                      >Retake quiz
                  </button>
                  <button
                      class="w-full lg:w-[300px] px-4 py-2 bg-Green text-dark-text-primary dark:text-dark-text-primary rounded-2xl text-semi-body transition-colors"
                      on:click={handleReview}
                      >Review answers
                  </button>
                  <button
                      class="w-full lg:w-[300px] px-4 py-2 text-brand-turquoise rounded-2xl text-semi-body transition-colors"
                      on:click={handleContinue}
                      >Continue to module {moduleIndex + 2}
                  </button>
              </div>
          {/if}
      </div>
  </div>
</div>

<style>
  /* Add any additional styles here */
</style>
