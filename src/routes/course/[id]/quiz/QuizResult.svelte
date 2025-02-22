<script lang="ts">
    import { goto } from "$app/navigation";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let score: number = 95;
    export let courseId: string;

    let message = getScoreMessage(score);

    function getScoreMessage(score: number): {
        title: string;
        description: string;
    } {
        if (score === 100) {
            return {
                title: "Congratulations!",
                description: "You've mastered this course. Great job!",
            };
        } else if (score >= 70) {
            return {
                title: "Good job!",
                description:
                    "You're doing well, but there's room for improvement.",
            };
        } else {
            return {
                title: "You're Almost there,\nKeep going!",
                description:
                    "You scored " +
                    score +
                    "%, which means you didn't pass this time. That's okay, learning is a journey!",
            };
        }
    }

    function handleRetake() {
        dispatch("retake");
    }

    function handleReview() {
        dispatch("review");
    }

    function handleRevisit() {
        goto(`/course/${courseId}`);
    }

    function handleClose() {
        dispatch("close");
    }
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50"></div>

    <!-- Modal -->
    <div
        class="relative w-full max-w-[808px] pb-4 bg-white dark:bg-dark-background-primary rounded-t-2xl lg:rounded-2xl overflow-hidden"
    >
        <!-- Header -->
        <div
            class="flex items-center pl-14 pr-4 pt-8 pb-4 border-b border-light-border dark:border-dark-border"
        >
            <div class="w-full flex items-center justify-center">
                <span
                    class=" text-h4-medium text-light-text-primary dark:text-dark-text-primary"
                    >Final Quiz</span
                >
            </div>
            <button
                class="items-end justify-end p-2 border border-light-border dark:border-dark-border rounded-full"
                on:click={handleClose}
            >
                <img
                    src="/images/cancel-circle.svg"
                    alt="Close"
                    class="w-6 h-6"
                />
            </button>
        </div>

        <!-- Content -->
        <div class=" flex flex-col items-center text-center pb-8">
            <!-- Retake Icon -->
            <div class="w-[100px] h-[100px]">
                {#if score === 100}
                    <img src="/images/quiz-100.gif" alt="Perfect Score" />
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
                class="h-[122px] flex-col justify-start items-center inline-flex"
            >
                <div
                    class="px-2.5 py-1 bg-black/5 rounded-[20px] justify-center items-center gap-2.5 inline-flex"
                >
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
                class="text-h4 font-bold text-light-text-primary dark:text-dark-text-primary whitespace-pre-line mb-4"
            >
                {message.title}
            </h3>
            <p
                class="text-semi-body text-light-text-tertiary dark:text-dark-text-tertiary max-w-[400px]"
            >
                {message.description}
            </p>
        </div>

        <!-- Footer -->
        <div
            class="px-2.5 py-4 flex flex-col gap-2.5 lg:items-center lg:justify-center border-t border-light-border dark:border-dark-border"
        >
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
                on:click={handleRevisit}
            >Revisit Course Content
            </button>
        </div>
    </div>
</div>

<style>
    /* Add any additional styles here */
</style>
