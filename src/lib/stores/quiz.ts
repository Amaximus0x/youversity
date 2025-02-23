import { writable } from 'svelte/store';

interface QuizStore {
    quizData: any;
    selectedAnswers: Record<number, string>;
    score: number;
    showResult: boolean;
    moduleIndex: number;
}

function createQuizStore() {
    const { subscribe, set, update } = writable<QuizStore>({
        quizData: null,
        selectedAnswers: {},
        score: 0,
        showResult: false,
        moduleIndex: 0
    });

    return {
        subscribe,
        setQuizData: (data: any) => update(store => ({ ...store, quizData: data })),
        setSelectedAnswers: (answers: Record<number, string>) => update(store => ({ ...store, selectedAnswers: answers })),
        setScore: (score: number) => update(store => ({ ...store, score })),
        setShowResult: (show: boolean) => update(store => ({ ...store, showResult: show })),
        setModuleIndex: (index: number) => update(store => ({ ...store, moduleIndex: index })),
        reset: () => set({ quizData: null, selectedAnswers: {}, score: 0, showResult: false, moduleIndex: 0 })
    };
}

export const quizStore = createQuizStore(); 