export function load({ url }) {
    const data = JSON.parse(decodeURIComponent(url.searchParams.get('data') || '{}'));
    return {
        quizData: data.quizData || {},
        selectedAnswers: data.selectedAnswers || {}
    };
} 