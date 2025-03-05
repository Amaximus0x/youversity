<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { quizStore } from '$lib/stores/quiz';
    import type { Quiz, QuizQuestion } from "$lib/types/course";

    let quizData: Quiz | null = null;
    let selectedAnswers: Record<number, string>;
    let score: number;
    let moduleId: number;
    let isModuleQuiz: boolean;
    let isFinalQuiz: boolean;

    // Subscribe to the store
    quizStore.subscribe(store => {
        quizData = store.quizData;
        console.log(quizData);
        selectedAnswers = store.selectedAnswers;
        console.log(selectedAnswers);
        score = store.score;
        moduleId = store.moduleIndex;
        console.log(moduleId);
        isFinalQuiz = store.isFinalQuiz || false;
        // Determine if it's a module quiz or final quiz
        isModuleQuiz = !isFinalQuiz && typeof moduleId === 'number' && moduleId >= 0;
    });

    function isAnswerCorrect(questionIndex: number, optionKey: string): boolean {
        const question = quizData?.quiz[questionIndex];
        return question?.answer === optionKey;
    }

    function wasOptionSelected(questionIndex: number, optionKey: string): boolean {
        // First check if we have an answer for this question
        const selectedAnswer = selectedAnswers[questionIndex];
        return selectedAnswer === optionKey;
    }

    // Add debug logging to help track the selected answers
    $: if (selectedAnswers) {
        console.log('Selected Answers in Answers Page:', selectedAnswers);
    }

    function getOptionClass(questionIndex: number, optionKey: string): string {
        const isCorrect = isAnswerCorrect(questionIndex, optionKey);
        const wasSelected = wasOptionSelected(questionIndex, optionKey);
        
        if (isCorrect) return 'correct';
        if (wasSelected && !isCorrect) return 'incorrect';
        return 'default';
    }

    function handleBackClick() {
        if (isModuleQuiz) {
            goto(`/course/${$page.params.id}/quiz/module/${moduleId + 1}`);
        } else {
            goto(`/course/${$page.params.id}/quiz`);
        }
    }

    onMount(() => {
        // Only navigate away if there's no initial quiz data
        if (!quizData?.quiz) {
            goto(`/course/${$page.params.id}`);
        }
    });

    // Handle cleanup when leaving the page (not on refresh)
    function handleLeavePage() {
        quizStore.reset();
    }

    // Add cleanup when using Continue Course button
    function handleContinueCourse() {
        handleLeavePage();
        goto(`/course/${$page.params.id}`);
    }
</script>

<div class="w-full -mx-5 min-h-[calc(100vh-85px)] flex flex-col">
    <!-- Mobile Layout -->
    <div class="lg:hidden flex flex-col min-h-[calc(100vh-85px)]">
        <!-- Mobile header -->
        <div class="w-[calc(100%+40px)] pt-6 -mr-5 fixed top-[70px] z-40 bg-BackgroundRed dark:bg-dark-bg-secondary">
            <div class="px-5 pt-1 pb-4">
                <div class="flex flex-col gap-4 items-start">
                    <!-- back button -->
                    <button
                        class="flex items-center gap-2 text-light-text-primary dark:text-dark-text-primary hover:opacity-70"
                        on:click={handleBackClick}
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
                    {#if isModuleQuiz}
                    <p class="text-light-text-primary dark:text-dark-text-primary text-h4-medium">
                            Module {moduleId + 1} Quiz Answers
                        </p>
                        {:else}
                        <div class="flex flex-col mr-12 items-start gap-2 border border-light-border dark:border-dark-border rounded-2xl p-4">
                        <p class="text-light-text-secondary dark:text-dark-text-secondary text-h4-medium">
                            Final Quiz Answers
                            </p>
                            <p class="text-light-text-primary dark:text-dark-text-primary text-h4-medium">
                                {quizData?.title}
                            </p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        <!-- mobile content -->
        <!-- Questions with Answers -->
        <div class="{isModuleQuiz? 'mt-[126px]': 'mt-[226px]'} pl-6 flex-1 pb-8">
            <div class="space-y-8">
                {#if quizData?.quiz}
                    {#each quizData.quiz as question, index}
                        <div class="flex flex-col gap-4 ">
                            <div class="flex items-start text-body-semibold text-light-text-primary dark:text-dark-text-primary gap-2">
                                <p>{index + 1}.</p>
                                <p>{question.question}</p>
                            </div>
                            <div class="space-y-4">
                                {#each Object.entries(question.options) as [key, value]}
                                    <div class="flex items-center gap-3">
                                        <div class="relative flex items-center">
                                            <div class="radio-circle w-6 h-6 flex items-center justify-center {getOptionClass(index, key)}">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path 
                                                        d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" 
                                                        stroke="currentColor" 
                                                        stroke-width="1.5"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                        <span class="text-semi-body {getOptionClass(index, key) === 'correct' ? 'text-[#0CC62B]' : ''} {getOptionClass(index, key) === 'incorrect' ? 'text-[#EE434A]' : ''} {getOptionClass(index, key) === 'default' ? 'text-light-text-secondary dark:text-dark-text-secondary' : ''}">
                                            {value}
                                        </span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Done Button mobile -->
            <div class="mt-8">
                <button
                    class="w-full px-6 py-3 bg-brand-red hover:bg-ButtonHover text-white rounded-2xl text-semibody-medium transition-colors flex items-center justify-center gap-2"
                    on:click={handleContinueCourse}
                >
                    Done
                    <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="arrow-right">
                            <path id="Vector" d="M20.5 12H4.50002" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path id="Vector_2" d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </g>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Desktop Layout - Similar to mobile but with fixed header and footer -->
    <!-- ... Desktop layout code similar to quiz page ... -->
    <div class="hidden lg:flex lg:flex-col lg:h-[calc(100vh-118px)] lg:fixed lg:w-[calc(100%-284px)] lg:top-[116px] bg-light-background dark:bg-dark-background">
        <!-- Desktop Header - Fixed -->
        <div class="flex-shrink-0 pl-5 pb-6">
            <div class="p-4 flex gap-6 items-center justify-between border border-light-border dark:border-dark-border rounded-2xl">
                <!-- quiz title -->
                <p class="text-light-text-primary dark:text-dark-text-primary text-h4 font-bold">{quizData?.title}</p>
                <h1 class="text-light-text-secondary dark:text-dark-text-secondary text-h4-medium text-nowrap">
                    
                        Final Quiz Answers
                
                </h1>
            </div>
        </div>

        <!-- Questions Container - Scrollable -->
        <div class="flex-1 overflow-hidden relative ">
            <div class="absolute inset-0 overflow-y-auto custom-scrollbar pl-16 pr-8">
                <div class="space-y-8 pb-8">
                    {#if quizData?.quiz}
                        {#each quizData.quiz as question, index}
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
                                    <div class="flex items-center gap-3">
                                        <div class="relative flex items-center">
                                            <div class="radio-circle w-6 h-6 flex items-center justify-center {getOptionClass(index, key)}">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path 
                                                        d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" 
                                                        stroke="currentColor" 
                                                        stroke-width="1.5"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                        <span class="text-semi-body {getOptionClass(index, key) === 'correct' ? 'text-[#0CC62B]' : ''} {getOptionClass(index, key) === 'incorrect' ? 'text-[#EE434A]' : ''} {getOptionClass(index, key) === 'default' ? 'text-light-text-secondary dark:text-dark-text-secondary' : ''}">
                                            {value}
                                        </span>
                                    </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}
                    {/if}
                </div>
            </div>
        </div>

        <!-- Desktop Footer - Fixed -->
        <div class="flex-shrink-0 flex justify-end items-center px-5 pr-8 py-5 pt-8 ml-8 mb-8 border-t border-light-border dark:border-dark-border">
            
            <button
                class="px-4 py-2 rounded-lg text-semibody-medium transition-colors flex items-center justify-center gap-2 bg-brand-red hover:bg-ButtonHover text-white"
                on:click={handleContinueCourse}
            >
                Done
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g id="arrow-right">
                        <path id="Vector" d="M20.5 12H4.50002" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path id="Vector_2" d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </g>
                </svg>
            </button>
        </div>
    </div>
</div>

<style>
    .radio-circle {
        color: rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease-in-out;
        position: relative;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    :global(.dark) .radio-circle {
        color: rgba(255, 255, 255, 0.1);
    }

    /* Selected and Correct */
    .radio-circle.correct {
        color: #0CC62B !important;
    }
    .radio-circle.correct + span {
        color: #0CC62B !important;
    }
    .radio-circle.correct::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #0CC62B;
        border-radius: 50%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    /* Selected but Incorrect */
    .radio-circle.incorrect {
        color: #EE434A !important;
    }
    .radio-circle.incorrect + span {
        color: #EE434A !important;
    }
    .radio-circle.incorrect::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #EE434A;
        border-radius: 50%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    /* Default unselected state */
    .radio-circle.default {
        color: rgba(0, 0, 0, 0.2);
    }
    :global(.dark) .radio-circle.default {
        color: rgba(255, 255, 255, 0.1);
    }
    .radio-circle.default + span {
        color: rgba(0, 0, 0, 0.6) !important;
    }
    :global(.dark) .radio-circle.default + span {
        color: rgba(255, 255, 255, 0.6) !important;
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