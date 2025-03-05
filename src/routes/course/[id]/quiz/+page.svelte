<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { user } from "$lib/stores/auth";
    import QuizResult from "./QuizResult.svelte";
    import type { FinalCourseStructure } from "$lib/types/course";
    import { quizStore } from "$lib/stores/quiz";

    interface QuizQuestion {
        id: number;
        question: string;
        answer: string;
        options: Record<string, string>;
        type: "checkbox" | "radio";
    }

    export let data: { courseData: FinalCourseStructure };
    const { courseData } = data;

    // Quiz data from course
    const quiz = {
        title: courseData.Final_Course_Title,
        quiz: courseData.Final_Course_Quiz.quiz || ([] as QuizQuestion[]),
    };

    let selectedAnswers: { [key: number]: string | string[] } = {};
    let showQuizResult = false;
    let quizScore = 60; // This will come from your quiz logic

    function calculateScore() {
        let correctAnswers = 0;
        const totalQuestions = quiz.quiz.length;

        quiz.quiz.forEach((question: QuizQuestion, index: number) => {
            const questionId = question.id || index + 1;
            const selectedAnswer = selectedAnswers[questionId];

            console.log("Question:", questionId, {
                selected: selectedAnswer,
                correct: question.answer,
                isCorrect: selectedAnswer === question.answer,
            });

            if (selectedAnswer === question.answer) {
                correctAnswers++;
            }
        });

        const percentageScore = Math.round(
            (correctAnswers / totalQuestions) * 100,
        );

        console.log("Final Score:", {
            correct: correctAnswers,
            total: totalQuestions,
            percentage: percentageScore,
        });

        return percentageScore;
    }

    function handleSubmit() {
        // Calculate score and show result
        quizScore = calculateScore();
        showQuizResult = true;
    }

    // Subscribe to quiz store to sync state
    $: {
        const unsubscribe = quizStore.subscribe((store) => {
            if (!store.quizData) {
                selectedAnswers = {};
            }
        });
    }

    function handleQuizRetake() {
        // Reset all quiz state
        selectedAnswers = {};
        showQuizResult = false;
        quizScore = 0;
        // Reset the quiz store
        quizStore.reset();
        // Force radio inputs to reset by clearing their checked state
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        radioInputs.forEach((input) => {
            (input as HTMLInputElement).checked = false;
        });
    }

    function handleQuizReview() {
        // Implement review logic
        goto(`/course/${$page.params.id}/quiz/answers`);
    }

    // Track if all questions are answered
    $: isAllAnswered = quiz?.quiz.every((q: QuizQuestion, index: number) => {
        const questionId = q.id || index + 1;
        return selectedAnswers[questionId] !== undefined;
    });

    function handleOptionSelect(questionId: number, option: string) {
        selectedAnswers = {
            ...selectedAnswers,
            [questionId]: option,
        };
    }

    function isOptionSelected(questionId: number, option: string): boolean {
        return selectedAnswers[questionId] === option;
    }

    onMount(() => {
        if (!$user) {
            goto("/login");
        }
    });
</script>

<div class="w-full -mx-5 min-h-[calc(100vh-85px)] flex flex-col">
    <!-- Mobile Layout -->
    <div class="lg:hidden flex flex-col min-h-[calc(100vh-85px)]">
        <!-- Mobile header -->
        <div
            class="w-[calc(100%+40px)] pt-6 -mr-5 fixed top-[70px] z-40 bg-BackgroundRed dark:bg-dark-bg-secondary"
        >
            <div class="px-5 pt-1 pb-4">
                <div class="flex flex-col gap-4 items-start">
                    <!-- back button -->
                    <button
                        class="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary hover:opacity-70"
                        on:click={() => goto(`/course/${$page.params.id}`)}
                    >
                    <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="text-light-text-primary dark:text-dark-text-primary"
                  >
                    <path
                      d="M4 12H20"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M8.99997 17C8.99997 17 4.00002 13.3176 4 12C3.99999 10.6824 9 7 9 7"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                    </button>
                    <!-- quiz title -->
                    <div
                        class="w-full flex flex-col gap-6 bg-BackgroundRed dark:bg-dark-bg-secondary p-4"
                    >
                        <h1
                            class="text-light-text-secondary dark:text-dark-text-secondary text-h4-medium"
                        >
                            Final Quiz
                        </h1>
                        <p
                            class="text-light-text-primary dark:text-dark-text-primary text-h4 font-bold"
                        >
                            {quiz.title}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile content -->
        <div class="mt-[226px] pl-5 flex-1 pb-8 hide-scrollbar">
            <!-- Questions -->
            <div class="space-y-8">
                {#each quiz.quiz as question, index}
                    <div class="flex flex-col gap-4 ">
                        <div class="flex items-start text-body-semibold text-light-text-primary dark:text-dark-text-primary gap-2">
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
                                            checked={isOptionSelected(
                                                question.id || index + 1,
                                                key,
                                            )}
                                            on:change={() =>
                                                handleOptionSelect(
                                                    question.id || index + 1,
                                                    key,
                                                )}
                                            class="absolute opacity-0 w-6 h-6 cursor-pointer"
                                        />
                                        <div
                                            class="radio-circle w-6 h-6 flex items-center justify-center text-black/20 dark:text-white/10"
                                        >
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z"
                                                    stroke="currentColor"
                                                    stroke-width="1.5"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <span
                                        class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary group-hover:opacity-90"
                                    >
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
                        : 'bg-Black/5 dark:bg-White/10 text-light-text-tertiary'}"
                    disabled={!isAllAnswered}
                    on:click={handleSubmit}
                >
                    Submit
                    <svg
                        width="25"
                        height="24"
                        viewBox="0 0 25 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g id="arrow-right">
                            <path
                                id="Vector"
                                d="M20.5 12H4.50002"
                                stroke={isAllAnswered ? "white" : "Grey"}
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                id="Vector_2"
                                d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7"
                                stroke={isAllAnswered ? "white" : "Grey"}
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </g>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Desktop Layout -->
    <div
        class="hidden lg:flex lg:flex-col lg:h-[calc(100vh-118px)] lg:fixed lg:w-[calc(100%-284px)] lg:top-[116px] bg-light-background dark:bg-dark-background"
    >
        <!-- Desktop Header - Fixed -->
        <div class="flex-shrink-0 pl-5 pb-6">
            <div
                class="p-4 flex gap-6 items-center justify-between border border-light-border dark:border-dark-border rounded-2xl"
            >
                <p class="text-light-text-primary dark:text-dark-text-primary text-h4 font-bold">{quiz.title}</p>
                <h1
                    class="text-light-text-secondary dark:text-dark-text-secondary text-h4-medium text-nowrap"
                >
                    Final Quiz
                </h1>
            </div>
        </div>

        <!-- Questions Container - Scrollable -->
        <div class="flex-1 overflow-hidden relative">
            <div
                class="absolute inset-0 overflow-y-auto custom-scrollbar pl-16 pr-8"
            >
                <div class="space-y-8 pb-8">
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
                                                checked={isOptionSelected(
                                                    question.id || index + 1,
                                                    key,
                                                )}
                                                on:change={() =>
                                                    handleOptionSelect(
                                                        question.id ||
                                                            index + 1,
                                                        key,
                                                    )}
                                                class="absolute opacity-0 w-6 h-6 cursor-pointer"
                                            />
                                            <div
                                                class="radio-circle w-6 h-6 flex items-center justify-center text-black/20 dark:text-white/10"
                                            >
                                                <svg
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z"
                                                        stroke="currentColor"
                                                        stroke-width="1.5"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                        <span
                                            class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary group-hover:opacity-90"
                                        >
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
        <div
            class="flex-shrink-0 flex justify-between items-center px-5 pr-8 py-5 pt-8 border-t border-light-border"
        >
            <button
                class="flex items-center gap-2 px-4 py-2 text-brand-red text-semi-body bg-Black/5  rounded-lg border border-light-border dark:border-[#EE434A]"
                on:click={() => goto(`/course/${$page.params.id}`)}
            >
                Leave Quiz
                <img src="/icons/logout-03.svg" alt="Leave" class="w-6 h-6" />
            </button>
            <button
                class="px-4 py-2 rounded-lg text-semibody-medium transition-colors flex items-center justify-center gap-2 {isAllAnswered
                    ? 'bg-brand-red hover:bg-ButtonHover text-white'
                    : 'bg-Black/5 dark:bg-White/10 text-light-text-tertiary'}"
                disabled={!isAllAnswered}
                on:click={handleSubmit}
            >
                Submit
                <svg
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <g id="arrow-right">
                        <path
                            id="Vector"
                            d="M20.5 12H4.50002"
                            stroke={isAllAnswered ? "white" : "Grey"}
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            id="Vector_2"
                            d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7"
                            stroke={isAllAnswered ? "white" : "Grey"}
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </g>
                </svg>
            </button>
        </div>
    </div>
</div>

{#if showQuizResult}
    <QuizResult
        score={quizScore}
        courseId={$page.params.id}
        quizData={quiz}
        {selectedAnswers}
        on:retake={handleQuizRetake}
        on:review={handleQuizReview}
        on:close={() => (showQuizResult = false)}
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
        color: #ee434a; /* brand-red color */
    }

    input[type="radio"]:checked + .radio-circle::after {
        content: "";
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #ee434a;
        border-radius: 50%;
    }

    input[type="radio"]:hover:not(:checked) + .radio-circle {
        color: rgba(0, 0, 0, 0.4);
    }

    :global(.dark) input[type="radio"]:hover:not(:checked) + .radio-circle {
        color: rgba(255, 255, 255, 0.2);
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
        scrollbar-color: #ee434a #fff2f3;
    }

    :global(.dark) .custom-scrollbar {
        scrollbar-color: #ee434a rgba(255, 255, 255, 0.05);
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: #fff2f3;
        border-radius: 20px;
    }

    :global(.dark) .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #ee434a;
        border-radius: 20px;
        border: none;
    }
</style>
