<script lang="ts">
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import { quizStore } from '$lib/stores/quiz';

    let quizData: any;
    let selectedAnswers: Record<number, string>;

    // Subscribe to the store
    quizStore.subscribe(store => {
        quizData = store.quizData;
        selectedAnswers = store.selectedAnswers;
    });

    function isAnswerCorrect(questionId: number, optionKey: string): boolean {
        return quizData.quiz.find((q: any) => q.id === questionId)?.answer === optionKey;
    }

    function wasOptionSelected(questionId: number, optionKey: string): boolean {
        return selectedAnswers[questionId] === optionKey;
    }

    function getOptionClass(questionId: number, optionKey: string): string {
        const isCorrect = isAnswerCorrect(questionId, optionKey);
        const wasSelected = wasOptionSelected(questionId, optionKey);
        
        if (isCorrect) return 'correct';
        if (wasSelected && !isCorrect) return 'incorrect';
        return '';
    }

    // Clean up store on component unmount
    onMount(() => {
        // return () => {
        //     quizStore.reset();
        // };
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
                        <img src="/icons/arrow-left.svg" alt="Back" class="w-6 h-6" />
                    </button>
                    <!-- quiz title -->
                    <div class="w-full flex flex-col gap-6 bg-BackgroundRed border border-light-border dark:border-dark-border rounded-2xl p-4">
                        <h1 class="text-light-text-secondary dark:text-dark-text-secondary text-h4-medium">
                            Final Quiz Answers
                        </h1>
                        <p class="text-light-text-primary dark:text-dark-text-primary text-h4 font-bold">
                            {quizData.title}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Questions with Answers -->
        <div class="mt-[23px] pl-5 flex-1 pb-8">
            <div class="space-y-8">
                {#each quizData.quiz as question, index}
                    <div class="flex flex-col gap-4 text-body-semibold">
                        <div class="flex items-start gap-2">
                            <p>{index + 1}.</p>
                            <p>{question.question}</p>
                        </div>
                        <div class="space-y-4">
                            {#each Object.entries(question.options) as [key, value]}
                                <div class="flex items-center gap-3">
                                    <div class="relative flex items-center">
                                        <div class="radio-circle w-6 h-6 flex items-center justify-center {getOptionClass(question.id, key)}">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path 
                                                    d="M12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20Z" 
                                                    stroke="currentColor" 
                                                    stroke-width="1.5"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <span class="radio-text text-semi-body text-Black {getOptionClass(question.id, key)}">
                                        {value}
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Done Button -->
            <div class="mt-8">
                <button
                    class="w-full px-6 py-3 bg-brand-red hover:bg-ButtonHover text-white rounded-2xl text-semibody-medium transition-colors flex items-center justify-center gap-2"
                    on:click={() => goto(`/course/${$page.params.id}`)}
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
</div>

<style>
    .radio-circle {
        color: rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease-in-out;
        position: relative;
    }

    /* Selected and Correct */
    .radio-circle.correct {
        color: #4CAF50;  /* Green for correct answers */
    }
    .radio-text.correct {
        color: #4CAF50;  /* Green for correct answers */
    }
    .radio-circle.correct::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #4CAF50;
        border-radius: 50%;
    }

    /* Selected but Incorrect */
    .radio-circle.incorrect {
        color: #EE434A;  /* Red for incorrect answers */
    }
    .radio-text.incorrect {
        color: #EE434A;  /* Red for incorrect answers */
    }
    .radio-circle.incorrect::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: #EE434A;
        border-radius: 50%;
    }

    /* Custom scrollbar styles remain the same */
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