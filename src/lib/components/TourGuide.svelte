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
                    <div class="w-full max-w-[456px] text-center mt-[-20px]">
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
                <button id="skip-tour-btn" class="flex-1 h-12 md:h-[54px] px-4 py-2 rounded-2xl outline outline-1 outline-offset-[-1px] outline-[#41c1cb] flex justify-center items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors">
                  <span class="text-[#41c1cb] text-sm md:text-base font-medium md:font-semibold font-['Poppins'] leading-normal">Skip Tour</span>
                </button>
                <button id="start-tour-btn" class="flex-1 h-12 md:h-[54px] px-4 py-2 bg-[#eb434a] rounded-2xl shadow-[0px_4px_26px_0px_#EB434A] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#D93940]">
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
                skipBtn.onclick = () => {
                  tour.cancel();
                };
              }
              
              if (startBtn) {
                startBtn.onclick = () => {
                  // Move to the next step (which is now the finish step)
                  tour.next();
                };
              }
            }
          }, 100);
        }
      }
    });

    // Create Course step
    tour.addStep({
      id: 'create-course',
      title: '', // No title shown in the screenshot
      text: `<!-- Custom Arrow -->
            <div class="shepherd-arrow-custom"></div>
            <!-- Main Content matching the screenshot -->
            <div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 overflow-hidden relative">
              <div class="self-stretch justify-start text-white text-h4 font-bold">Create Course</div>
              <div class="self-stretch justify-start text-white text-semi-body">Enter the subject or skills you want to learn in order to create a personalized course tailored to your learning goals.</div>
              <div class="self-stretch inline-flex justify-between items-center">
                <!-- Progress Bar -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-[13px] h-3 bg-white rounded-full"></div>
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-create-course-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-create-course-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors">
                    <span class="justify-start text-black text-semi-body">Next</span>
                  </button>
                </div>
              </div>
            </div>`,
      attachTo: {
        element: '.tour-create-course', // Target the form/button container
        on: 'bottom' // Position the step below the target
      },
      buttons: [], // Use custom buttons defined in HTML
      classes: 'shepherd-theme-custom shepherd-create-course-step',
      canClickTarget: false,
      arrow: false, // Disable default arrow, use custom one via CSS
      scrollTo: false, // Don't scroll for body attachment
      modalOverlayOpeningPadding: 0, // Adjust padding if needed
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-create-course-btn');
              const nextBtn = document.getElementById('next-create-course-btn');

              if (skipBtn) {
                skipBtn.onclick = () => {
                  tour.cancel(); // Or tour.complete()
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
                <!-- Progress Bar (Step 2/?) -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-6 h-3 bg-white rounded-full"></div>
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-explore-courses-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-explore-courses-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors">
                    <span class="justify-start text-black text-semi-body">Next</span>
                  </button>
                </div>
              </div>
            </div>`,
      attachTo: {
        element: '.explore-course-btn',
        on: 'bottom'
      },
      buttons: [], // Use custom buttons
      classes: 'shepherd-theme-custom shepherd-explore-courses-step',
      canClickTarget: false,
      arrow: false,
      scrollTo: true, // Enable scrolling to keep the step visible
      modalOverlayOpeningPadding: 5,
      when: {
        show: () => {
          setTimeout(() => {
            if (browser) {
              const skipBtn = document.getElementById('skip-explore-courses-btn');
              const nextBtn = document.getElementById('next-explore-courses-btn');

              if (skipBtn) {
                skipBtn.onclick = () => {
                  tour.cancel(); // Or tour.complete()
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
                <!-- Progress Bar -->
                <div class="w-[118px] h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden">
                  <div class="w-[39px] h-3 bg-white rounded-full"></div>
                </div>
                <!-- Buttons -->
                <div class="flex justify-start items-center gap-2">
                  <button id="skip-trending-btn" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors">
                    <span class="justify-start text-white text-semi-body">Skip</span>
                  </button>
                  <button id="next-trending-btn" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors">
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
                    <div class="w-full max-w-[456px] text-center">
                      <span class="text-light-text-secondary dark:text-white text-2xl md:text-2xl font-semibold font-['Poppins'] leading-normal">You're all set!</span>
                      <div class="text-light-text-secondary dark:text-white text-tour-text-mobile md:text-tour-text mt-3">
                        You're now ready to start your learning journey. Enjoy using Youversity!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="w-full max-w-[162px] inline-flex justify-start items-start">
                <button id="finish-tour-btn" class="flex-1 h-12 md:h-[54px] px-4 md:px-8 py-2 bg-[#eb434a] rounded-2xl shadow-[0px_4px_26px_0px_#EB434A] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#D93940]">
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
        const key = `tour-completed-${$user.uid}`;
        localStorage.setItem(key, 'true');
        console.log('Tour completed, saved to localStorage:', key);
      }
    });

    // Save tour completion to localStorage when tour is canceled
    tour.on('cancel', () => {
      if (browser && $user) {
        const key = `tour-completed-${$user.uid}`;
        localStorage.setItem(key, 'true');
        console.log('Tour canceled, saved to localStorage:', key);
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
    if (!browser || !$user) return false;
    const key = `tour-completed-${$user.uid}`;
    const completed = localStorage.getItem(key) === 'true';
    console.log('Checking if tour is completed:', { key, completed });
    return completed;
  }

  // Function to start the tour
  export function startTour() {
    console.log('Manual tour start requested');
    if (!tour) {
      tour = initTour();
    }
    
    // No need to check for required elements since we removed all middle steps
    
    console.log('Starting tour...');
    
    // Reset any existing tour state
    if (tour.isActive()) {
      tour.cancel();
    }
    
    // Start fresh
    setTimeout(() => {
      tour.start();
    }, 100);
  }

  onMount(() => {
    console.log('TourGuide mounted, autoStart:', autoStart);
    
    if (autoStart && !hasCompletedTour()) {
      // Use a longer delay to ensure the page is fully rendered
      console.log('Scheduling tour to start in 2000ms');
      
      setTimeout(() => {
        console.log('Attempting to start automatic tour');
        tour = initTour();
        startTour();
      }, 2000);
    }
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
    max-width: fit-content !important; /* Override default max-width */
    width: auto !important; /* Let content determine width */
    background: transparent !important; /* Make step background transparent */
    border: none !important; /* Remove default border */
    box-shadow: none !important; /* Remove default shadow */
    /* Apply the specific shadow from the screenshot using filter */
    filter: drop-shadow(-9px 13px 19px rgba(0,0,0,0.37));
    border-radius: 16px !important; /* Match inner container radius */
    z-index: 10000 !important; /* Ensure it's above other elements and overlay */
    /* Remove padding that might interfere with custom layout */
    padding: 0 !important;
    /* Add vertical offset to adjust position */
    transform: translateY(20px);
  }

  :global(.shepherd-create-course-step .shepherd-content) {
    padding: 0 !important;
    background: transparent !important;
    border-radius: 16px !important;
    box-shadow: none !important;
    
  }

  :global(.shepherd-create-course-step .shepherd-header) {
    display: none !important; /* Hide header */
  }

  :global(.shepherd-create-course-step .shepherd-text) {
    padding: 0 !important;
    margin: 0 !important;
    position: relative; /* Needed for absolute positioning of the arrow */
  }

  /* Custom Arrow Styling - Pointing UP */
  :global(.shepherd-create-course-step .shepherd-arrow-custom) {
    position: absolute;
    /* Position below the box's coordinate system, making it appear above */
    top: -16px;
    rotate: 180deg;
    right: 14px;
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-top: 18px solid #EE434A;
    z-index: 1; /* Ensure arrow is above the main content box background */
  }

  /* Ensure dark mode doesn't break the arrow */
 :global(.dark .shepherd-create-course-step .shepherd-arrow-custom) {
    border-top-color: theme('colors.brand.red') !important; /* Use Tailwind theme function */
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
    position: absolute !important;
    left: 368.43px !important;
    top: 724px !important;
    transform: none !important;
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
    left: 20px;
    rotate: 180deg;
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
</style> 