<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { user } from "$lib/stores/auth";
    import { quizStore } from "$lib/stores/quiz";

    export let quiz: {
        quiz: Array<{
            id?: number;
            question: string;
            answer: string;
            options: Record<string, string>;
            type: "multiple-choice" | "true/false";
        }>;
    };
    // export let moduleTitle: string;
    export let onClose: () => void;
    export let onSubmit: (score: number, timeSpent: number) => void;
    // export let courseId: string;
    export let moduleIndex: number;

    let selectedAnswers: { [key: number]: string } = {};
    let showResult = false;
    let quizScore = 0;
    let showReviewAnswers = false;

    // Add reactive score message
    $: scoreMessage = getScoreMessage(quizScore);

    // Update the isAllAnswered reactive statement
    $: isAllAnswered = quiz?.quiz.every((q, index) => {
        // Use index + 1 as question ID if no ID is provided
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

    function calculateScore() {
        let correctAnswers = 0;
        const totalQuestions = quiz.quiz.length;

        quiz.quiz.forEach((question, index) => {
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
        quizScore = calculateScore();
        showResult = true;
        onSubmit(quizScore, 0);
    }

    function handleRetake() {
        selectedAnswers = {};
        showResult = false;
        quizScore = 0;
    }

    function handleReview() {
        showReviewAnswers = true;
        showResult = false;
    }

    function handleReviewClose() {
        showReviewAnswers = false;
        showResult = true;
    }

    function handleContinue() {
        onClose();
        goto(`/course/${$page.params.id}`);
    }

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

    function isAnswerCorrect(questionId: number, optionKey: string): boolean {
        const question = quiz.quiz.find(
            (q, index) => q.id === questionId || index + 1 === questionId,
        );
        return question?.answer === optionKey;
    }
    function wasOptionSelected(questionId: number, optionKey: string): boolean {
        return selectedAnswers[questionId] === optionKey;
    }

    function getOptionClass(questionId: number, optionKey: string): string {
        const isCorrect = isAnswerCorrect(questionId, optionKey);
        const wasSelected = wasOptionSelected(questionId, optionKey);

        if (isCorrect) return "correct";
        if (wasSelected && !isCorrect) return "incorrect";
        return "default";
    }

    onMount(() => {
        console.log("quiz", quiz);
        // if (!$user) {
        //   goto('/login');
        // }
    });
</script>

<!-- desktop content only-->
<!-- Modal Overlay -->
<div class="fixed inset-0 z-[100] lg:flex lg:items-center lg:justify-center">
    <div class="lg:fixed inset-0 bg-black/50"></div>
    <div
        class="relative w-full max-w-[390px] lg:max-w-[808px] bg-gradient-light dark:bg-gradient-dark rounded-[32px] overflow-hidden pb-4"
    >
        {#if showReviewAnswers}
            <!-- Review Answers Content -->
            <div>
                <!-- Header -->
                <div
                    class="hidden lg:flex p-4 pt-8  items-center justify-center border-b border-light-border dark:border-dark-border"
                >
                    <h1
                        class="w-full text-center text-h4-medium text-light-text-primary dark:text-dark-text-primary"
                    >
                        Review Answers - Module {moduleIndex + 1} Quiz
                    </h1>
                    <button
                        class="p-2 border border-light-border dark:border-dark-border rounded-full"
                        on:click={handleReviewClose}
                    >
                        <img
                            src="/icons/cancel-circle.svg"
                            alt="Close"
                            class="w-6 h-6"
                        />
                    </button>
                </div>

                <!-- Questions Container -->
                <div class="h-[652px] flex flex-col p-4">
                    <div class=" overflow-y-auto custom-scrollbar px-4">
                        <div class="space-y-8">
                            {#each quiz.quiz as question, index}
                                <div
                                    class="flex flex-col gap-4 text-body-semibold"
                                >
                                    <div class="flex items-start gap-2">
                                        <p>{index + 1}.</p>
                                        <p>{question.question}</p>
                                    </div>
                                    <div class="space-y-4">
                                        {#each Object.entries(question.options) as [key, value]}
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="relative flex items-center"
                                                >
                                                    <div
                                                        class="radio-circle w-6 h-6 flex items-center justify-center {getOptionClass(
                                                            question.id ||
                                                                index + 1,
                                                            key,
                                                        )}"
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
                                                            {#if getOptionClass(question.id || index + 1, key) !== "default"}
                                                                <path
                                                                    d="M8 12L11 15L16 9"
                                                                    stroke="currentColor"
                                                                    stroke-width="1.5"
                                                                    stroke-linecap="round"
                                                                    stroke-linejoin="round"
                                                                />
                                                            {/if}
                                                        </svg>
                                                    </div>
                                                </div>
                                                <span
                                                    class="radio-text text-semi-body {getOptionClass(
                                                        question.id ||
                                                            index + 1,
                                                        key,
                                                    )}"
                                                >
                                                    {value}
                                                </span>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>

                <!-- Footer with Submit Button -->
                <div
                    class="flex-shrink-0 flex justify-end items-center px-2.5 py-4 border-t border-light-border dark:border-dark-border"
                >
                    <button
                        class="px-4 py-2 rounded-lg text-semibody-medium transition-colors flex items-center justify-center gap-2 bg-brand-red hover:bg-ButtonHover text-white"
                        on:click={handleReviewClose}
                    >
                        Done
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
                                    stroke="white"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                                <path
                                    id="Vector_2"
                                    d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7"
                                    stroke="white"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </g>
                        </svg>
                    </button>
                </div>
            </div>
        {:else}
        <!-- Header -->
            <div
                class="p-4 pt-8 flex items-center justify-center border-b border-light-border dark:border-dark-border"
            >
                <h1
                    class="w-full text-center text-h4-medium text-light-text-primary dark:text-dark-text-primary"
                >
                Module {moduleIndex + 1} Quiz
            </h1>
            <button
                class="p-2 border border-light-border dark:border-dark-border rounded-full"
                on:click={onClose}
            >
                    <img
                        src="/icons/cancel-circle.svg"
                        alt="Close"
                        class="w-6 h-6"
                    />
            </button>
        </div>

            {#if !showResult}
        <!-- Quiz Content -->
        <div class="h-[652px] flex flex-col p-4">
            <!-- Questions Container - Scrollable -->
                    <div
                        class="flex-1 overflow-y-auto custom-scrollbar px-4 py-4"
                    >
                <div class="space-y-8">
                            {#each quiz.quiz as question, index}
                                <div
                                    class="flex flex-col gap-4 text-body-semibold"
                                >
                            <div class="flex items-start gap-2">
                                <p>{index + 1}.</p>
                                <p>{question.question}</p>
                            </div>
                            <div class="space-y-4">
                                {#each Object.entries(question.options) as [key, value]}
                                            <label
                                                class="flex items-center gap-3 cursor-pointer group"
                                            >
                                                <div
                                                    class="relative flex items-center"
                                                >
                                            <input
                                                type="radio"
                                                        name={`question-${question.id || index + 1}`}
                                                value={key}
                                                        checked={isOptionSelected(
                                                            question.id ||
                                                                index + 1,
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
                                                        class="radio-circle w-6 h-6 flex items-center justify-center"
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
                                                    class="text-semi-body text-Black group-hover:opacity-90"
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

                    <!-- Footer with Submit Button -->
                    <div
                        class="flex-shrink-0 flex justify-end items-center px-2.5 py-4 border-t border-light-border dark:border-dark-border"
                    >
                <button
                    class="px-4 py-2 rounded-lg text-semibody-medium transition-colors flex items-center justify-center gap-2 {isAllAnswered 
                        ? 'bg-brand-red hover:bg-ButtonHover text-white' 
                        : 'bg-Black/5 text-light-text-tertiary'}"
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
                                        stroke={isAllAnswered
                                            ? "white"
                                            : "Grey"}
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        id="Vector_2"
                                        d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7"
                                        stroke={isAllAnswered
                                            ? "white"
                                            : "Grey"}
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                        </g>
                    </svg>
                </button>
            </div>
        </div>
            {:else}
                <!-- Quiz Result Content -->
                <div
                    class="pt-6 lg:pt-2 flex flex-col items-center text-center"
                >
                    <!-- Result content -->
                    <div class="w-[100px] h-[100px]">
                        {#if quizScore === 100}
                            <img
                                src="/images/quiz-perfect.gif"
                                alt="Perfect Score"
                            />
                        {:else if quizScore >= 80}
                            <img
                                src="/images/quiz-passed.gif"
                                alt="Quiz Passed"
                            />
                        {:else}
                            <div class="relative">
                                <img
                                    src="/images/quiz-failed.gif"
                                    alt="Quiz Failed"
                                />
                                <div
                                    class="left-[31px] top-[44px] absolute text-white text-[11px] font-semibold"
                                >
                                    Retake
                                </div>
                            </div>
                        {/if}
                    </div>

                    <!-- Score and Message -->
                    <div class="pt-4 flex flex-col items-center">
                        <div class="px-2.5 py-1 bg-black/5 rounded-[20px]">
                            <div class="text-base">Your score</div>
                        </div>
                        <div class="text-5xl font-bold mt-2">{quizScore}%</div>
                    </div>

                    <!-- Add Score Message -->
                    <div class="mt-6 px-4 max-w-[400px]">
                        <h3
                            class="text-h4 font-bold lg:text-h4-medium lg:font-bold text-light-text-primary dark:text-dark-text-primary whitespace-pre-line mb-4"
                        >
                            {scoreMessage.title}
                        </h3>
                        <p
                            class="text-semi-body text-light-text-tertiary dark:text-dark-text-tertiary"
                        >
                            {scoreMessage.description}
                        </p>
                    </div>

                    <!-- Action Buttons -->
                    <!-- <div class="mt-8 flex flex-col gap-2.5 w-full max-w-[300px] "> -->
                    <div
                        class="w-full mt-4 px-4 lg:px-2.5 py-4 flex flex-col gap-2.5 items-center justify-center border-t border-light-border dark:border-dark-border"
                    >
                        {#if quizScore >= 80}
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
                                    >Continue to module {moduleIndex + 2}
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}
        {/if}
    </div>
</div>

<style>
    .radio-circle {
        color: rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease-in-out;
    }

    input[type="radio"]:checked + .radio-circle {
        color: #ee434a;
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

    /* Selected and Correct */
    .radio-circle.correct {
        color: #4caf50; /* Green for correct answers */
    }
    .radio-text.correct {
        color: #4caf50; /* Green for correct answers */
    }
    .radio-circle.correct::after {
        content: "";
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #4caf50;
        border-radius: 50%;
    }

    /* Selected but Incorrect */
    .radio-circle.incorrect {
        color: #ee434a; /* Red for incorrect answers */
    }
    .radio-text.incorrect {
        color: #ee434a; /* Red for incorrect answers */
    }

    .radio-circle.incorrect::after {
        content: "";
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #ee434a;
        border-radius: 50%;
    }

    /* Custom scrollbar styles */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #ee434a #fff2f3;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: #fff2f3;
        border-radius: 20px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #ee434a;
        border-radius: 20px;
        border: none;
    }
</style>
