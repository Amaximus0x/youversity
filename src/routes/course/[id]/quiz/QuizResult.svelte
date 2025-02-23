<script lang="ts">
    import { goto } from "$app/navigation";
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let score: number = 100;
    export let courseId: string;

    let message = getScoreMessage(score);

    function getScoreMessage(score: number): {
        title: string;
        description: string;
    } {
        console.log(score);
        if (score === 100) {
            return {
                title: "Perfect Score!  \nYou Mastered This Course!  🔥",
                description: "You scored 100%. That’s an outstanding achievement! You’ve completed the course with top marks.",
            };
        } else if (score >= 70) {
            return {
                title: "Great Job!\nYou Completed the Course",
                description:
                    "You scored " +
                    score +
                    "%, which means you’ve successfully completed the course. Well done!",
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
        class="relative w-full max-w-[390px] lg:max-w-[808px] pb-4 bg-white dark:bg-dark-background-primary rounded-2xl lg:rounded-2xl overflow-hidden"
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
                        class="flex items-center justify-center gap-2 w-full lg:w-[300px] px-4 py-2 bg-Black/5 text-Green rounded-2xl text-semi-body transition-colors"
                        on:click={handleRetake}
                        >
                        Share achievements
                        <svg class="w-6 h-6 text-Green" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 6.5C21 8.15685 19.6569 9.5 18 9.5C16.3431 9.5 15 8.15685 15 6.5C15 4.84315 16.3431 3.5 18 3.5C19.6569 3.5 21 4.84315 21 6.5Z" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M21 17.5C21 19.1569 19.6569 20.5 18 20.5C16.3431 20.5 15 19.1569 15 17.5C15 15.8431 16.3431 14.5 18 14.5C19.6569 14.5 21 15.8431 21 17.5Z" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                    </button>

                    <button
                        class="w-full lg:w-[300px] px-4 py-2 bg-Green text-dark-text-primary dark:text-dark-text-primary rounded-2xl text-semi-body transition-colors"
                        on:click={handleReview}
                        >Explore more courses
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
                        on:click={handleRevisit}
                        >Revisit Course Content
                    </button>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    /* Add any additional styles here */
</style>
