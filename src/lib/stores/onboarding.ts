import { writable } from 'svelte/store';

interface OnboardingSlide {
  title: {
    parts: {
      text: string;
      highlighted: boolean;
    }[];
  };
  description: string;
  image: string;
}

const slides: OnboardingSlide[] = [
  {
    title: {
      parts: [
        { text: 'Transform ', highlighted: true },
        { text: 'Your\n', highlighted: false },
        { text: 'YouTube ', highlighted: false },
        { text: 'Time ', highlighted: true },
        { text: 'into\n', highlighted: false },
        { text: 'Learning', highlighted: true }
      ]
    },
    description: 'Say goodbye to endless scrolling and random videos. Youversity curates structured courses from the best YouTube content, turning your watching habits into productive learning experiences.',
    image: '/images/Onboarding-1-light.svg'
  },
  {
    title: {
      parts: [
        { text: 'AI-Powered ', highlighted: true },
        { text: 'Course\n', highlighted: false },
        { text: 'Creation ', highlighted: true },
        { text: 'in\n', highlighted: false },
        { text: 'Seconds', highlighted: false }
      ]
    },
    description: 'Pick a topic, and our AI finds the best YouTube videos, organizes them into a structured course, and adds progress tracking. Learn at your own pace, anytime, anywhere.',
    image: '/images/Onboarding-2-light.svg'
  },
  {
    title: {
      parts: [
        { text: 'Create & Share\n', highlighted: true },
        { text: 'Your Own Courses', highlighted: false }
      ]
    },
    description: 'Want to teach? Build your own courses with curated YouTube videos, add quizzes, and share them with friends, students, or the entire community.',
    image: '/images/Onboarding-3-light.svg'
  },
  {
    title: {
      parts: [
        { text: 'Discover,\n', highlighted: false },
        { text: 'Collaborate, ', highlighted: true },
        { text: 'and\n', highlighted: false },
        { text: 'Grow ', highlighted: true },
        { text: 'Together', highlighted: false }
      ]
    },
    description: 'Explore courses created by others, and collaborate on learning paths. With Youversity, knowledge is always within reach.',
    image: '/images/Onboarding-4-light.svg'
  }
];

function createOnboardingStore() {
  const { subscribe, set, update } = writable({
    currentSlide: 0,
    slides
  });

  const nextSlide = () => update(state => ({
    ...state,
    currentSlide: (state.currentSlide + 1) % slides.length
  }));

  const previousSlide = () => update(state => ({
    ...state,
    currentSlide: (state.currentSlide - 1 + slides.length) % slides.length
  }));

  return {
    subscribe,
    nextSlide,
    previousSlide,
    reset: () => set({ currentSlide: 0, slides })
  };
}

export const onboarding = createOnboardingStore(); 