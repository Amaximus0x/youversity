import { writable } from 'svelte/store';

interface QuizStore {
    quizData: any;
    selectedAnswers: Record<number, string>;
    score: number;
    moduleIndex: number;
}

function createQuizStore() {
    const { subscribe, set, update } = writable<QuizStore>({
        quizData: null,
        selectedAnswers: {},
        score: 0,
        moduleIndex: 0
    });

    return {
        subscribe,
        update,
        setQuizData: (data: any) => update(store => ({ ...store, quizData: data })),
        setSelectedAnswers: (answers: Record<number, string>) => update(store => ({ ...store, selectedAnswers: answers })),
        setScore: (score: number) => update(store => ({ ...store, score })),
        setModuleIndex: (index: number) => update(store => ({ ...store, moduleIndex: index })),
        reset: () => set({ quizData: null, selectedAnswers: {}, score: 0, moduleIndex: 0 })
    };
}

export const quizStore = createQuizStore(); 