import { writable } from 'svelte/store';

interface QuizStore {
    quizData: any;
    selectedAnswers: Record<number, string>;
}

function createQuizStore() {
    const { subscribe, set, update } = writable<QuizStore>({
        quizData: null,
        selectedAnswers: {}
    });

    return {
        subscribe,
        setQuizData: (data: any) => update(store => ({ ...store, quizData: data })),
        setSelectedAnswers: (answers: Record<number, string>) => update(store => ({ ...store, selectedAnswers: answers })),
        reset: () => set({ quizData: null, selectedAnswers: {} })
    };
}

export const quizStore = createQuizStore(); 