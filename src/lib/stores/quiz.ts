import { writable } from 'svelte/store';

interface QuizStore {
    quizData: Quiz | null;
    selectedAnswers: Record<number, string>;
    score: number;
    moduleIndex: number;
    isFinalQuiz: boolean;
}

function createQuizStore() {
    const { subscribe, set, update } = writable<QuizStore>({
        quizData: null,
        selectedAnswers: {},
        score: 0,
        moduleIndex: 0,
        isFinalQuiz: false
    });

    return {
        subscribe,
        update,
        setQuizData: (data: any) => update(store => ({ ...store, quizData: data })),
        setSelectedAnswers: (answers: Record<number, string>) => update(store => ({ ...store, selectedAnswers: answers })),
        setScore: (score: number) => update(store => ({ ...store, score })),
        setModuleIndex: (index: number) => update(store => ({ ...store, moduleIndex: index })),
        setIsFinalQuiz: (isFinal: boolean) => update(store => ({ ...store, isFinalQuiz: isFinal })),
        reset: () => set({ quizData: null, selectedAnswers: {}, score: 0, moduleIndex: 0, isFinalQuiz: false })
    };
}

export const quizStore = createQuizStore(); 