<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { user } from "$lib/stores/auth";
    import { quizStore } from "$lib/stores/quiz";
    import QuizResultModal from "./QuizResultModal.svelte";

    export let quiz: any;
    export let moduleTitle: string;
    export let onClose: () => void;
    export let onSubmit: (score: number, timeSpent: number) => void;
    export let courseId: string;
    export let moduleIndex: number;
    export let quizData: any;
    // Static quiz data for now
    // const quizData = {
    //     title: "Mastering motion design: From concept to creation",
    //     quiz: [
    //         {
    //             id: 1,
    //             question:
    //                 "How can principles of motion design enhance storytelling and user engagement across different media?",
    //             answer: 'a',
    //             options: {
    //                a: "Guide attention with smooth transitions.",
    //                b: "Establish hierarchy and emphasize key elements.",
    //                c: "Evoke emotions through timing and pacing.",
    //                d: "Ensure consistency in branding and visuals.",
    //             },
    //             type: "checkbox",
    //         },
    //         {
    //             id: 2,
    //             question:
    //                 "What are the key steps in transforming a static concept into a dynamic motion design project?",
    //             answer: 'a',
    //             options: {
    //                a: "True",
    //                b: "False",
    //             },
    //             type: "radio",
    //         },
    //         {
    //             id: 3,
    //             question:
    //                 "How do timing, easing, and transitions improve motion design?",
    //             answer: 'c',
    //             options: {
    //                a: "Guide attention with smooth transitions.",
    //                b: "Establish hierarchy and emphasize key elements.",
    //                c: "Evoke emotions through timing and pacing.",
    //                d: "Ensure consistency in branding and visuals.",
    //             },
    //             type: "checkbox",
    //         },
    //         {
    //             id: 4,
    //             question:
    //                 "How do timing, easing, and transitions improve motion design?",
    //             answer: 'b',
    //             options: {
    //                a: "Guide attention with smooth transitions.",
    //                b: "Establish hierarchy and emphasize key elements.",
    //                c: "Evoke emotions through timing and pacing.",
    //                d: "Ensure consistency in branding and visuals.",
    //             },
    //             type: "checkbox",
    //         },
    //         {
    //             id: 5,
    //             question:
    //                 "How do timing, easing, and transitions improve motion design?",
    //             answer: 'a',
    //             options: {
    //                a: "Guide attention with smooth transitions.",
    //                b: "Establish hierarchy and emphasize key elements.",
    //                c: "Evoke emotions through timing and pacing.",
    //                d: "Ensure consistency in branding and visuals.",
    //             },
    //             type: "checkbox",
    //         },
    //     ],
    // };

    let selectedAnswers: { [key: number]: string } = {};
    let score = 100;
    // Track if all questions are answered
    $: isAllAnswered =
        quizData?.quiz.every((q: any) => selectedAnswers[q.id] !== undefined) ||
        false;

    function handleOptionSelect(questionId: number, option: string) {
        selectedAnswers[questionId] = option;
    }

    function isOptionSelected(questionId: number, option: string): boolean {
        return selectedAnswers[questionId] === option;
    }

    function handleSubmit() {
        // Calculate score
        // let score = 0;
        // let total = quizData.quiz.length;
        
        // quizData.quiz.forEach((question: any) => {
        //     if (selectedAnswers[question.id] === question.answer) {
        //         score++;
        //     }
        // });

        // const percentageScore = Math.round((score / total) * 100);

        // Update store with quiz data
        quizStore.setQuizData(quizData);
        quizStore.setSelectedAnswers(selectedAnswers);
        // quizStore.setScore(percentageScore);
        quizStore.setModuleIndex(moduleIndex);
        quizStore.setShowResult(true);

        // Close this modal and notify parent
        onClose();
        // onSubmit(percentageScore, 0);
    }

    function handleQuizRetake() {
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
<!-- desktop content only-->
<!-- Modal Overlay -->
<div class="hidden lg:fixed inset-0 z-[100] lg:flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50"></div>

    <!-- Modal -->
    <div class="relative w-full max-w-[808px] bg-gradient-light dark:bg-gradient-dark rounded-[32px] overflow-hidden pb-4">
        <!-- Header -->
        <div class="p-4 pt-8 flex items-center justify-center border-b border-light-border dark:border-dark-border">
            <h1 class="w-full text-center text-h4-medium text-light-text-primary dark:text-dark-text-primary">
                Module {moduleIndex + 1} Quiz
            </h1>
            <button
                class="p-2 border border-light-border dark:border-dark-border rounded-full"
                on:click={onClose}
            >
                <img src="/icons/cancel-circle.svg" alt="Close" class="w-6 h-6" />
            </button>
        </div>

        <!-- Quiz Content -->
        <div class="h-[652px] flex flex-col p-4">
            <!-- Questions Container - Scrollable -->
            <div class="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
                <div class="space-y-8">
                    {#each quizData.quiz as question, index}
                        <div class="flex flex-col gap-4 text-body-semibold">
                            <div class="flex items-start gap-2">
                                <p>{index + 1}.</p>
                                <p>{question.question}</p>
                            </div>
                            <div class="space-y-4">
                                {#each Object.entries(question.options) as [key, value]}
                                    <label class="flex items-center gap-3 cursor-pointer group">
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

            <!-- Footer -->
            <div class="flex-shrink-0 flex justify-end items-center px-2.5 py-4 border-t border-light-border dark:border-dark-border">
                
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
</div>

<!-- score={quizScore} -->
<!-- {#if quizStore.showResult}
  <QuizResultModal
    moduleIndex={moduleIndex}
    score={score}
    courseId={$page.params.id}
    quizData={quizData}
    selectedAnswers={selectedAnswers}
    on:retake={handleQuizRetake}
    on:review={handleQuizReview}
    on:close={() => quizStore.setShowResult(false)}
  />
{/if} -->

<style>
    .radio-circle {
        color: rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease-in-out;
    }

    input[type="radio"]:checked + .radio-circle {
        color: #EE434A;
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
