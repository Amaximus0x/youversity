<script lang="ts">
  import { user } from '$lib/stores/auth';
  import { page } from '$app/stores';
  import { getUserCourses, getPublicCourses, toggleCoursePrivacy, getEnrollmentProgress } from '$lib/firebase';
  import type { FinalCourseStructure } from '$lib/types/course';
  import { goto } from '$app/navigation';
  import { loadingState } from '$lib/stores/loadingState';
  import { onMount } from 'svelte';
  import TrendingCourseList from '$lib/components/TrendingCourseList.svelte';
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  import CourseCreationOverlay from '$lib/components/CourseCreationOverlay.svelte';
  import UserCourseList from '$lib/components/UserCourseList.svelte';
  import { browser } from '$app/environment';
  import { tourStore } from '$lib/stores/tourStore';
  import type { TourStep } from '$lib/stores/tourStore';
  import CustomTourGuide from '$lib/components/CustomTourGuide.svelte';
  import { get } from 'svelte/store';

  let learningObjective = '';
  let userCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;
  let filteredCourses: (FinalCourseStructure & { id: string })[] = [];
  let showShareModal = false;
  let selectedCourseId = '';
  let publicCourses: (FinalCourseStructure & { id: string })[] = [];
  let isInputFocused = false;
  let trendingCoursesLoading = true;
  let showLoadingOverlay = false;
  let showCreationOverlay = false;
  let courseObjectiveInput: HTMLInputElement;
  let isNewUser = false;
  let robotImage = '/tour-guide.gif';
  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

  // Define Tour Steps (using Tailwind in HTML strings)
  const dashboardTourSteps: TourStep[] = [
    {
      id: 'welcome',
      content: `<div class="w-full inline-flex flex-col justify-start items-center gap-14 p-12 rounded-2xl bg-gradient-light dark:bg-gradient-dark">
        <div class="self-stretch flex flex-col justify-start items-center">
          <div class="w-[116.5px] h-[142px] relative overflow-hidden">
            <img class="w-[140px] h-[170px] object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" src="${robotImage}" alt="Tour Guide Robot" />
          </div>
          <div class="self-stretch flex flex-col justify-start items-center gap-4 mt-4">
            <div class="self-stretch flex flex-col justify-start items-center">
              <div class="w-full min-w-[350px] max-w-[456px] text-center mt-[-20px]">
                <span class="text-light-text-secondary dark:text-white text-2xl md:text-2xl font-semibold font-['Poppins'] leading-normal">Hi there,</span>
                <div class="text-light-text-secondary dark:text-white text-tour-text-mobile md:text-tour-text">
                  Welcome to Youversity! 
                  <span>
                    <br>I'm your tour guide, and I'll be briefly <br> showing you around the app. Let's go!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full max-w-[326px] inline-flex justify-start items-start gap-4">
          <button data-tour-action="cancel" class="flex-1 h-12 md:h-[54px] px-4 py-2 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#41c1cb] flex justify-center items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors" type="button">
            <span class="text-[#41c1cb] text-sm md:text-base font-medium md:font-semibold font-['Poppins'] leading-normal">Skip Tour</span>
          </button>
          <button data-tour-action="next" class="flex-1 h-12 md:h-[54px] px-4 py-2 bg-[#eb434a] rounded-2xl shadow-[0px_4px_26px_0px_#EB434A] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#D93940]" type="button">
            <span class="text-white text-sm md:text-base font-medium md:font-semibold font-['Poppins'] leading-normal">Start Tour</span>
          </button>
        </div>
      </div>`,
      placement: 'center',
    },
    // <div id="tour-arrow" class="absolute w-4 h-4 bg-brand-red transform rotate-45" style="top: -8px; left: calc(50% - 8px);"></div>
    {
      id: 'explore-courses',
      target: '.explore-course-btn',
      content: `<div class="w-[437px] h-[182px] relative">
   <!-- Arrow SVG Embedded -->
   <svg class="absolute left-[82px] top-[0px] w-[38px] h-[34px] z-10" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
     <path id="Polygon 2" d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/>
   </svg>
 
   <!-- Card -->
   <div class="w-[311px] p-4 left-[63px] top-[23px] absolute bg-[#eb434a] rounded-2xl shadow-[-9px_13px_38px_-1px_rgba(0,0,0,0.37)] outline outline-1 outline-offset-[-1px] outline-[rgba(0,0,0,0.05)] inline-flex flex-col justify-start items-start gap-4 overflow-hidden z-20">
     <!-- Title -->
     <div class="self-stretch justify-start text-white text-base font-bold font-['Poppins'] leading-7">
       Explore Courses
     </div>

     <!-- Description -->
     <div class="self-stretch justify-start text-white text-sm font-normal font-['Poppins'] leading-snug">
       Explore a wide range of courses designed to help you acquire new skills and deepen your knowledge.
     </div>

     <!-- Progress and Buttons -->
     <div class="self-stretch inline-flex justify-between items-center">
       <!-- Progress bar -->
       <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
         <div class="w-6 h-3 bg-white rounded-full"></div>
       </div>

       <!-- Buttons -->
       <div class="flex justify-start items-center gap-2">
            <button data-tour-action="cancel" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
              <span class="justify-start text-white text-semi-body">Skip</span>
            </button>
            <button data-tour-action="next" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button">
              <span class="justify-start text-black text-semi-body">Next</span>
            </button>
          </div>
     </div>
   </div>
 </div>`,
      placement: 'bottom',
    },
    {
      id: 'trending-courses',
      target: '.tour-navigation a[href="/trending"]', 
      content: `
      <div class="w-[322px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative top-1">
        <!-- Rotated Arrow SVG Embedded -->
        <svg class="absolute left-[-28px] top-[13%] -translate-y-1/5 w-[34px] h-[38px] z-10 transform rotate-[-90deg]" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path id="Polygon 2" d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/>
        </svg>
        <!-- <div class="tour-arrow absolute w-4 h-4 bg-brand-red transform rotate-45"></div> -->
        <div class="self-stretch justify-start text-white text-h4 font-bold">Trending Courses</div>
        <div class="self-stretch justify-start text-white text-semi-body">Discover the trending courses that are gaining popularity among learners.</div>
        <div class="self-stretch inline-flex justify-between items-center">
          <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
            <div class="w-[33.7px] h-3 bg-white rounded-full"></div>
          </div>
          <div class="flex justify-start items-center gap-2">
            <button data-tour-action="cancel" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
              <span class="justify-start text-white text-semi-body">Skip</span>
            </button>
            <button data-tour-action="next" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button">
              <span class="justify-start text-black text-semi-body">Next</span>
            </button>
          </div>
        </div>
      </div>`,
      placement: 'right',
    },
    {
      id: 'my-courses',
      target: '.tour-navigation a[href="/my-courses"]', 
      content: `<div class="w-[322px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative top-1">
        <!-- Rotated Arrow SVG -->
        <svg class="absolute left-[-28px] top-[13%] -translate-y-1/5 w-[34px] h-[38px] z-10 transform rotate-[-90deg]" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
        <div class="self-stretch justify-start text-white text-h4 font-bold">My Courses</div>
        <div class="self-stretch justify-start text-white text-semi-body">Access all the courses you've created or enrolled in here.</div>
        <div class="self-stretch inline-flex justify-between items-center">
          <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="w-[50.5px] h-3 bg-white rounded-full"></div></div>
          <div class="flex justify-start items-center gap-2">
            <button data-tour-action="cancel" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button"><span class="justify-start text-white text-semi-body">Skip</span></button>
            <button data-tour-action="next" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button"><span class="justify-start text-black text-semi-body">Next</span></button>
          </div>
        </div>
      </div>`,
      placement: 'right',
    },
    {
      id: 'bookmarks',
      target: '.tour-navigation a[href="/bookmarks"]', 
      content: `<div class="w-[322px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative top-1">
        <!-- Rotated Arrow SVG -->
        <svg class="absolute left-[-28px] top-[13%] -translate-y-1/5 w-[34px] h-[38px] z-10 transform rotate-[-90deg]" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
        <div class="self-stretch justify-start text-white text-h4 font-bold">Bookmarks</div>
        <div class="self-stretch justify-start text-white text-semi-body">Keep track of your favorite courses and modules by bookmarking them.</div>
        <div class="self-stretch inline-flex justify-between items-center">
          <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="w-[67.4px] h-3 bg-white rounded-full"></div></div>
          <div class="flex justify-start items-center gap-2">
            <button data-tour-action="cancel" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button"><span class="justify-start text-white text-semi-body">Skip</span></button>
            <button data-tour-action="next" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button"><span class="justify-start text-black text-semi-body">Next</span></button>
          </div>
        </div>
      </div>`,
      placement: 'right',
    },
    {
      id: 'settings',
      target: '.tour-navigation a[href^="/settings"]', // Use starts-with selector
      content: `<div class="w-[322px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative top-1">
        <!-- Rotated Arrow SVG -->
        <svg class="absolute left-[-28px] top-[13%] -translate-y-1/5 w-[34px] h-[38px] z-10 transform rotate-[-90deg]" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
        <div class="self-stretch justify-start text-white text-h4 font-bold">Settings</div>
        <div class="self-stretch justify-start text-white text-semi-body">Manage your profile, preferences, and account settings here.</div>
        <div class="self-stretch inline-flex justify-between items-center">
          <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="w-[84.2px] h-3 bg-white rounded-full"></div></div>
          <div class="flex justify-start items-center gap-2">
            <button data-tour-action="cancel" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button"><span class="justify-start text-white text-semi-body">Skip</span></button>
            <button data-tour-action="next" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button"><span class="justify-start text-black text-semi-body">Next</span></button>
          </div>
        </div>
      </div>`,
      placement: 'right',
    },
    {
      id: 'create-course-input',
      target: '#course-objective-input',
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
        <!-- <div class="tour-arrow absolute w-4 h-4 bg-brand-red transform rotate-45"></div> --> 
        <div class="self-stretch justify-start text-white text-h4 font-bold">Let's Create Your First Course!</div>
        <div class="self-stretch justify-start text-white text-semi-body">Enter what you want to learn in the input field above. For example: "How to bake sourdough bread" or "Introduction to Python programming". Try typing now!</div>
        <div class="self-stretch inline-flex justify-end items-center">
          <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden mr-auto">
            <div class="w-[101.1px] h-3 bg-white rounded-full"></div>
          </div>
          <div class="flex justify-start items-center gap-2">
            <button data-tour-action="cancel" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
              <span class="justify-start text-white text-semi-body">Skip</span>
            </button>
          </div>
        </div>
      </div>`,
      placement: 'bottom',
      isInteractive: true,
    },
    {
      id: 'create-course-button',
      target: '#create-course button[type="submit"]',
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
        <!-- <div class="tour-arrow absolute w-4 h-4 bg-brand-red transform rotate-45"></div> -->
        <div class="self-stretch justify-start text-white text-h4 font-bold">Great! Now Click Create!</div>
        <div class="self-stretch justify-start text-white text-semi-body">Click the "Create Course" button above to start generating your personalized course content.</div>
        <div class="self-stretch inline-flex justify-between items-center">
          <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
            <div class="w-[118px] h-3 bg-white rounded-full"></div>
          </div>
        </div>
      </div>`,
      placement: 'bottom',
    },
    // {
    //   id: 'finish',
    //   content: `<div class="w-full inline-flex flex-col justify-start items-center gap-[56px] p-12 rounded-2xl bg-gradient-light dark:bg-gradient-dark">
    //     <div class="self-stretch flex flex-col justify-start items-center">
    //       <div class="w-[116.5px] h-[142px] relative overflow-hidden">
    //         <img class="w-[140px] h-[170px] object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" src="${robotImage}" alt="Tour Guide Robot" />
    //       </div>
    //       <div class="self-stretch flex flex-col justify-start items-center gap-4 mt-4">
    //         <div class="self-stretch flex flex-col justify-start items-center">
    //           <div class="w-full min-w-[350px] max-w-[456px] text-center mt-[-20px]">
    //             <span class="text-light-text-secondary dark:text-white text-2xl md:text-2xl font-semibold font-['Poppins'] leading-normal">You're all set!</span>
    //             <div class="text-light-text-secondary dark:text-white text-tour-text-mobile md:text-tour-text mt-3">
    //               You're now ready to start your learning journey. Enjoy using Youversity!
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //     <div class="w-full max-w-[162px] inline-flex justify-start items-start">
    //       <button data-tour-action="complete" class="flex-1 h-12 md:h-[54px] px-4 md:px-8 py-2 bg-[#eb434a] rounded-2xl shadow-[0px_4px_26px_0px_#EB434A] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#D93940]" type="button">
    //         <span class="text-white text-sm md:text-base font-medium md:font-semibold font-['Poppins'] leading-normal">Finish</span>
    //       </button>
    //     </div>
    //   </div>`,
    //   placement: 'center',
    // },
  ];

  // Function to focus the course objective input
  function focusCourseObjective() {
    if (courseObjectiveInput) {
      courseObjectiveInput.focus();
      // Scroll into view if needed
      courseObjectiveInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Handle focus from URL parameter
  $: if (browser && courseObjectiveInput && $page.url.searchParams.get('focus') === 'courseObjective') {
    focusCourseObjective();
    // Clear the parameter after focusing
    const url = new URL(window.location.href);
    url.searchParams.delete('focus');
    history.replaceState({}, '', url);
  }

  // Update filteredCourses when userCourses changes
  $: {
    if (userCourses) {
      filteredCourses = [...userCourses];
    }
  }

  $: if ($user) {
    loadUserCourses();
  }

  // Check if the user is new (hasn't completed the tour)
  function checkIfNewUser() {
    if (browser && $user) {
      isNewUser = !tourStore.hasCompletedTour('dashboard');
      console.log('[+page] New user check:', { isNewUser });
    } else if (browser) {
      isNewUser = true; // Treat as new if no user but in browser
    }
  }

  async function loadUserCourses() {
    try {
      loading = true;
      error = null;
      const courses = await getUserCourses($user!.uid);
      
      // Load progress for each course
      const coursesWithProgress = await Promise.all(courses.map(async (course) => {
        const enrollmentProgress = await getEnrollmentProgress($user!.uid, course.id);
        let progress;
        let isCompleted = false;
        
        if (enrollmentProgress?.completedModules) {
          progress = Math.round((enrollmentProgress.completedModules.length / course.Final_Module_Title.length) * 100);
          // Check if the course is completed (final quiz passed)
          isCompleted = enrollmentProgress.quizResults?.finalQuiz?.completed && 
                       enrollmentProgress.quizResults?.finalQuiz?.passed;
        }
        
        return {
          ...course,
          progress,
          isCompleted
        };
      }));

      userCourses = coursesWithProgress;
      filteredCourses = [...userCourses];
      
      // Update tour completion status based on courses
      if (browser && $user) {
          const hasCoursesKey = `user-has-courses-${$user.uid}`;
          localStorage.setItem(hasCoursesKey, userCourses.length > 0 ? 'true' : 'false');
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    let cleanupFunctions: (() => void)[] = [];

    // Helper function to get tour key for localStorage
    // Needed here because we might set localStorage before tourStore logic runs
    function getTourKey(tourId: string): string | null {
        let currentUserId: string | null = null;
        // Use the $user store value which is updated by the time this is called
        currentUserId = $user?.uid ?? null;
        return currentUserId ? `tour-completed-${tourId}-${currentUserId}` : null;
    }

    const init = async () => {
      // --- Tour Eligibility Logic --- 
      if ($user) { // Check if user is available
        await loadUserCourses(); // Wait for courses to load

        // Check if user has courses and mark tour complete if so
        if (userCourses.length > 0) {
          console.log('[+page] User has courses, marking dashboard tour as completed in localStorage.');
          const tourKey = getTourKey('dashboard'); 
          if (tourKey && browser) {
            localStorage.setItem(tourKey, 'fully-completed');
          }
          isNewUser = false; // Explicitly set isNewUser to false for experienced users
        } else {
           // Only check completion flag if user has NO courses
           checkIfNewUser(); // This now checks localStorage via tourStore.hasCompletedTour('dashboard')
        }
      } else {
         checkIfNewUser(); // Handle non-logged-in case or default new user state
      }
      // --- End Tour Eligibility Logic ---

      // Debug info for tour elements
      if (browser && import.meta.env.DEV) {
        setTimeout(() => {
          console.log('Tour element check:');
          const tourElements = [
              '#course-objective-input',
              '.tour-navigation a[href="/trending"]',
            '.tour-explore-courses',
            '.tour-navigation'
          ];
          tourElements.forEach(selector => {
            const element = document.querySelector(selector);
              console.log(`[+page] ${selector}: ${element ? 'Found' : 'MISSING'}`);
          });
          }, 1000);
      }
      
      // Add event listener for focusCourseObjective
      const handleFocusCourseObjective = () => {
        focusCourseObjective();
      };
      window.addEventListener('focusCourseObjective', handleFocusCourseObjective);
        cleanupFunctions.push(() => window.removeEventListener('focusCourseObjective', handleFocusCourseObjective));

      const loadTrendingCourses = async () => {
        try {
          console.log('Fetching trending courses...');
          // Get courses sorted by views/likes
          publicCourses = await getPublicCourses();
          // Sort by views and likes
          publicCourses.sort((a, b) => {
            const scoreA = (a.views || 0) + (a.likes || 0);
            const scoreB = (b.views || 0) + (b.likes || 0);
            return scoreB - scoreA;
          });
        } catch (error) {
          console.error('Error loading trending courses:', error);
        } finally {
          trendingCoursesLoading = false;
        }
      };

      // Load trending courses
      loadTrendingCourses();

        // Start tour *only* if isNewUser is still true after checks
        if (isNewUser && browser) { 
          console.log('[+page] Starting custom dashboard tour...');
          tourStore.startTour(dashboardTourSteps, 'dashboard');
        }
    };

    init();

    // Add cleanup for debounce timer
    cleanupFunctions.push(() => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    });

    return () => {
      console.log('[+page] Running onMount cleanup');
      cleanupFunctions.forEach(cleanup => cleanup());
      // Clear timeout on component destroy as well
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  });

  // Debounce handler for course objective input
  function handleObjectiveInput() {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const tourState = get(tourStore); // Get current store value synchronously
    if (tourState.isTourActive && tourState.steps[tourState.currentStepIndex]?.id === 'create-course-input') {
      debounceTimeout = setTimeout(() => {
        console.log('[+page] Input pause detected, switching to button step.');
        tourStore.goToStepById('create-course-button');
      }, 5000); // 5 seconds delay
    }
  }

  async function handleCreateCourse(e: Event) {
    e.preventDefault();
    
    if (!learningObjective.trim()) {
      return; // Don't proceed if learning objective is empty
    }

    // --- Check and close tour if on the relevant steps --- 
    const tourState = get(tourStore); // Get current store value synchronously
    if (tourState.isTourActive && 
        (tourState.steps[tourState.currentStepIndex]?.id === 'create-course-input' || 
         tourState.steps[tourState.currentStepIndex]?.id === 'create-course-button')) {
      console.log('[+page] Create button clicked during relevant tour step, completing tour.');
      tourStore.completeTour(); // Use completeTour as user is fulfilling the goal
    }
    // --------------------------------------------------

    try {
      if ($user) {
        // --- Set flag to trigger next tour --- 
        if (browser) {
          localStorage.setItem('startCreateCourseTour', 'true');
        }
        // -------------------------------------

        // Show creation overlay first
        showCreationOverlay = true;

        // Wait for 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Navigate to create-course page
        await goto(`/create-course?objective=${encodeURIComponent(learningObjective)}`);
      } else {
        // For unauthenticated users, redirect to login with return URL
        const returnUrl = `/create-course?objective=${encodeURIComponent(learningObjective)}`;
        await goto(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      showCreationOverlay = false;
    }
  }

  function handleShareCourse(courseId: string) {
    selectedCourseId = courseId;
    showShareModal = true;
  }

  function handleFilterChange(event: { detail: string }) {
    const filterValue = event.detail;
    let sortedCourses = [...userCourses];
    
    switch (filterValue) {
      case 'name-asc':
        sortedCourses.sort((a, b) => a.Final_Course_Title.localeCompare(b.Final_Course_Title));
        break;
      case 'name-desc':
        sortedCourses.sort((a, b) => b.Final_Course_Title.localeCompare(a.Final_Course_Title));
        break;
      case 'date-new':
        sortedCourses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'date-old':
        sortedCourses.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      default:
        sortedCourses = [...userCourses];
    }
    
    filteredCourses = sortedCourses;
  }

  // Add this function to generate skeleton items
  function getSkeletonItems(count: number) {
    return Array(count).fill(null);
  }

  async function handleTogglePrivacy(courseId: string, isPublic: boolean) {
    try {
      const updatedCourse = await toggleCoursePrivacy(courseId, isPublic);
      console.log('Updated course:', updatedCourse);
      
      // Update the course in userCourses
      userCourses = userCourses.map(course => 
        course.id === courseId 
          ? { ...course, ...updatedCourse }
          : course
      );
      
      // Refresh public courses list
      const updatedPublicCourses = await getPublicCourses();
      publicCourses = updatedPublicCourses;
      
      // Update filtered courses
      filteredCourses = [...userCourses];
    } catch (error) {
      console.error('Error toggling course privacy:', error);
    }
  }
</script>

<style>
  :global(body) {
    @apply antialiased;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }
</style>

<CustomTourGuide />

<LoadingOverlay show={showLoadingOverlay} />

<CourseCreationOverlay show={showCreationOverlay} />

<div class="mx-auto max-w-auto sm:px-0 lg:pl-0">
  <!-- Create Course Section -->
  <div class="relative overflow-hidden rounded-lg mb-8 lg:mb-12">  
    <div>
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl lg:text-h1 font-normal text-light-text-primary dark:text-dark-text-primary mb-2">
          Hi {$user?.displayName?.split(' ')[0] || 'there'} 👋 <br> What would you like to <span class="text-brand-red">Learn?</span>
        </h1>
         
        <p class="text-light-text-secondary dark:text-dark-text-secondary text-semibody lg:text-h4 mb-8">
          Enter your learning objectives below we'll help you create a comprehensive course.
        </p>
      </div>
      
      <form 
        id="create-course"
        on:submit={handleCreateCourse} 
        class="relative flex-1 max-w-auto h-[54px] lg:max-w-[812px] tour-create-course"
      >
        <button 
          type="submit"
          class="absolute right-0 z-10 sm:px-4 sm:h-[52px] sm:bg-brand-red sm:text-white sm:rounded-2xl sm:hover:bg-[#D63B42] sm:transition-colors sm:duration-200 sm:flex sm:items-center sm:gap-2 sm:text-base sm:whitespace-nowrap
          max-sm:w-[56px] max-sm:h-[52px] max-sm:rounded-2xl max-sm:bg-brand-red max-sm:flex max-sm:items-center max-sm:justify-center max-sm:p-4 max-sm:gap-2"
        >
          <span class="hidden lg:block">Create Course</span>
          <img 
            src="/icons/arrow-right-white.svg" 
            alt="Create"
            class="w-5 h-5" 
          />
        </button>
        <div class="relative w-full">
          <div 
            class="absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-200 ease-in-out {
              isInputFocused ? 'opacity-0 translate-x-[0px]' : 'opacity-60'
            }"
          >
            <img 
              src="/icons/ai-magic.svg" 
              alt="AI Magic"
              class="w-6 h-6" 
            />
          </div>
          <input
            id="course-objective-input"
            type="text"
            bind:value={learningObjective}
            bind:this={courseObjectiveInput}
            placeholder="Enter what you want to learn..."
            on:focus={() => isInputFocused = true}
            on:blur={() => isInputFocused = false}
            on:input={handleObjectiveInput}
            class="w-full text-body pl-12 pr-3 h-[52px] rounded-2xl border-[1.5px] border-light-border dark:border-dark-border focus:pl-4 focus:outline-none focus:border-brand-red bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary transition-colors duration-300 ease-in-out"
          />
        </div>
      </form>
    </div>
  </div>
   
  <!-- Continue Learning Section -->
  <div class="mb-8 tour-explore-courses">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-h4-medium lg:text-h4 text-light-text-primary dark:text-dark-text-primary">Continue Learning</h4>
      {#if $user && userCourses.length > 0}
        <div class="flex items-center gap-2">
          <a href="/my-courses" class="text-[#42C1C8] text-body hover:underline">Show All</a>
          <img src="/icons/arrow-right.svg" alt="arrow-right.svg" class="w-6 h-6">
        </div>
      {/if}
    </div>
    
    <div class="h-[1px] bg-light-border dark:bg-dark-border mb-6"></div>
    
    <UserCourseList 
      courses={userCourses}
      loading={loading}
      error={error}
    />
  </div>
  
  <!-- Trending Community Courses Section -->
  <section class="mb-6 tour-trending">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-h4-medium lg:text-h4 text-light-text-primary dark:text-dark-text-primary">Trending Courses</h4>
      <div class="flex items-center gap-2">
        <a href="/trending" class="text-brand-turquoise text-body hover:underline">Show All</a>
        <img src="/icons/arrow-right.svg" alt="arrow-right.svg" class="w-6 h-6">
      </div>
    </div>
    <div class="h-[1px] bg-light-border dark:bg-dark-border mb-6"></div>
    <TrendingCourseList 
      courses={publicCourses}
      loading={trendingCoursesLoading}
    />
  </section>
</div>

{#if showShareModal}
  <ShareModal
    show={showShareModal}
    shareType="course"
    id={selectedCourseId}
    courseId={selectedCourseId}
    onClose={() => showShareModal = false}
    on:focusCourseObjective={focusCourseObjective}
  />
{/if}

<!-- Debug button for tour - remove in production -->
{#if import.meta.env.DEV}
  <button 
    class="fixed bottom-4 right-4 z-50 bg-brand-red text-white px-4 py-2 rounded-lg shadow-lg lg:right-8"
    on:click={() => tourStore.startTour(dashboardTourSteps, 'dashboard')}
  >
    Start Tour
  </button>
{/if} 