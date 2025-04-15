<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import Shepherd from 'shepherd.js';
  import 'shepherd.js/dist/css/shepherd.css';
  import { user } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  export let autoStart = false;
  
  let tour: any; // Fix type definition
  let robotImage = '/tour-guide.gif'; // Using the existing tour-guide.gif in static directory
  let initialized = false;
  let typingTimer: NodeJS.Timeout;
  let courseObjective = '';
  let isTyping = false;

  // Determine attachment positions based on screen size
  function getAttachmentPosition(defaultPosition: string) {
    const isMobile = browser && window.innerWidth < 730;
    
    // For mobile devices, we position most elements on the bottom except for special cases
    if (isMobile) {
      // If default is right, use bottom for mobile (for sidebar navigation)
      if (defaultPosition === 'right') return 'bottom';
      
      // Otherwise keep the default position for most cases
      return defaultPosition;
    }
    
    return defaultPosition;
  }

  // Resize handler function
  function handleResize() {
    if (browser && tour && tour.isActive()) {
      const currentStep = tour.getCurrentStep();
      if (currentStep && currentStep.options && currentStep.options.attachTo) {
        const defaultPosition = currentStep.options.attachTo.defaultPosition || 'bottom';
        
        // Update position based on current screen size
        currentStep.options.attachTo.on = getAttachmentPosition(defaultPosition);
        
        // Trigger re-positioning
        tour.show(currentStep.id);
      }
    }
  }

  // Function to initialize the tour
  function initTour() {
    if (!browser) return;
    
    if (initialized && tour) {
      console.log('Tour already initialized, returning existing tour');
      return tour;
    }
    
    console.log('Initializing Shepherd tour');

    // Create a new tour
    tour = new Shepherd.Tour({
      defaultStepOptions: {
        classes: 'shepherd-theme-custom',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: false
        },
        arrow: true,
        modalOverlayOpeningPadding: 10,
        highlightClass: '',
        canClickTarget: true
      },
      useModalOverlay: true,
      exitOnEsc: false,
      confirmCancel: false
    });
    
    // Add resize handler
    if (browser) {
      window.addEventListener('resize', handleResize);
    }

    // Welcome step with responsive design
    tour.addStep({
      id: 'welcome',
      title: '',
      text: `<div class="w-full inline-flex flex-col justify-start items-center gap-8">
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
              <div class="w-full max-w-[326px] inline-flex justify-start items-start gap-4 mt-8">
                <button id="skip-tour-btn" class="flex-1 h-12 md:h-[54px] px-4 py-2 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#41c1cb] flex justify-center items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors" type="button">
                  <span class="text-[#41c1cb] text-sm md:text-base font-medium md:font-semibold font-['Poppins'] leading-normal">Skip Tour</span>
                </button>
                <button id="start-tour-btn" class="flex-1 h-12 md:h-[54px] px-4 py-2 bg-[#eb434a] rounded-2xl shadow-[0px_4px_26px_0px_#EB434A] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#D93940]" type="button">
                  <span class="text-white text-sm md:text-base font-medium md:font-semibold font-['Poppins'] leading-normal">Start Tour</span>
                </button>
              </div>
            </div>`,
      buttons: [],
      classes: 'shepherd-welcome-step',
      highlightClass: 'shepherd-highlight',
      canClickTarget: false,
      cancelIcon: { enabled: false },
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-tour-btn');
              const startBtn = document.getElementById('start-tour-btn');
              
              if (skipBtn) {
                skipBtn.addEventListener('click', () => {
                  console.log('Skip tour button clicked');
                  tour.cancel();
                });
              }
              
              if (startBtn) {
                startBtn.addEventListener('click', () => {
                  console.log('Start tour button clicked');
                  // Move to the next step
                  tour.next();
                });
              }
            }
          }, 100);
        }
      }
    });

    // Explore Courses step
    tour.addStep({
      id: 'explore-courses',
      title: '', // No title shown
      text: `<!-- Custom Arrow -->
            <div class="shepherd-arrow-custom"></div>
            <!-- Main Content matching the screenshot -->
            <div class="w-[311px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
              <div class="self-stretch justify-start text-white text-body font-bold leading-7">Explore Courses</div>
              <div class="self-stretch justify-start text-white text-semi-body">Explore a wide range of courses designed to help you acquire new skills and deepen your knowledge.</div>
              <div class="self-stretch inline-flex justify-between items-center">
                <!-- Progress Bar (Step 1/7) -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-[16.8px] h-3 bg-white rounded-full"></div> <!-- 1/7 -->
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-explore-courses-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-explore-courses-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button">
                    <span class="justify-start text-black text-semi-body">Next</span>
                  </button>
                </div>
              </div>
            </div>`,
      attachTo: {
        element: '.explore-course-btn',
        on: getAttachmentPosition('bottom')
      },
      buttons: [], // Use custom buttons
      classes: 'shepherd-theme-custom shepherd-explore-courses-step',
      canClickTarget: false,
      arrow: false,
      scrollTo: { behavior: 'smooth', block: 'center' },
      modalOverlayOpeningPadding: 5,
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-explore-courses-btn');
              const nextBtn = document.getElementById('next-explore-courses-btn');
              
              // Ensure proper positioning when shown
              const exploreBtn = document.querySelector('.explore-course-btn');
              const tourStep = document.querySelector('.shepherd-explore-courses-step');
              
              if (exploreBtn && tourStep) {
                // Set exact position as specified
                (tourStep as HTMLElement).style.position = 'absolute';
                (tourStep as HTMLElement).style.left = '368.43px';
                (tourStep as HTMLElement).style.top = '705px';
                (tourStep as HTMLElement).style.transform = 'none !important';
                
                // Ensure visibility by scrolling if needed
                exploreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Adjust the arrow position to point directly to the button
                const arrow = tourStep.querySelector('.shepherd-arrow-custom');
                if (arrow) {
                  (arrow as HTMLElement).style.left = '50%';
                  (arrow as HTMLElement).style.transform = 'translateX(-50%) rotate(180deg)';
                }
              }
              
              if (skipBtn) {
                skipBtn.onclick = () => {
                  tour.cancel();
                };
              }
              
              if (nextBtn) {
                nextBtn.onclick = () => {
                  tour.next();
                };
              }
            }
          }, 100);
        }
      }
    });

    // Trending Courses step
    tour.addStep({
      id: 'trending-courses',
      title: '',
      text: `<!-- Custom Arrow -->
            <div class="shepherd-arrow-custom"></div>
            <!-- Main Content -->
            <div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
              <div class="self-stretch justify-start text-white text-h4 font-bold">Trending Courses</div>
              <div class="self-stretch justify-start text-white text-semi-body">Discover the trending courses that are gaining popularity among learners.</div>
              <div class="self-stretch inline-flex justify-between items-center">
                <!-- Progress Bar (Step 2/7) -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-[33.7px] h-3 bg-white rounded-full"></div> <!-- 2/7 -->
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-trending-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-trending-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button">
                    <span class="justify-start text-black text-semi-body">Next</span>
                  </button>
                </div>
              </div>
            </div>`,
      attachTo: {
        element: '.tour-navigation a[href="/trending"]',
        on: 'right'
      },
      buttons: [],
      classes: 'shepherd-theme-custom shepherd-trending-step',
      canClickTarget: false,
      arrow: false,
      scrollTo: false,
      modalOverlayOpeningPadding: 5,
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-trending-btn');
              const nextBtn = document.getElementById('next-trending-btn');

              if (skipBtn) {
                skipBtn.onclick = () => {
                  tour.cancel();
                };
              }

              if (nextBtn) {
                nextBtn.onclick = () => {
                  tour.next();
                };
              }
            }
          }, 100);
        }
      }
    });

    // My Courses step
    tour.addStep({
      id: 'my-courses',
      title: '',
      text: `<!-- Custom Arrow -->
            <div class="shepherd-arrow-custom"></div>
            <!-- Main Content -->
            <div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
              <div class="self-stretch justify-start text-white text-h4 font-bold">My Courses</div>
              <div class="self-stretch justify-start text-white text-semi-body">Access and continue your enrolled courses. Track your progress and pick up where you left off.</div>
              <div class="self-stretch inline-flex justify-between items-center">
                <!-- Progress Bar (Step 3/7) -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-[50.5px] h-3 bg-white rounded-full"></div> <!-- 3/7 -->
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-my-courses-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-my-courses-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button">
                    <span class="justify-start text-black text-semi-body">Next</span>
                  </button>
                </div>
              </div>
            </div>`,
      attachTo: {
        element: '.tour-navigation a[href="/my-courses"]',
        on: 'right'
      },
      buttons: [],
      classes: 'shepherd-theme-custom shepherd-my-courses-step',
      canClickTarget: false,
      arrow: false,
      scrollTo: false,
      modalOverlayOpeningPadding: 5,
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-my-courses-btn');
              const nextBtn = document.getElementById('next-my-courses-btn');

              if (skipBtn) {
                skipBtn.onclick = () => {
                  tour.cancel();
                };
              }

              if (nextBtn) {
                nextBtn.onclick = () => {
                  tour.next();
                };
              }
            }
          }, 100);
        }
      }
    });

    // Bookmarks step
    tour.addStep({
      id: 'bookmarks',
      title: '',
      text: `<!-- Custom Arrow -->
            <div class="shepherd-arrow-custom"></div>
            <!-- Main Content -->
            <div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
              <div class="self-stretch justify-start text-white text-h4 font-bold">Bookmarks</div>
              <div class="self-stretch justify-start text-white text-semi-body">Save and organize your favorite courses for quick access. Never lose track of interesting content.</div>
              <div class="self-stretch inline-flex justify-between items-center">
                <!-- Progress Bar (Step 4/7) -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-[67.4px] h-3 bg-white rounded-full"></div> <!-- 4/7 -->
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-bookmarks-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-bookmarks-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button">
                    <span class="justify-start text-black text-semi-body">Next</span>
                  </button>
                </div>
              </div>
            </div>`,
      attachTo: {
        element: '.tour-navigation a[href="/bookmarks"]',
        on: 'right'
      },
      buttons: [],
      classes: 'shepherd-theme-custom shepherd-bookmarks-step',
      canClickTarget: false,
      arrow: false,
      scrollTo: false,
      modalOverlayOpeningPadding: 5,
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-bookmarks-btn');
              const nextBtn = document.getElementById('next-bookmarks-btn');

              if (skipBtn) {
                skipBtn.onclick = () => {
                  tour.cancel();
                };
              }

              if (nextBtn) {
                nextBtn.onclick = () => {
                  tour.next();
                };
              }
            }
          }, 100);
        }
      }
    });

    // Settings step
    tour.addStep({
      id: 'settings',
      title: '',
      text: `<!-- Custom Arrow -->
            <div class="shepherd-arrow-custom"></div>
            <!-- Main Content -->
            <div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
              <div class="self-stretch justify-start text-white text-h4 font-bold">Settings</div>
              <div class="self-stretch justify-start text-white text-semi-body">Customize your learning experience. Manage your profile, preferences, and account settings.</div>
              <div class="self-stretch inline-flex justify-between items-center">
                <!-- Progress Bar (Step 5/7) -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-[84.3px] h-3 bg-white rounded-full"></div> <!-- 5/7 -->
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-settings-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-settings-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button">
                    <span class="justify-start text-black text-semi-body">Next</span>
                  </button>
                </div>
              </div>
            </div>`,
      attachTo: {
        element: '.tour-navigation a[href="/settings?tab=profile"]',
        on: 'right'
      },
      buttons: [],
      classes: 'shepherd-theme-custom shepherd-settings-step',
      canClickTarget: false,
      arrow: false,
      scrollTo: false,
      modalOverlayOpeningPadding: 5,
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-settings-btn');
              const nextBtn = document.getElementById('next-settings-btn');

              if (skipBtn) {
                skipBtn.onclick = () => {
                  tour.cancel();
                };
              }

              if (nextBtn) {
                nextBtn.onclick = () => {
                  tour.next();
                };
              }
            }
          }, 100);
        }
      }
    });

    // Create Course step (Interactive)
    tour.addStep({
      id: 'create-course-interactive',
      title: '',
      text: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
              <div class="self-stretch justify-start text-white text-h4 font-bold">Let's Create Your First Course!</div>
              <div id="create-course-instruction" class="self-stretch justify-start text-white text-semi-body">After this tour, you'll be able to enter what you want to learn in the input field above. For example: "How to bake sourdough bread" or "Introduction to Python programming".</div>
              <div class="self-stretch inline-flex justify-between items-center">
                <!-- Progress Bar (Step 6/7) -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-[101.1px] h-3 bg-white rounded-full"></div> <!-- 6/7 -->
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-create-course-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-create-course-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button">
                    <span class="justify-start text-black text-semi-body">Next</span>
                  </button>
                </div>
              </div>
            </div>`,
      attachTo: {
        element: '#course-objective-input',
        on: 'bottom'
      },
      classes: 'shepherd-theme-custom shepherd-create-course-step no-backdrop',
      canClickTarget: false,
      arrow: true,
      scrollTo: false,
      modalOverlayOpeningPadding: 0,
      buttons: [],
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-create-course-btn');
              const nextBtn = document.getElementById('next-create-course-btn');

              if (skipBtn) {
                skipBtn.onclick = () => {
                  tour.complete();
                };
              }

              if (nextBtn) {
                nextBtn.onclick = () => {
                  tour.next();
                };
              }
            }
          }, 100);
        }
      }
    });

    // Finish step with responsive design
    tour.addStep({
      id: 'finish',
      title: '',
      text: `<div class="w-full inline-flex flex-col justify-start items-center gap-[56px]">
              <div class="self-stretch flex flex-col justify-start items-center">
                <div class="w-[116.5px] h-[142px] relative overflow-hidden">
                  <img class="w-[140px] h-[170px] object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" src="${robotImage}" alt="Tour Guide Robot" />
                </div>
                <div class="self-stretch flex flex-col justify-start items-center gap-4 mt-4">
                  <div class="self-stretch flex flex-col justify-start items-center">
                    <div class="w-full min-w-[350px] max-w-[456px] text-center mt-[-20px]">
                      <span class="text-light-text-secondary dark:text-white text-2xl md:text-2xl font-semibold font-['Poppins'] leading-normal">You're all set!</span>
                      <div class="text-light-text-secondary dark:text-white text-tour-text-mobile md:text-tour-text mt-3">
                        You're now ready to start your learning journey. Enjoy using Youversity!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="w-full max-w-[162px] inline-flex justify-start items-start">
                <button id="finish-tour-btn" class="flex-1 h-12 md:h-[54px] px-4 md:px-8 py-2 bg-[#eb434a] rounded-2xl shadow-[0px_4px_26px_0px_#EB434A] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#D93940]" type="button">
                  <span class="text-white text-sm md:text-base font-medium md:font-semibold font-['Poppins'] leading-normal">Finish</span>
                </button>
              </div>
            </div>`,
      buttons: [],
      classes: 'shepherd-finish-step',
      canClickTarget: false,
      cancelIcon: { enabled: false },
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const finishBtn = document.getElementById('finish-tour-btn');
              
              if (finishBtn) {
                finishBtn.onclick = () => {
                  tour.complete();
                };
              }
            }
          }, 100);
        }
      }
    });

    // Save tour completion to localStorage when tour is completed
    tour.on('complete', () => {
      if (browser && $user) {
        markTourAsFullyCompleted();
        // Focus the course objective input after tour completes
        setTimeout(() => {
          const inputElement = document.getElementById('course-objective-input') as HTMLInputElement;
          if (inputElement) {
            inputElement.focus();
            // Add a visual highlight to guide the user
            inputElement.style.borderColor = '#EE434A';
            inputElement.style.boxShadow = '0 0 0 4px rgba(238, 67, 74, 0.1)';
            
            // Remove the highlight after 5 seconds
            setTimeout(() => {
              inputElement.style.borderColor = '';
              inputElement.style.boxShadow = '';
            }, 5000);
          }
        }, 500);
      }
    });

    // Save tour completion to localStorage when tour is canceled
    tour.on('cancel', () => {
      if (browser && $user) {
        markTourAsPartiallyCompleted();
      }
    });
    
    // Force single step display
    tour.on('show', (e) => {
      console.log('Tour showing step:', e.step.id);
      
      // Make sure only one step is visible at a time
      if (browser) {
        // Get all shepherd elements
        const allSteps = document.querySelectorAll('.shepherd-element');
        
        // Hide all steps except the current one
        allSteps.forEach(step => {
          if (step.getAttribute('data-id') !== e.step.id) {
            (step as HTMLElement).style.display = 'none';
          } else {
            (step as HTMLElement).style.display = 'block';
          }
        });
      }
    });

    initialized = true;
    return tour;
  }

  // Function to check if the tour has been completed before
  function hasCompletedTour() {
    if (!browser) {
      console.log('Not in browser environment, skipping tour check');
      return false;
    }
    
    if (!$user) {
      console.log('User not authenticated yet, treating as new user for tour');
      return false;
    }
    
    const key = `tour-completed-${$user.uid}`;
    // Check if tour was fully completed (not just canceled)
    const tourFullyCompleted = localStorage.getItem(key) === 'fully-completed';
    // Check if tour was canceled or partially completed
    const tourPartiallyCompleted = localStorage.getItem(key) === 'true';
    
    // Check if user has any courses (created or enrolled)
    const hasCoursesKey = `user-has-courses-${$user.uid}`;
    const userHasCourses = localStorage.getItem(hasCoursesKey) === 'true';
    
    console.log('Tour completion check:', { 
      userId: $user.uid, 
      tourKey: key, 
      tourValueInStorage: localStorage.getItem(key),
      tourFullyCompleted,
      tourPartiallyCompleted,
      hasCoursesKey,
      userHasCourses,
      localStorageAvailable: typeof localStorage !== 'undefined'
    });
    
    // Reset tour status if user has no courses and hasn't fully completed the tour
    if (!userHasCourses && !tourFullyCompleted) {
      console.log('User has no courses and tour was not fully completed, resetting tour status');
      localStorage.removeItem(key);
      return false;
    }
    
    // If tour was fully completed OR (partially completed AND user has courses)
    // then don't show the tour again
    return tourFullyCompleted || (tourPartiallyCompleted && userHasCourses);
  }

  // Function to mark tour as fully completed
  function markTourAsFullyCompleted() {
    if (browser && $user) {
      const key = `tour-completed-${$user.uid}`;
      localStorage.setItem(key, 'fully-completed');
      console.log('Tour marked as fully completed:', key);
    }
  }

  // Function to mark tour as partially completed
  function markTourAsPartiallyCompleted() {
    if (browser && $user) {
      const key = `tour-completed-${$user.uid}`;
      localStorage.setItem(key, 'true');
      console.log('Tour marked as partially completed:', key);
    }
  }

  // Function to start the tour
  export function startTour() {
    console.log('Manual tour start requested');
    if (!tour) {
      console.log('Tour not initialized, initializing now');
      tour = initTour();
    }
    
    // Debug info for tour elements
    if (browser) {
      const tourElements = [
        '.tour-create-course',
        '.tour-trending',
        '.tour-explore-courses',
        '.tour-navigation'
      ];
      
      console.log('Tour element check before starting:');
      tourElements.forEach(selector => {
        const element = document.querySelector(selector);
        console.log(`${selector}: ${element ? 'Found' : 'MISSING'}`);
      });
    }
    
    console.log('Starting tour...');
    
    // Reset any existing tour state
    if (tour.isActive()) {
      console.log('Tour was already active, canceling previous state');
      tour.cancel();
    }
    
    // Start fresh
    setTimeout(() => {
      console.log('Actually starting tour now');
      tour.start();
    }, 100);
  }

  // Function to check if user has any courses
  export function updateUserHasCourses(hasCourses) {
    if (browser && $user) {
      const key = `user-has-courses-${$user.uid}`;
      localStorage.setItem(key, hasCourses ? 'true' : 'false');
      console.log(`User courses status updated: ${hasCourses ? 'Has courses' : 'No courses'}`);
    }
  }

  function handleObjectiveInput(event: Event) {
    const input = event.target as HTMLInputElement;
    courseObjective = input.value;
    isTyping = true;
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      isTyping = false;
      if (courseObjective.trim()) {
        updateCreateCourseStep();
      }
    }, 2000);
  }

  function updateCreateCourseStep() {
    const createButton = document.querySelector('#create-course-button');
    if (createButton && courseObjective.trim()) {
      createButton.classList.add('tour-highlight-button');
      const step = tour?.getCurrentStep();
      if (step?.options.id === 'create-course-interactive') {
        step.updateStepOptions({
          text: 'Great! Now click the "Create Course" button to start building your course.'
        });
      }
    }
  }

  function focusObjectiveInput() {
    setTimeout(() => {
      const input = document.querySelector('#course-objective-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 300);
  }

  function handleCreateCourseStep() {
    const step = tour?.getCurrentStep();
    if (step?.options.id === 'create-course-interactive') {
      focusObjectiveInput();
      const input = document.querySelector('#course-objective-input') as HTMLInputElement;
      if (input) {
        input.addEventListener('input', handleObjectiveInput);
      }
    }
  }

  function cleanupCreateCourseStep() {
    clearTimeout(typingTimer);
    const input = document.querySelector('#course-objective-input') as HTMLInputElement;
    if (input) {
      input.removeEventListener('input', handleObjectiveInput);
    }
    const createButton = document.querySelector('#create-course-button');
    if (createButton) {
      createButton.classList.remove('tour-highlight-button');
    }
  }

  function handleTourComplete() {
    if (courseObjective.trim()) {
      const createButton = document.querySelector('#create-course-button') as HTMLElement;
      if (createButton) {
        createButton.click();
      }
    }
  }

  onMount(() => {
    console.log('TourGuide mounted, autoStart:', autoStart);
    console.log('Current user state:', { 
      isAuthenticated: !!$user,
      userId: $user?.uid
    });
    
    // First check if we're in the browser
    if (!browser) {
      console.log('Not in browser environment, skipping tour');
      return;
    }
    
    // Initialize user courses status if not already set
    if ($user) {
      const hasCoursesKey = `user-has-courses-${$user.uid}`;
      if (localStorage.getItem(hasCoursesKey) === null) {
        // Default to false if not set
        localStorage.setItem(hasCoursesKey, 'false');
      }
    }
    
    // Wait for content to be fully loaded before starting tour
    let contentLoadedCheck = 0;
    const maxChecks = 10;
    const checkInterval = 1000; // 1 second interval
    
    const checkContentLoaded = () => {
      contentLoadedCheck++;
      console.log(`Content load check ${contentLoadedCheck}/${maxChecks}`);
      
      // Check if trending courses are loaded
      const trendingSection = document.querySelector('.tour-trending');
      const trendingLoaded = !!trendingSection && !trendingSection.querySelector('.skeleton-loading');
      
      console.log('Trending section status:', {
        found: !!trendingSection,
        loaded: trendingLoaded
      });
      
      if (trendingLoaded || contentLoadedCheck >= maxChecks) {
        // Content is loaded or we've reached max checks
        console.log('Content loaded check complete, proceeding with tour');
        
        if (autoStart) {
          // Force a fresh check rather than caching the result
          const shouldShowTour = !hasCompletedTour();
          console.log('Should show tour?', shouldShowTour);
          
          if (shouldShowTour) {
        console.log('Attempting to start automatic tour');
        tour = initTour();
        startTour();
            
            // If tour doesn't start for some reason, try one more time after delay
            setTimeout(() => {
              if (!tour || !tour.isActive()) {
                console.log('Tour didn\'t start properly, trying again...');
                tour = initTour();
                startTour();
              }
      }, 2000);
          } else {
            console.log('Tour already completed or conditions not met, not starting');
          }
        }
      } else {
        // Content not yet loaded, check again
        setTimeout(checkContentLoaded, checkInterval);
      }
    };
    
    // Start checking if content is loaded
    setTimeout(checkContentLoaded, checkInterval);
  });

  // Listen for auth store changes
  onMount(() => {
    // Set up a subscription to the user store
    const unsubscribe = user.subscribe((currentUser) => {
      console.log('User auth state changed:', currentUser ? 'logged in' : 'logged out');
      
      if (!currentUser && browser) {
        // User logged out, clean up tour-specific localStorage items
        const keysToCheck = Object.keys(localStorage);
        const tourKeys = keysToCheck.filter(key => 
          key.startsWith('tour-completed-') || 
          key.startsWith('user-has-courses-')
        );
        
        console.log('Cleaning up tour keys after logout:', tourKeys);
        
        // Clean up all tour keys when no user is logged in
        tourKeys.forEach(key => {
          localStorage.removeItem(key);
          console.log('Removed localStorage key:', key);
        });
      }
    });
    
    // Clean up subscription on component destroy
    return unsubscribe;
  });

  onDestroy(() => {
    if (tour) {
      console.log('TourGuide destroyed, canceling tour');
      tour.cancel();
    }
    
    if (browser) {
      // Clean up event listeners
      window.removeEventListener('resize', handleResize);
    }
  });
</script>

<style>
  :global(.shepherd-theme-custom) {
    @apply shadow-xl;
    max-width: 633px;
    width: calc(100% - 32px);
    z-index: 50;
    border-radius: 32px;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  :global(.dark .shepherd-theme-custom) {
    border: 1px solid rgba(255, 255, 255, 0.10);
    box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.3);
  }

  :global(.shepherd-welcome-step), :global(.shepherd-finish-step) {
    width: 100%;
    height: 615px;
    border-radius: 32px;
    background: linear-gradient(180deg, #FFF2F3 0%, #EDFEFF 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  :global(.dark .shepherd-welcome-step), :global(.dark .shepherd-finish-step) {
    background: linear-gradient(180deg, #241015 0%, #0E1313 100%);
    border: 1px solid rgba(255, 255, 255, 0.10);
  }

  @media (max-width: 730px) {
    :global(.shepherd-theme-custom) {
      max-width: 389px;
    }
    
    :global(.shepherd-welcome-step), :global(.shepherd-finish-step) {
      height: 580px;
    }
    
    :global(.text-tour-text-mobile) {
      font-size: 20px;
      line-height: 28px;
      font-weight: 400;
    }
  }
  
  :global(.text-tour-text) {
    font-size: 24px;
    line-height: 32px;
    font-weight: 400;
  }

  /* Hide default buttons for welcome and finish steps as we use custom ones in the HTML */
  :global(.shepherd-welcome-step .shepherd-footer), 
  :global(.shepherd-finish-step .shepherd-footer) {
    display: none !important;
  }

  /* Hide default cancel icon */
  :global(.shepherd-cancel-icon) {
    display: none !important;
  }
  
  :global(.shepherd-theme-custom .shepherd-header) {
    background-color: transparent;
    border-top-left-radius: 32px;
    border-top-right-radius: 32px;
    border-bottom: none;
    padding: 0;
  }

  :global(.shepherd-theme-custom .shepherd-title) {
    @apply hidden;
  }

  :global(.shepherd-theme-custom .shepherd-text) {
    @apply text-gray-800 dark:text-white p-0;
    width: 100%;
  }

  :global(.shepherd-theme-custom .shepherd-footer) {
    @apply px-6 flex justify-center gap-5;
    @apply border-t-0;
    background-color: transparent;
    position: relative;
    padding-top: 20px;
    padding-bottom: 20px;
  }

  :global(.shepherd-theme-custom .shepherd-button) {
    min-width: 100px;
    height: 48px;
    padding: 0 20px;
    border-radius: 16px;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  @media (min-width: 731px) {
    :global(.shepherd-theme-custom .shepherd-button) {
      min-width: 140px;
      height: 56px;
      padding: 0 24px;
      font-size: 16px;
    }
  }

  :global(.shepherd-theme-custom .shepherd-button-primary) {
    background-color: #eb434a;
    color: white;
    box-shadow: 0px 4px 26px 0px #EB434A;
  }
  :global(.shepherd-theme-custom .shepherd-button-primary:hover) {
    background-color: #D93940;
    box-shadow: 0px 4px 26px 0px #EB434A;
  }

  :global(.shepherd-theme-custom .shepherd-button-secondary) {
    background-color: transparent;
    color: #42C1C8;
    border: 1px solid rgba(66, 193, 200, 0.5);
  }
  :global(.shepherd-theme-custom .shepherd-button-secondary:hover) {
    background-color: rgba(66, 193, 200, 0.05);
    border-color: #42C1C8;
  }

  :global(.shepherd-highlight) {
    @apply ring-2 ring-brand-red ring-opacity-50;
  }

  /* Apply blur effect to the modal overlay/backdrop */
  :global(.shepherd-modal-overlay-container) {
    @apply bg-black/50;
    z-index: 45;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  
  :global(.dark .shepherd-modal-overlay-container) {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  
  /* Additional responsive styles for in-tour steps */
  :global(.shepherd-element:not(.shepherd-welcome-step):not(.shepherd-finish-step)) {
    border-radius: 16px;
    background: white;
    box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.1);
  }

  :global(.dark .shepherd-element:not(.shepherd-welcome-step):not(.shepherd-finish-step)) {
    background: linear-gradient(180deg, #241015 0%, #0E1313 100%);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.3);
  }
  
  /* Ensure arrow color matches */
  :global(.shepherd-arrow::before) {
    background-color: #eb434a !important;
  }
  
  :global(.dark .shepherd-arrow::before) {
    background-color: #eb434a !important;
  }

  /* Clean up default button styling to ensure our custom buttons work properly */
  :global(.shepherd-button) {
    display: none;
  }

  /* Dark mode text colors */
  :global(.dark .text-light-text-secondary) {
    color: #FFFFFF;
  }

  /* Styling for the new create-course step */
  :global(.shepherd-create-course-step) {
    max-width: fit-content !important;
    width: auto !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    filter: drop-shadow(-9px 13px 19px rgba(0,0,0,0.37));
    border-radius: 16px !important;
    z-index: 10000 !important;
    padding: 0 !important;
    transition: all 0.3s ease-in-out !important;
  }

  :global(.shepherd-create-course-step .shepherd-content) {
    padding: 0 !important;
    background: transparent !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }

  :global(.shepherd-create-course-step .shepherd-text) {
    padding: 0 !important;
    margin: 0 !important;
    position: relative;
  }

  /* Button highlight animation */
  :global(.tour-highlight-button) {
    outline: 2px solid #EE434A !important;
    outline-offset: 2px !important;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(238, 67, 74, 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(238, 67, 74, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(238, 67, 74, 0);
    }
  }

  /* Input highlight when focused during tour */
  :global(.shepherd-create-course-step ~ #course-objective-input:focus) {
    border-color: #EE434A !important;
    box-shadow: 0 0 0 4px rgba(238, 67, 74, 0.1) !important;
  }

  /* Smooth transition for the step movement */
  :global(.shepherd-create-course-step[data-popper-placement]) {
    transition: transform 0.3s ease-in-out !important;
  }

  /* Hide Shepherd's default arrow if using custom one, but we'll use Shepherd's default arrow here */
  :global(.shepherd-create-course-step .shepherd-arrow-custom) {
    /* display: none; */ /* Keep default arrow */
  }

  /* Ensure Shepherd default arrow color matches */
  :global(.shepherd-create-course-step .shepherd-arrow::before) {
    background-color: #EE434A !important;
  }

  :global(.dark .shepherd-create-course-step .shepherd-arrow::before) {
    background-color: #EE434A !important;
  }

  /* Remove backdrop specifically for the interactive create course step */
  :global(.shepherd-create-course-step.no-backdrop ~ .shepherd-modal-overlay-container) {
    display: none !important;
  }

  /* Ensure input is clickable during tour */
  :global(.shepherd-create-course-step ~ #course-objective-input) {
    pointer-events: auto !important;
    z-index: 1000 !important;
  }

  /* Input highlight when focused during tour */
  :global(.shepherd-create-course-step ~ #course-objective-input:focus) {
    border-color: #EE434A !important;
    box-shadow: 0 0 0 4px rgba(238, 67, 74, 0.1) !important;
    z-index: 1000 !important;
  }

  /* Styling for the explore-courses step */
  :global(.shepherd-explore-courses-step) {
    max-width: fit-content !important;
    width: auto !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    filter: drop-shadow(-9px 13px 19px rgba(0,0,0,0.37));
    border-radius: 16px !important;
    z-index: 10000 !important;
    padding: 0 !important;
    /* Position will be set dynamically in JavaScript */
  }

  :global(.shepherd-explore-courses-step .shepherd-content) {
    padding: 0 !important;
    background: transparent !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }

  :global(.shepherd-explore-courses-step .shepherd-header) {
    display: none !important;
  }

  :global(.shepherd-explore-courses-step .shepherd-text) {
    padding: 0 !important;
    margin: 0 !important;
    position: relative;
  }

  /* Custom Arrow Styling for explore-courses */
  :global(.shepherd-explore-courses-step .shepherd-arrow-custom) {
    position: absolute;
    top: -16px;
    left: 50%;
    transform: translateX(-50%) rotate(180deg);
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 18px solid #EE434A;
    z-index: 1;
  }

 :global(.dark .shepherd-explore-courses-step .shepherd-arrow-custom) {
    border-top-color: theme('colors.brand.red') !important;
  }

  /* Styling for the trending step */
  :global(.shepherd-trending-step) {
    max-width: fit-content !important;
    width: auto !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    filter: drop-shadow(-9px 13px 19px rgba(0,0,0,0.37));
    border-radius: 16px !important;
    z-index: 10000 !important;
    padding: 0 !important;
    position: fixed !important;
    left: 211px !important;
    top: 176px !important;
    transform: none !important;
  }

  :global(.shepherd-trending-step .shepherd-content) {
    padding: 0 !important;
    background: transparent !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }

  :global(.shepherd-trending-step .shepherd-header) {
    display: none !important;
  }

  :global(.shepherd-trending-step .shepherd-text) {
    padding: 0 !important;
    margin: 0 !important;
    position: relative;
  }

  /* Custom Arrow Styling for trending step */
  :global(.shepherd-trending-step .shepherd-arrow-custom) {
    position: absolute;
    top: 20px;
    left: -16px;
    rotate: 90deg;
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 18px solid #EE434A;
    z-index: 1;
  }

 :global(.dark .shepherd-trending-step .shepherd-arrow-custom) {
    border-top-color: theme('colors.brand.red') !important;
  }

  /* Styling for the my-courses step */
  :global(.shepherd-my-courses-step) {
    max-width: fit-content !important;
    width: auto !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    filter: drop-shadow(-9px 13px 19px rgba(0,0,0,0.37));
    border-radius: 16px !important;
    z-index: 10000 !important;
    padding: 0 !important;
    position: fixed !important;
    left: 211px !important;
    top: 226px !important;
    transform: none !important;
  }

  :global(.shepherd-my-courses-step .shepherd-content) {
    padding: 0 !important;
    background: transparent !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }

  :global(.shepherd-my-courses-step .shepherd-header) {
    display: none !important;
  }

  :global(.shepherd-my-courses-step .shepherd-text) {
    padding: 0 !important;
    margin: 0 !important;
    position: relative;
  }

  :global(.shepherd-my-courses-step .shepherd-arrow-custom) {
    position: absolute;
    top: 20px;
    left: -16px;
    rotate: 90deg;
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 18px solid #EE434A;
    z-index: 1;
  }

  /* Styling for the bookmarks step */
  :global(.shepherd-bookmarks-step) {
    max-width: fit-content !important;
    width: auto !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    filter: drop-shadow(-9px 13px 19px rgba(0,0,0,0.37));
    border-radius: 16px !important;
    z-index: 10000 !important;
    padding: 0 !important;
    position: fixed !important;
    left: 211px !important;
    top: 276px !important;
    transform: none !important;
  }

  :global(.shepherd-bookmarks-step .shepherd-content) {
    padding: 0 !important;
    background: transparent !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }

  :global(.shepherd-bookmarks-step .shepherd-header) {
    display: none !important;
  }

  :global(.shepherd-bookmarks-step .shepherd-text) {
    padding: 0 !important;
    margin: 0 !important;
    position: relative;
  }

  :global(.shepherd-bookmarks-step .shepherd-arrow-custom) {
    position: absolute;
    top: 20px;
    left: -16px;
    rotate: 90deg;
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 18px solid #EE434A;
    z-index: 1;
  }

  /* Styling for the settings step */
  :global(.shepherd-settings-step) {
    max-width: fit-content !important;
    width: auto !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    filter: drop-shadow(-9px 13px 19px rgba(0,0,0,0.37));
    border-radius: 16px !important;
    z-index: 10000 !important;
    padding: 0 !important;
    position: fixed !important;
    left: 211px !important;
    top: 326px !important;
    transform: none !important;
  }

  :global(.shepherd-settings-step .shepherd-content) {
    padding: 0 !important;
    background: transparent !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }

  :global(.shepherd-settings-step .shepherd-header) {
    display: none !important;
  }

  :global(.shepherd-settings-step .shepherd-text) {
    padding: 0 !important;
    margin: 0 !important;
    position: relative;
  }

  :global(.shepherd-settings-step .shepherd-arrow-custom) {
    position: absolute;
    top: 20px;
    left: -16px;
    rotate: 90deg;
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 18px solid #EE434A;
    z-index: 1;
  }

  :global(.dark .shepherd-my-courses-step .shepherd-arrow-custom),
  :global(.dark .shepherd-bookmarks-step .shepherd-arrow-custom),
  :global(.dark .shepherd-settings-step .shepherd-arrow-custom) {
    border-top-color: theme('colors.brand.red') !important;
  }
</style> 