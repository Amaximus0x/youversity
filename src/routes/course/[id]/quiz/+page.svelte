<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { user } from "$lib/stores/auth";

    // Static quiz data for now
    const quiz = {
        title: "Mastering motion design: From concept to creation",
        questions: [
            {
                id: 1,
                question:
                    "How can principles of motion design enhance storytelling and user engagement across different media?",
                options: [
                    "Guide attention with smooth transitions.",
                    "Establish hierarchy and emphasize key elements.",
                    "Evoke emotions through timing and pacing.",
                    "Ensure consistency in branding and visuals.",
                ],
            },
            {
                id: 2,
                question:
                    "What are the key steps in transforming a static concept into a dynamic motion design project?",
                options: ["True", "False"],
            },
            {
                id: 3,
                question:
                    "How do timing, easing, and transitions improve motion design?",
                options: [
                    "Guide attention with smooth transitions.",
                    "Establish hierarchy and emphasize key elements.",
                    "Evoke emotions through timing and pacing.",
                    "Ensure consistency in branding and visuals.",
                ],
                type: "checkbox",
            },
            {
                id: 4,
                question:
                    "How do timing, easing, and transitions improve motion design?",
                options: [
                    "Guide attention with smooth transitions.",
                    "Establish hierarchy and emphasize key elements.",
                    "Evoke emotions through timing and pacing.",
                    "Ensure consistency in branding and visuals.",
                ],
                type: "checkbox",
            },
            {
                id: 5,
                question:
                    "How do timing, easing, and transitions improve motion design?",
                options: [
                    "Guide attention with smooth transitions.",
                    "Establish hierarchy and emphasize key elements.",
                    "Evoke emotions through timing and pacing.",
                    "Ensure consistency in branding and visuals.",
                ],
                type: "checkbox",
            },
        ],
    };

    let selectedAnswers: { [key: number]: string | string[] } = {};

    function handleOptionSelect(questionId: number, option: string) {
        selectedAnswers[questionId] = option;
    }

    function isOptionSelected(questionId: number, option: string): boolean {
        return selectedAnswers[questionId] === option;
    }

    function handleSubmit() {
        // Handle quiz submission
        // For now, just navigate back to course page
        goto(`/course/${$page.params.id}`);
    }

    onMount(() => {
        // if (!$user) {
        //   goto('/login');
        // }
    });
</script>

<div
    class="w-full -mx-5 min-h-[calc(100vh-85px)] flex flex-col  "
>
    <!-- Quiz Header for mobile -->
    <!-- <div class="md:hidden w-[calc(100%+40px)] -mr-5 sticky top-[85px] z-40 bg-BackgroundRed "> -->
    <div class="w-[calc(100%+40px)] -mr-5 sticky top-[85px] z-40 bg-BackgroundRed ">
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

                <div class="hidden md:flex p-4  gap-6 items-center justify-between border border-light-border dark:border-dark-border rounded-2xl">
                    <p class="text-Black text-h2-mobile-bold">{quiz.title}</p>
                    <h1 class="text-Black text-h4-medium text-nowrap">Final Quiz</h1>
                </div>
            </div>
        </div>
    </div>

    <!-- Quiz Content -->
    <div class="mt-[23px] pl-5 flex-1 pb-8">
        <!-- Quiz Title for desktop Only-->
        <!-- <div class="hidden md:block mb-8 pl-5 -mr-8">
            <div class="p-4 flex gap-6 items-center justify-between border border-light-border dark:border-dark-border rounded-2xl">
                <p class="text-Black text-h2-mobile-bold">{quiz.title}</p>
                <h1 class="text-Black text-h4-medium text-nowrap">Final Quiz</h1>
            </div>
        </div> -->

        <!-- Questions -->
        <div class="space-y-8">
            {#each quiz.questions as question, index}
                <div class="flex flex-col gap-4 text-body-semibold">
                    <div class="flex items-start gap-2">
                        <p >
                            {index + 1}. 
                        </p>
                        <p >
                            {question.question}
                        </p>
                    </div>
                    <div class="space-y-4">
                        {#each question.options as option}
                            <label
                                class="flex items-center gap-3 cursor-pointer group"
                            >
                                <div class="relative flex items-center">
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value={option}
                                        checked={isOptionSelected(
                                            question.id,
                                            option,
                                        )}
                                        on:change={() =>
                                            handleOptionSelect(question.id, option)}
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
                                <span
                                    class="text-semi-body text-Black group-hover:opacity-90"
                                    >{option}</span
                                >
                            </label>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>

        <!-- Submit Button for mobile -->
        <div class="md:hidden mt-8 bg-BackgroundRed">
            <button
                class="w-full px-6 py-3 bg-brand-red hover:bg-ButtonHover text-white rounded-2xl text-semibody-medium transition-colors flex items-center justify-center gap-2"
                on:click={handleSubmit}
            >
                Submit
                <img
                    src="/icons/arrow-right-white.svg"
                    alt="Submit"
                    class="w-6 h-6"
                />
            </button>
        </div>
    </div>
</div>

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
</style>
