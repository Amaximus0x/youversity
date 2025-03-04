<script lang="ts">
    import { goto } from "$app/navigation";
    import { createEventDispatcher } from "svelte";
    import type { Quiz } from "$lib/types/course";

    const dispatch = createEventDispatcher();

    export let score: number = 0;
    export let courseId: string;
    export let quizData: Quiz;
    export let selectedAnswers: Record<number, string>;
    export let moduleId: number;

    let message = getScoreMessage(score);

    function getScoreMessage(score: number): {
        title: string;
        description: string;
    } {
        if (score === 100) {
            return {
                title: "Perfect Score! You're on fire! 🔥",
                description:
                    "You scored 100% on this quiz. Amazing work! You've mastered this module. You can review your answers, retake the quiz for fun, or move on to the next module.",
            };
        } else if (score >= 80) {
            return {
                title: "Great job, you passed!",
                description: `You scored ${score}% on this quiz. Keep up the momentum! You can review your answers, retake the quiz for a better score, or move on to the next module.`,
            };
        } else {
            return {
                title: "You're Almost there,\nKeep going!",
                description: `You scored ${score}% on this quiz. No worries! You can review your answers, try again, or move on to the next module. Learning is all about progress!`,
            };
        }
    }

    function handleRetake() {
        dispatch('retake');
        dispatch('close');
    }

    function handleReview() {
        dispatch('review');
    }

    function handleContinue() {
        if (score >= 80) {
            // If passed, continue to next module
            goto(`/course/${courseId}`);
        } else {
            // If failed, stay on current module
            goto(`/course/${courseId}`);
        }
    }
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center">
    <!-- Backdrop - Add on:click handler -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="absolute inset-0 bg-black/50"
        on:click={() => dispatch('close')}
        on:keydown={(e) => e.key === "Escape" && dispatch('close')}
    ></div>

    <!-- Modal - Add stopPropagation to prevent closing when clicking inside -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
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
                    >Final Quiz</span
                >
            </div>
            <button
                class="items-end justify-end p-2 border border-light-border dark:border-dark-border rounded-full"
                on:click={() => dispatch('close')}
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
                {:else if score >= 80}
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
            class="w-full mt-4 px-4 lg:px-2.5 py-4 flex flex-col gap-2.5 items-center justify-center border-t border-light-border dark:border-dark-border"
        >
            {#if score >= 80}
                <div class="flex flex-col gap-2.5">
                    <button
                        class="w-full lg:w-[300px] px-4 py-2 bg-brand-red hover:bg-ButtonHover text-white rounded-2xl text-semi-body transition-colors"
                        on:click={handleContinue}
                    >
                        {#if moduleId === 9}
                            Continue to course Conclusion
                        {:else}
                            Continue to module {moduleId + 2}
                        {/if}
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
            {:else}
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
                    >
                        {#if moduleId === 9}
                            Continue to course Conclusion
                        {:else}
                            Continue to module {moduleId + 2}
                        {/if}
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>
