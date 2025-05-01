<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  // @ts-ignore - Svelte component import 
  import ModuleVideoGrid from "$lib/components/ModuleVideoGrid.svelte";
  // @ts-ignore - Svelte component import
  import YoutubeUrlInput from "$lib/components/YoutubeUrlInput.svelte";
  import type { CourseStructure, VideoItem } from "$lib/types/course";
  import {
    initialLoadingState,
    finalLoadingState,
  } from "$lib/stores/loadingState";
  import { page } from "$app/stores";
  import { goto, afterNavigate } from "$app/navigation";
  import { Plus, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { getVideoTranscript } from "$lib/services/transcriptUtils";
  import { tick } from 'svelte';
  import { auth, setAuthTokenCookie, refreshToken } from "$lib/firebase";
  import { saveCourseToFirebase, enrollInCourse, getUserCourses } from "$lib/firebase";
  import { user, isAuthenticated } from "$lib/stores/auth";
  // @ts-ignore - Svelte component import
  import CourseGenerationHeader from "$lib/components/CourseGenerationHeader.svelte";
  // @ts-ignore - Svelte component import
  import CourseGenerationModal from "$lib/components/CourseGenerationModal.svelte";
  import type { PageData } from './$types';
  import { tourStore } from "$lib/stores/tourStore";
  import type { TourStep } from "$lib/stores/tourStore";
  import CustomTourGuide from "$lib/components/CustomTourGuide.svelte";
  import { get } from 'svelte/store';

  // Define interface that describes the server data
  interface ServerAuthData {
    serverAuth: {
      user: { uid: string; email: string; isAuthenticated: boolean } | null;
      tokenFound: boolean;
      isAuthenticated: boolean;
    };
  }

  // Get data from +page.server.ts
  export let data: ServerAuthData;
  console.log("SVELTE: Server auth data:", data.serverAuth);

  let courseObjective = "";
  let courseStructure: CourseStructure | null = null;
  let loading = false;
  let error: string | null = null;
  let moduleVideos: VideoItem[][] = [];
  let selectedVideos: number[] = [];
  let currentModuleIndex = 0;
  let showCustomUrlInput = false;
  let moduleTranscripts: string[] = [];
  let allModulesLoaded = false;
  let visitedModules: boolean[] = [];
  let moduleRegenerating: Record<number, boolean> = {};
  let nextUnvisitedModuleIndex: number = -1;
  let shouldStartTourOnLoad = false; // Flag to track if tour should start
  let createCourseTourCompletedKey: string | null = null;
  let globalUsedVideoIds = new Set<string>(); // <-- Add this line

  // Reference to the module navigation container for scrolling
  let moduleNavContainer: HTMLElement;

  // --- Tour Steps for Create Course Page (INTERACTIVE VERSION) ---
  // Re-use robot image variable if defined elsewhere, or define here
  let robotImage = '/tour-guide.gif'; 

  const createCourseTourSteps: TourStep[] = [
    {
      id: 'cc-welcome',
      content: `<div class="w-full inline-flex flex-col justify-start items-center gap-14 p-12 rounded-2xl bg-gradient-light dark:bg-gradient-dark">
        <div class="self-stretch flex flex-col justify-start items-center">
          <div class="w-[116.5px] h-[142px] relative overflow-hidden">
            <img class="w-[140px] h-[170px] object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" src="${robotImage}" alt="Tour Guide Robot" />
          </div>
          <div class="self-stretch flex flex-col justify-start items-center gap-4 mt-4">
            <div class="self-stretch flex flex-col justify-start items-center">
              <div class="w-full min-w-[350px] max-w-[456px] text-center mt-[-20px]">
                <span class="text-light-text-secondary dark:text-white text-2xl md:text-2xl font-semibold font-['Poppins'] leading-normal">Awesome!<br> Your course structure is ready. Let's build your course!</span>
                <div class="text-light-text-secondary dark:text-white text-tour-text-mobile md:text-tour-text">
                  Just follow a few simple steps to select the best videos for each module. Ready? 
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full max-w-[326px] inline-flex justify-start items-start gap-4">
          <button data-tour-action="next" class="flex-1 h-12 md:h-[54px] px-4 py-2 bg-[#eb434a] rounded-2xl shadow-[0px_4px_26px_0px_#EB434A] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#D93940]" type="button">
            <span class="text-white text-sm md:text-base font-medium md:font-semibold font-['Poppins'] leading-normal">Let's Build!</span>
          </button>
        </div>
      </div>`,
      placement: 'center',
    },
    {
      id: 'cc-video-grid-interactive',
      target: '[data-tour="module-video-grid"]',
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative">
                  <!-- Arrow Down -->
                  <svg class="absolute left-[12%] -translate-x-[12%] bottom-[-28px] w-[34px] h-[38px] z-10 transform rotate-180" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
                  <div class="self-stretch justify-start text-white text-h4 font-bold">Select a Video for Module {{moduleNumber}}</div>
                  <div class="self-stretch justify-start text-white text-semi-body">Click on a video card below to select it for the current module. The tour will continue once you select one.</div>
                  <div class="self-stretch inline-flex items-center gap-4 mt-2">
                      <div class="flex-grow h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="h-3 bg-white rounded-full" style="width: {{progressBarWidth}}%;"></div></div>
                  </div>
               </div>`,
      placement: 'top' 
    },
    {
      id: 'cc-select-next-module-interactive',
      target: '[data-tour="select-next-module-button"]',
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative">
                   <!-- Arrow Right -->
                  <svg class="absolute left-[12%] -translate-x-[12%] bottom-[-28px] w-[34px] h-[38px] z-10 transform rotate-180" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
                  <div class="self-stretch justify-start text-white text-h4 font-bold">Continue to Module {{moduleNumber}}</div>
                  <div class="self-stretch justify-start text-white text-semi-body">Great! Now click the button below to proceed to the next module.</div>
                   <div class="self-stretch inline-flex justify-between items-center mt-2">
                     <div class="flex-grow h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="h-3 bg-white rounded-full" style="width: {{progressBarWidth}}%;"></div></div>
                   </div>
                 </div>`,
      placement: 'top'
    },
    {
      id: 'cc-add-custom-video',
      target: '[data-tour="add-custom-video-button"]', 
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative">
                  <!-- Arrow pointing left -->
                  <svg class="absolute bottom-[-28px] right-[8%] -translate-x-1/5 w-[34px] h-[38px] z-10 transform rotate-[180deg]" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
                  <div class="self-stretch justify-start text-white text-h4 font-bold">Add Your Own Video?</div>
                  <div class="self-stretch justify-start text-white text-semi-body">Don't see the perfect video for your module? <br> You can add your own by clicking the 'Add Custom Video' button, and pasting the link to your preferred video.</div>
                  <div class="self-stretch inline-flex justify-between items-center mt-2">
                     <div class="flex-grow h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="h-3 bg-white rounded-full" style="width: {{progressBarWidth}}%;"></div></div> 
                     <div class="flex justify-start items-center gap-2 ml-auto">
                        <button data-tour-action="cancel" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button"><span class="justify-start text-white text-semi-body">Skip</span></button>
                        <button data-tour-action="next" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button"><span class="justify-start text-black text-semi-body">Next</span></button>
                     </div>
                  </div>
                </div>`,
      placement: 'top', // TEST: Position relative to the button
      disableOverlay: true, // No spotlight
    },
    {
      id: 'cc-create-complete',
      target: '[data-tour="create-complete-course-button"]',
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative">
                    <!-- Arrow pointing up -->
                    <svg class="absolute left-[12%] -translate-x-[12%] bottom-[-28px] w-[34px] h-[38px] z-10 transform rotate-180" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
                    <div class="self-stretch justify-start text-white text-h4 font-bold">Congratulations!</div>
                    <div class="self-stretch justify-start text-white text-semi-body">You're just one step away from completing your first course!
Click 'Create Complete Course' below to publish it and start learning.</div>
                    <div class="self-stretch inline-flex justify-between items-center mt-2">
                       <div class="flex-grow h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="w-full h-3 bg-white rounded-full" style="width: {{progressBarWidth}}%;"></div></div> 
                    </div>
                  </div>`,
      placement: 'top', // Place above the "Create Complete Course" button
      disableOverlay: true, // Keep interactive if needed, but maybe not required?
    }
  ];

  // --- Tour Steps for Create Course Page (MOBILE VERSION) ---
  const createCourseTourStepsMobile: TourStep[] = [
    {
      id: 'cc-welcome-mobile',
      content: `<div class="w-full inline-flex flex-col justify-start items-center gap-14 p-12 rounded-2xl bg-gradient-light dark:bg-gradient-dark">
        <div class="self-stretch flex flex-col justify-start items-center">
          <div class="w-[116.5px] h-[142px] relative overflow-hidden">
            <img class="w-[140px] h-[170px] object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" src="${robotImage}" alt="Tour Guide Robot" />
          </div>
          <div class="self-stretch flex flex-col justify-start items-center gap-4 mt-4">
            <div class="self-stretch flex flex-col justify-start items-center">
              <div class="w-full min-w-[350px] max-w-[456px] text-center mt-[-20px]">
                <span class="text-light-text-secondary dark:text-white text-2xl font-semibold font-['Poppins'] leading-normal">Awesome!<br> Your course structure is ready. Let's build your course!</span>
                <div class="text-light-text-secondary dark:text-white text-tour-text-mobile">
                  Just follow a few simple steps to select the best videos for each module. Ready?
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="w-full max-w-[326px] inline-flex justify-start items-start gap-4">
          <button data-tour-action="next" class="flex-1 h-12 px-4 py-2 bg-[#eb434a] rounded-2xl shadow-[0px_4px_26px_0px_#EB434A] flex justify-center items-center gap-2 cursor-pointer hover:bg-[#D93940]" type="button">
            <span class="text-white text-sm font-medium font-['Poppins'] leading-normal">Let's Build!</span>
          </button>
        </div>
      </div>`,
      placement: 'center',
      
    },
    {
      id: 'cc-video-grid-interactive-mobile',
      target: '[data-tour="module-navigation-mobile"]', // Target mobile module navigation
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative">
                  <!-- Arrow Down -->
                  <svg class="absolute left-[12%] -translate-x-[12%] bottom-[-28px] w-[34px] h-[38px] z-10 transform rotate-180" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
                  <div class="self-stretch justify-start text-white text-h4 font-bold">Select a Video for Module {{moduleNumber}}</div>
                  <div class="self-stretch justify-start text-white text-semi-body">Tap a video below to add it to the module. The tour will continue once you select one.</div>
                  <div class="self-stretch inline-flex items-center gap-4 mt-2">
                      <div class="flex-grow h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="h-3 bg-white rounded-full" style="width: {{progressBarWidth}}%;"></div></div>
                  </div>
               </div>`,
      placement: 'top', // Position below the module nav
      disableOverlay: true,
    },
    {
      id: 'cc-select-next-module-interactive-mobile',
      target: '[data-tour="select-next-module-button-mobile"]', // Target mobile button
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative">
                   <!-- Arrow Up -->
                   <svg class="absolute left-[12%] -translate-x-[12%] bottom-[-28px] w-[34px] h-[38px] z-10 transform rotate-180" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
                  <div class="self-stretch justify-start text-white text-h4 font-bold">Continue to Module {{moduleNumber}}</div>
                  <div class="self-stretch justify-start text-white text-semi-body">Great! Now tap the button below to proceed to the next module.</div>
                   <div class="self-stretch inline-flex justify-between items-center mt-2">
                     <div class="flex-grow h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="h-3 bg-white rounded-full" style="width: {{progressBarWidth}}%;"></div></div>
                   </div>
                 </div>`,
      placement: 'top', // Position above mobile button
      disableOverlay: true,
    },
    {
      id: 'cc-add-custom-video-mobile',
      // target: '[data-tour="module-navigation-mobile"]',
      target: '[data-tour="add-custom-video-button-mobile"]', // Target mobile button
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative">
                  <!-- Arrow Down -->
                  <svg class="absolute left-[84%] -translate-x-[84%] top-[-28px] w-[34px] h-[38px] z-10 transform " width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
                  <div class="self-stretch justify-start text-white text-h4 font-bold">Add Your Own Video?</div>
                  <div class="self-stretch justify-start text-white text-semi-body">Don't see the perfect video? <br> Tap 'Add Custom Video' to paste a link to your preferred video.</div>
                  <div class="self-stretch inline-flex justify-between items-center mt-2">
                     <div class="flex-grow h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="h-3 bg-white rounded-full" style="width: {{progressBarWidth}}%;"></div></div>
                     <div class="flex justify-start items-center gap-2 ml-auto">
                        <button data-tour-action="cancel" class="w-[63px] px-4 py-1 rounded outline outline-1 outline-offset-[-1px] outline-white flex justify-center items-center gap-2.5 cursor-pointer hover:bg-white/10 transition-colors" type="button"><span class="justify-start text-white text-semi-body">Skip</span></button>
                        <button data-tour-action="next" class="px-4 py-1 bg-white rounded flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-200 transition-colors" type="button"><span class="justify-start text-black text-semi-body">Next</span></button>
                     </div>
                  </div>
                </div>`,
      placement: 'bottom', // Position below mobile button
      disableOverlay: true,
    },
    {
      id: 'cc-create-complete-mobile',
      target: '[data-tour="create-complete-course-button-mobile"]', // Target mobile button
      content: `<div class="w-[374px] p-4 bg-brand-red rounded-2xl outline outline-1 outline-offset-[-1px] outline-black/5 inline-flex flex-col justify-start items-start gap-4 relative">
                    <!-- Arrow Up -->
                     <svg class="absolute left-[12%] -translate-x-[12%] bottom-[-28px] w-[34px] h-[38px] z-10 transform rotate-180" width="38" height="34" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2774 1.92017C18.0512 0.6084 19.9488 0.6084 20.7226 1.92017L37.5724 30.4838C38.3588 31.8171 37.3977 33.5 35.8497 33.5H2.15026C0.602323 33.5 -0.358837 31.8171 0.427647 30.4838L17.2774 1.92017Z" fill="#EB434A"/></svg>
                    <div class="self-stretch justify-start text-white text-h4 font-bold">Congratulations!</div>
                    <div class="self-stretch justify-start text-white text-semi-body">You're just one step away! Tap 'Complete Creating Course' below to publish it.</div>
                    <div class="self-stretch inline-flex justify-between items-center mt-2">
                       <div class="flex-grow h-2.5 bg-black/20 rounded-full inline-flex flex-col justify-center items-start gap-2.5 overflow-hidden"><div class="w-full h-3 bg-white rounded-full" style="width: {{progressBarWidth}}%;"></div></div>
                    </div>
                  </div>`,
      placement: 'top', // Position above mobile button
      disableOverlay: true,
    }
  ];

  // Enable persistence by saving course state to localStorage
  function saveStateToStorage() {
    if (browser) {
      try {
        // Save essential course creation state
        localStorage.setItem('youversity_course_objective', courseObjective);
        
        // Save course structure if available
        if (courseStructure) {
          localStorage.setItem('youversity_course_structure', JSON.stringify(courseStructure));
        }
        
        // Save module videos state
        if (moduleVideos.length > 0) {
          localStorage.setItem('youversity_module_videos', JSON.stringify(moduleVideos));
        }
        
        // Save selected videos
        if (selectedVideos.length > 0) {
          localStorage.setItem('youversity_selected_videos', JSON.stringify(selectedVideos));
        }
        
        // Save visited modules
        if (visitedModules.length > 0) {
          localStorage.setItem('youversity_visited_modules', JSON.stringify(visitedModules));
        }
        
        // Save current module index
        localStorage.setItem('youversity_current_module_index', currentModuleIndex.toString());
        
        console.log('Course state saved to localStorage');
      } catch (e) {
        console.error('Error saving course state to localStorage:', e);
      }
    }
  }

  // Function to load state from localStorage
  function loadStateFromStorage() {
    if (browser) {
      try {
        // Restore course objective
        const savedObjective = localStorage.getItem('youversity_course_objective');
        if (savedObjective) {
          courseObjective = savedObjective;
        }
        
        // Restore course structure
        const savedStructure = localStorage.getItem('youversity_course_structure');
        if (savedStructure) {
          courseStructure = JSON.parse(savedStructure);
        }
        
        // Restore module videos
        const savedModuleVideos = localStorage.getItem('youversity_module_videos');
        if (savedModuleVideos) {
          moduleVideos = JSON.parse(savedModuleVideos);
        }
        
        // Restore selected videos
        const savedSelectedVideos = localStorage.getItem('youversity_selected_videos');
        if (savedSelectedVideos) {
          selectedVideos = JSON.parse(savedSelectedVideos);
        }
        
        // Restore visited modules
        const savedVisitedModules = localStorage.getItem('youversity_visited_modules');
        if (savedVisitedModules) {
          visitedModules = JSON.parse(savedVisitedModules);
        }
        
        // Restore current module index
        const savedModuleIndex = localStorage.getItem('youversity_current_module_index');
        if (savedModuleIndex) {
          currentModuleIndex = parseInt(savedModuleIndex);
        }
        
        // If we have course structure but no objective from URL, use the stored one
        if (courseStructure && !courseObjective) {
          console.log('Using stored course objective:', courseObjective);
        }
        
        console.log('Course state loaded from localStorage');
        return !!courseStructure; // Return true if we restored a valid course
      } catch (e) {
        console.error('Error loading course state from localStorage:', e);
        return false;
      }
    }
    return false;
  }

  // Clear state in localStorage when needed (e.g., after successful course creation)
  function clearStoredState() {
    if (browser) {
      localStorage.removeItem('youversity_course_objective');
      localStorage.removeItem('youversity_course_structure');
      localStorage.removeItem('youversity_module_videos');
      localStorage.removeItem('youversity_selected_videos');
      localStorage.removeItem('youversity_visited_modules');
      localStorage.removeItem('youversity_current_module_index');
    }
  }

  // Function to scroll the module navigation
  function scrollModuleNav(direction: 'left' | 'right') {
    if (!moduleNavContainer) return;
    
    const scrollAmount = 200; // Adjust this value as needed
    const currentScroll = moduleNavContainer.scrollLeft;
    
    moduleNavContainer.scrollTo({
      left: direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount,
      behavior: 'smooth'
    });
  }

  function checkAllModulesLoaded() {
    if (!courseStructure) return false;
    return (
      moduleVideos.length === courseStructure.OG_Module_Title.length &&
      moduleVideos.every((moduleVideo) => moduleVideo && moduleVideo.length > 0)
    );
  }

  function allModulesVisited() {
    if (!courseStructure) return false;
    // Make sure we have the right length and all modules are visited
    return visitedModules.length === courseStructure.OG_Module_Title.length && 
           visitedModules.every(visited => visited === true);
  }

  // Add a reactive variable to track if all modules have been visited
  $: allModulesAreVisited = courseStructure && 
     visitedModules.length === courseStructure.OG_Module_Title.length && 
     visitedModules.every(visited => visited === true);

  // Save state whenever important variables change
  $: if (courseObjective || courseStructure || moduleVideos.length > 0 || selectedVideos.length > 0) {
    saveStateToStorage();
  }

  // Update nextUnvisitedModuleIndex whenever visitedModules changes
  $: {
    if (visitedModules.length > 0) {
      nextUnvisitedModuleIndex = getNextUnvisitedModuleIndex();
      console.log("Next unvisited module index updated:", nextUnvisitedModuleIndex);
    }
  }

  function selectModule(index: number) {
    if (index < 0 || !courseStructure || index >= courseStructure.OG_Module_Title.length) {
      console.warn("Invalid module index:", index);
      return;
    }
    
    console.log("Selecting module:", index);
    currentModuleIndex = index;
    
    // Ensure the module is marked as visited
    visitedModules[index] = true;
    // Create a new array to trigger reactivity
    visitedModules = [...visitedModules];
    
    console.log("Visited modules after selection:", visitedModules);
    console.log("All modules visited:", allModulesVisited());
    
    // Save current module index to localStorage
    if (browser) {
      localStorage.setItem('youversity_current_module_index', index.toString());
      localStorage.setItem('youversity_visited_modules', JSON.stringify(visitedModules));
    }
  }

  function getNextUnvisitedModuleIndex() {
    if (!courseStructure) return -1;
    for (let i = 0; i < courseStructure.OG_Module_Title.length; i++) {
      if (!visitedModules[i]) {
        return i;
      }
    }
    return -1;
  }

  function handleCustomVideoAdd(
    video: VideoItem,
    moduleIndex: number,
    addAtBeginning: boolean = false,
  ) {
    if (!moduleVideos[moduleIndex]) {
      moduleVideos[moduleIndex] = [];
    }
    if (addAtBeginning) {
      moduleVideos[moduleIndex] = [video, ...moduleVideos[moduleIndex]];
    } else {
      moduleVideos[moduleIndex] = [...moduleVideos[moduleIndex], video];
    }
    moduleVideos = [...moduleVideos];
    allModulesLoaded = checkAllModulesLoaded();
    showCustomUrlInput = false;
  }

  // Function to ensure we have a fresh token
  async function ensureFreshToken(): Promise<string | null> {
    console.log("Requesting fresh auth token...");
    
    if (!auth.currentUser) {
      console.error("No authenticated user found in auth.currentUser");
      error = "You must be logged in to create courses.";
      return null;
    }
    
    console.log("Current user UID:", auth.currentUser.uid);
    
    try {
      // Use our centralized token refresh function
      const token = await refreshToken();
      if (!token) {
        throw new Error("Failed to refresh token");
      }
      
      console.log("Token refresh successful. Token length:", token.length);
      console.log("Token JWT format check:", token.split('.').length === 3 ? "Valid JWT format" : "Invalid JWT format");
      
      // Double check token cookie was set
      const cookies = document.cookie.split(';');
      let tokenCookieFound = false;
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'firebase-token') {
          tokenCookieFound = true;
          console.log("Token cookie verified. Length:", value.length);
          break;
        }
      }
      
      if (!tokenCookieFound) {
        console.warn("Token cookie not found after refresh!");
      }
      
      return token;
    } catch (err) {
      console.error("Error refreshing token:", err);
      error = "Authentication error. Please try logging in again.";
      return null;
    }
  }

  async function fetchVideosForModule(
    searchPrompt: string,
    moduleIndex: number,
    retryCount = 0,
    isRegeneration = false,
  ) {
    if (!courseStructure) return;

    // Only update loading state if it's not a regeneration
    if (!isRegeneration) {
      initialLoadingState.setCurrentModule(moduleIndex + 1);
      initialLoadingState.setStep(
        `Searching videos for Module ${moduleIndex + 1}: ${courseStructure.OG_Module_Title[moduleIndex]}`,
      );
    }
    
    const maxRetries = 3;

    try {
      if (!searchPrompt?.trim()) {
        throw new Error("Search prompt is required");
      }

      // Get a fresh token
      const token = await ensureFreshToken();
      if (!token) return;
      
      // Create query URL with parameters
      const queryParams = new URLSearchParams({
        query: searchPrompt.trim(),
        moduleTitle: courseStructure.OG_Module_Title[moduleIndex],
        moduleIndex: moduleIndex.toString(),
        retry: retryCount.toString(),
        // Pass the globally used video IDs as a comma-separated string
        usedVideoIds: Array.from(globalUsedVideoIds).join(',') 
      });
      
      // Prepare headers with multiple sources of auth
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Authorization": `Bearer ${token}`
      };
      
      // Add server auth as backup
      const serverAuthuid = data?.serverAuth?.user?.uid as string | undefined;
      if (serverAuthuid) {
        headers["X-Server-Auth-UID"] = serverAuthuid;
      }
      
      const response = await fetch(
        `/api/search-videos?${queryParams.toString()}`,
        {
          headers,
          credentials: 'include'
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch videos");
      }
      const responseData = await response.json();

      // Update the videos for this module
      moduleVideos[moduleIndex] = responseData.videos;
      moduleVideos = [...moduleVideos]; // Trigger reactivity

      // Add the newly fetched video IDs to the global set
      responseData.videos.forEach((video: VideoItem) => {
        if (video && video.videoId) {
          globalUsedVideoIds.add(video.videoId);
        }
      });
      globalUsedVideoIds = new Set(globalUsedVideoIds); // Trigger reactivity if needed

      // Check if all modules are loaded after this update
      allModulesLoaded = checkAllModulesLoaded();

      // Only update progress if it's not a regeneration
      if (!isRegeneration) {
        // Calculate progress: 20% for structure + 80% for modules
        // Each module takes an equal share of the remaining 80%
        const moduleProgress =
          (moduleIndex + 1) / courseStructure.OG_Module_Title.length;
        const totalProgress = 20 + moduleProgress * 80;
        initialLoadingState.setProgress(totalProgress);
      }
    } catch (err: any) {
      console.error(`Error in module ${moduleIndex + 1}:`, err);
      error = err.message;
      if (!isRegeneration) {
        initialLoadingState.setError(error);
        initialLoadingState.stopLoading();
      }
    }
  }

  async function handleRegenerateModuleVideos(moduleIndex: number) {
    try {
      error = null;
      moduleRegenerating[moduleIndex] = true;
      const searchPrompt =
        courseStructure!.OG_Module_YouTube_Search_Prompt[moduleIndex];
      await fetchVideosForModule(searchPrompt, moduleIndex, 0, true); // Pass true for isRegeneration
    } catch (err: any) {
      console.error(
        `Error regenerating videos for module ${moduleIndex + 1}:`,
        err,
      );
      error = `Failed to regenerate videos for module ${moduleIndex + 1}`;
    } finally {
      moduleRegenerating[moduleIndex] = false;
    }
  }

  async function handleSaveCourse() {
    if (!$user) {
      error = "Please sign in to save the course";
      return;
    }

    if (!courseStructure) return;

    // Complete the tour immediately when the final button is clicked
    if (get(tourStore).isTourActive) { // Use get() for synchronous check
        tourStore.completeTour();
        await tick(); // Force DOM update before showing modal
    }

    // Start final course generation process
    finalLoadingState.startLoading(courseStructure.OG_Course_Title);
    finalLoadingState.setStep("Starting course generation...");
    finalLoadingState.setProgress(0);

    try {
      loading = true;
      error = null;
      moduleTranscripts = [];

      // Fetch transcripts for all selected videos
      for (let i = 0; i < selectedVideos.length; i++) {
        finalLoadingState.setStep(
          `Fetching transcript for Module ${i + 1}: ${courseStructure.OG_Module_Title[i]}`,
        );

        const video = moduleVideos[i][selectedVideos[i]];
        const transcript = await getVideoTranscript(video.videoId);
        moduleTranscripts[i] = transcript;

        const progress = ((i + 1) / selectedVideos.length) * 40; // First 40% for transcripts
        finalLoadingState.setProgress(progress);
      }

      finalLoadingState.setStep("Generating course content and quizzes...");
      finalLoadingState.setProgress(60);

      const selectedVideosList = moduleVideos.map((videos, index) => ({
        ...videos[selectedVideos[index]],
        moduleIndex: index,
        moduleTitle: courseStructure?.OG_Module_Title[index],
      }));

      // Get a fresh token
      const token = await ensureFreshToken();
      if (!token) return;

      // Prepare headers with multiple sources of auth
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      
      // Add server auth as backup
      const serverAuthuid = data?.serverAuth?.user?.uid as string | undefined;
      if (serverAuthuid) {
        headers["X-Server-Auth-UID"] = serverAuthuid;
      }

      const response = await fetch("/api/create-final-course", {
        method: "POST",
        headers,
        body: JSON.stringify({
          courseStructure,
          selectedVideos: selectedVideosList,
          moduleTranscripts,
          // Include server auth info
          serverAuthInfo: data?.serverAuth ? {
            uid: data.serverAuth.user?.uid as string | undefined,
            isAuthenticated: data.serverAuth.isAuthenticated as boolean
          } : null
        }),
        credentials: 'include' // Include cookies with the request
      });

      finalLoadingState.setProgress(80);
      finalLoadingState.setStep("Processing course content...");

      const responseData = await response.json();
      if (!responseData.success)
        throw new Error(responseData.error || "Failed to create final course");

      finalLoadingState.setStep("Saving your course...");
      finalLoadingState.setProgress(90);

      // Save to Firebase
      const courseId = await saveCourseToFirebase($user.uid, {
        ...responseData.course,
        isPublic: false,
        createdBy: $user.uid,
        createdAt: new Date(),
        views: 0,
        likes: 0,
      });

      finalLoadingState.setStep("Course is ready!");
      // Creators now need to explicitly enroll in their courses instead of automatic enrollment
      // await enrollInCourse($user.uid, courseId);

      finalLoadingState.setProgress(100);
      finalLoadingState.setCourseId(courseId);

      // Clear stored state after successful course creation
      clearStoredState();
    } catch (err: any) {
      console.error("Error saving course:", err);
      error = err.message;
      finalLoadingState.setError(error);
    } finally {
      loading = false;
    }
  }

  async function handleBuildCourse() {
    initialLoadingState.startLoading();
    initialLoadingState.setStep("Analyzing your course objective...");
    error = null;
    moduleVideos = [];
    selectedVideos = [];
    globalUsedVideoIds = new Set<string>(); // <-- Reset when building a new course

    try {
      // Get a fresh token
      const token = await ensureFreshToken();
      if (!token) return;
      
      console.log("Making API request with token length:", token.length);
      console.log("First 20 chars of token:", token.substring(0, 20));
      
      // Make sure the token is properly formatted
      if (!token.includes('.')) {
        console.error("Invalid token format - not a JWT");
        error = "Authentication error: Invalid token format";
        return;
      }
      
      // Check auth state directly
      console.log("Current auth user:", auth.currentUser ? `UID: ${auth.currentUser.uid}` : "Not signed in");
      
      // More thorough logging to debug authorization issues
      console.log("Making API request to /api/generate-course with token");
      console.log("Cookie state before request:", document.cookie.split(';').map(c => c.trim()).filter(c => c.startsWith('firebase-token=')).length > 0 ? "Token cookie exists" : "No token cookie found");
      console.log("Server auth data:", data?.serverAuth ? JSON.stringify(data.serverAuth) : "No server auth data");
      
      // Include server auth info to help debug
      const serverAuthuid = data?.serverAuth?.user?.uid as string | undefined;
      console.log("Server auth UID:", serverAuthuid || "None");
      
      // Re-set the cookie right before the fetch to ensure it's fresh
      document.cookie = `firebase-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      
      // Prepare headers with multiple sources of auth
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Firebase-Token": token
      };
      
      // Try adding server auth as a backup
      if (serverAuthuid) {
        headers["X-Server-Auth-UID"] = serverAuthuid;
      }
      
      // Debug check to verify server connection and CORS setup
      console.log("Checking API endpoint connection...");
      try {
        const headersCheckResponse = await fetch("/api/generate-course", { 
          method: "HEAD",
          credentials: 'include',
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
            "X-Firebase-Token": token || "",
            ...headers
          }
        });
        console.log("API connection check:", headersCheckResponse.status, headersCheckResponse.statusText);
        console.log("API headers:", Object.fromEntries([...headersCheckResponse.headers.entries()]));
        // The 405 error is expected if we haven't implemented HEAD yet, so we catch and handle it
      } catch (headersError) {
        console.log("API connection check failed (this is usually fine):", 
          headersError instanceof Error ? headersError.message : "Unknown error");
      }
      
      // Make the actual API request
      console.log("Making actual API request...");
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          courseInput: courseObjective,
          // Include auth info in the request body as well
          serverAuthInfo: data?.serverAuth ? {
            uid: data.serverAuth.user?.uid as string | undefined,
            isAuthenticated: data.serverAuth.isAuthenticated as boolean
          } : null,
          // Include the token and user ID directly in the request body
          token: token,
          userId: auth.currentUser?.uid
        }),
        credentials: 'include', // Important: include cookies with the request
        mode: 'same-origin', // Ensure the request goes to same origin
      });
      
      console.log("API response status:", response.status);
      console.log("API response headers:", Object.fromEntries([...response.headers.entries()]));
      
      const responseData = await response.json();
      console.log("Course structure:", responseData);

      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to generate course");
      }

      courseStructure = responseData.courseStructure;
      if (courseStructure) {
        // Initialize arrays with the correct length
        moduleVideos = new Array(courseStructure.OG_Module_Title.length).fill(
          [],
        );
        selectedVideos = new Array(courseStructure.OG_Module_Title.length).fill(
          null,
        );

        initialLoadingState.setTotalModules(
          courseStructure.OG_Module_Title.length,
        );
        initialLoadingState.setStep("Course structure generated successfully!");
        initialLoadingState.setProgress(20); // Initial course structure generation is exactly 20%

        // Fetch videos for all modules
        if (courseStructure) {
          // Initialize visitedModules array
          visitedModules = new Array(courseStructure.OG_Module_Title.length).fill(false);
          visitedModules[0] = true; // Mark first module as visited since it's active by default
          visitedModules = [...visitedModules]; // Trigger reactivity
          console.log("Initial visitedModules:", visitedModules);
          
          for (let i = 0; i < courseStructure.OG_Module_Title.length; i++) {
            await fetchVideosForModule(
              courseStructure.OG_Module_YouTube_Search_Prompt[i],
              i,
            );
          }
        }
      } else {
        throw new Error("Invalid course structure received");
      }
    } catch (err: any) {
      console.error("Error building course:", err);
      error = err.message;
      courseStructure = null;
      initialLoadingState.setError(error);
      initialLoadingState.stopLoading();
    }
  }

  // Function to ensure the URL contains the objective parameter
  function ensureObjectiveInUrl() {
    if (browser && window.history && courseObjective) {
      const url = new URL(window.location.href);
      // Only add if not already there or if it's different
      if (url.searchParams.get('objective') !== encodeURIComponent(courseObjective)) {
        url.searchParams.set('objective', courseObjective);
        window.history.replaceState({}, '', url.toString());
        console.log("Updated URL with course objective");
      }
    }
  }

  // Function to check conditions and start the tour
  function tryStartCreateCourseTour() {
      // Ensure we are in browser, tour should start, modules are loaded, and we have a completion key
      if (browser && shouldStartTourOnLoad && createCourseTourCompletedKey) {
          console.log('[Create Course Page] Conditions met, starting tour...');
          
          // Check if tour is already active (safety check)
          if (get(tourStore).isTourActive) {
             console.log('[Create Course Page] Tour is already active, not restarting.');
             shouldStartTourOnLoad = false; // Prevent trying again
             return; 
          }

          // Determine which steps to use based on screen width (using md breakpoint: 768px)
          const isMobile = window.innerWidth < 768;
          const stepsToUse = isMobile ? createCourseTourStepsMobile : createCourseTourSteps;
          console.log(`[Create Course Page] Using ${isMobile ? 'mobile' : 'desktop'} tour steps.`);
          
          // Add a small delay to ensure elements are definitely ready
          setTimeout(() => {
              tourStore.startTour(stepsToUse, 'create-course');
              // Mark this tour as completed in localStorage when it finishes
              // Use a temporary subscription that unsubscribes itself
              let unsub: (() => void) | null = null;
              unsub = tourStore.subscribe(state => {
                  // Check if the tour became inactive
                  if (!state.isTourActive) { 
                      console.log('[Create Course Page] Tour finished or cancelled, marking as completed.');
                      if (unsub) unsub(); // Unsubscribe after marking
                  }
              });
          }, 500);
          shouldStartTourOnLoad = false; // Prevent restarting if function is called again
      } else {
          // Log why it didn't start for debugging
          if (browser) { // Only log reasons in browser
            console.log('[Create Course Page] Conditions not met for starting tour.', { shouldStartTourOnLoad, keyExists: !!createCourseTourCompletedKey });
          }
      }
  }

  // --- Handle Add Custom Video button click during tour ---
  function handleAddCustomVideoClick() {
    // Always show the modal when the button is clicked
    showCustomUrlInput = true;
  }

  // --- Handle Modal Close ---
  function handleModalClose() {
    showCustomUrlInput = false;
    const isMobileStep = $tourStore.isTourActive && $tourStore.steps[$tourStore.currentStepIndex]?.id.endsWith('-mobile');
    const finalStepId = isMobileStep ? 'cc-create-complete-mobile' : 'cc-create-complete';
    console.log(`[Create Course Page] handleModalClose called. Attempting to go to ${finalStepId}.`);
    tourStore.goToStepById(finalStepId); // Go to the final step (mobile or desktop) after modal closes
  }

  // Helper to check if it's the last module index
  function isLastModule(index: number): boolean {
      return courseStructure ? index === courseStructure.OG_Module_Title.length - 1 : false;
  }

  // Reactive statement to advance tour when a video is selected for the current module
  $: if (browser && $tourStore.isTourActive && ($tourStore.steps[$tourStore.currentStepIndex]?.id === 'cc-video-grid-interactive' || $tourStore.steps[$tourStore.currentStepIndex]?.id === 'cc-video-grid-interactive-mobile')) {
     // Check if a video has been selected (is not null) for the *current* module
     if (moduleVideos[currentModuleIndex] && selectedVideos[currentModuleIndex] !== null) {
        const isMobileStep = $tourStore.steps[$tourStore.currentStepIndex]?.id === 'cc-video-grid-interactive-mobile';
        const nextModuleStepId = isMobileStep ? 'cc-select-next-module-interactive-mobile' : 'cc-select-next-module-interactive';
        const addCustomVideoStepId = isMobileStep ? 'cc-add-custom-video-mobile' : 'cc-add-custom-video';

        console.log(`[Tour] Video selected for module ${currentModuleIndex}.`);
        if (isLastModule(currentModuleIndex)) {
            // If it was the last module, jump directly to Add Custom Video step
            console.log(`[Tour] isLastModule(${currentModuleIndex}) returned true. Attempting to go to ${addCustomVideoStepId}.`);
            tourStore.goToStepById(addCustomVideoStepId);
        } else {
            // Not the last module, go to the 'next module' prompt
             console.log(`[Tour] Moving to ${nextModuleStepId}.`);
            tourStore.goToStepById(nextModuleStepId);
        }
     }
     // Dependency tracking for reactivity
     selectedVideos, currentModuleIndex, courseStructure, moduleVideos;
  }

  // Reactive statement to advance tour when the module index changes *away* from the currently shown module
  let previousModuleIndexForTour = currentModuleIndex;
  $: if (browser && $tourStore.isTourActive && ($tourStore.steps[$tourStore.currentStepIndex]?.id === 'cc-select-next-module-interactive' || $tourStore.steps[$tourStore.currentStepIndex]?.id === 'cc-select-next-module-interactive-mobile')) {
    if (currentModuleIndex !== previousModuleIndexForTour) {
       const isMobileStep = $tourStore.steps[$tourStore.currentStepIndex]?.id === 'cc-select-next-module-interactive-mobile';
       const videoGridStepId = isMobileStep ? 'cc-video-grid-interactive-mobile' : 'cc-video-grid-interactive';
       console.log(`[Tour] Module index changed to ${currentModuleIndex}, moving back to ${videoGridStepId}.`);
       tourStore.goToStepById(videoGridStepId);
       previousModuleIndexForTour = currentModuleIndex; // Update tracker
    }
    // Dependency tracking
    currentModuleIndex;
  }

  // Helper function to get tour key for localStorage
  function getTourKey(tourId: string): string | null {
      let currentUserId: string | null = null;
      currentUserId = $user?.uid ?? null; // Directly use $user
      return currentUserId ? `tour-completed-${tourId}-${currentUserId}` : null;
  }

  onMount(() => {
    let cleanupFunctions: (() => void)[] = [];

    const initPageData = async () => {
      const urlObjective = $page.url.searchParams.get("objective");
      let courseLoaded = false;
      
      // --- Check if user has existing courses FIRST ---
      let userHasCourses = false;
      if ($user) {
        try {
          const courses = await getUserCourses($user.uid);
          userHasCourses = courses.length > 0;
        } catch (err) {
          console.error("Error checking user course count:", err);
          // Decide how to handle error - maybe assume user has courses to be safe?
          // For now, let's assume they don't have courses if check fails.
          userHasCourses = false; 
        }
      }
      // --- End course count check ---

      // Now proceed with loading/building the current course objective
      
      // First try to load from localStorage to have data ready
      courseLoaded = loadStateFromStorage();
      console.log("Initial state loaded from storage:", courseLoaded);
      
      if (urlObjective) {
        // If we have a URL objective, use it (this takes precedence)
        courseObjective = decodeURIComponent(urlObjective);
        
        // Update the URL to preserve the objective parameter
        ensureObjectiveInUrl();
        
        // If we already have a course structure but the objective has changed,
        // we should restart the course generation
        if (courseStructure && courseObjective !== localStorage.getItem('youversity_course_objective')) {
          console.log('Objective changed, rebuilding course');
          // Start loading state for course generation
          initialLoadingState.startLoading();
          initialLoadingState.setStep("Analyzing your course objective...");
          await handleBuildCourse();
        } else if (!courseStructure || moduleVideos.length === 0) {
          // No valid state, build the course
          console.log('No valid course structure found, building new course');
          initialLoadingState.startLoading();
          initialLoadingState.setStep("Analyzing your course objective...");
          await handleBuildCourse();
        } else {
          console.log('Using existing course structure with URL objective');
          // Update objective in localStorage
          localStorage.setItem('youversity_course_objective', courseObjective);
          
          // Update the loading state to show we're using saved data
          initialLoadingState.setTotalModules(courseStructure.OG_Module_Title.length);
          initialLoadingState.setStep("Course structure restored from previous session");
          initialLoadingState.setProgress(100);
          allModulesLoaded = checkAllModulesLoaded();
        }
      } else if (courseLoaded && courseObjective) {
        console.log("Restored course from localStorage:", courseObjective);
        
        // Update URL with the saved objective to preserve state on refresh
        ensureObjectiveInUrl();
        
        // If we have a course structure already, update the loading state
        if (courseStructure && moduleVideos.length > 0) {
          initialLoadingState.setTotalModules(courseStructure.OG_Module_Title.length);
          initialLoadingState.setStep("Course structure restored from previous session");
          initialLoadingState.setProgress(100);
          allModulesLoaded = checkAllModulesLoaded();
        } else {
          // No course structure yet, redirect to home to get objective
          goto("/");
          return; // Exit early if redirecting
        }
      } else {
        // No stored course, redirect to home
        goto("/");
        return; // Exit early if redirecting
      }

      // --- Check if tour should *potentially* start --- 
      if (browser && !userHasCourses) { // Only consider starting if user has NO courses
          const startFlag = localStorage.getItem('startCreateCourseTour');
          // We still need createCourseTourCompletedKey for the tryStart function
          createCourseTourCompletedKey = $user ? `tour-completed-create-course-${$user.uid}` : null;

          if (startFlag === 'true') {
              // Check completion flag *before* setting shouldStartTourOnLoad
              if (!tourStore.hasCompletedTour('create-course')) {
                 shouldStartTourOnLoad = true;
                 console.log('[Create Course Page] Tour start flag detected and tour not completed, preparing to start.');
              } else {
                 console.log('[Create Course Page] Tour start flag detected, but tour already completed.');
              }
              localStorage.removeItem('startCreateCourseTour'); // Consume the flag
          } else {
              shouldStartTourOnLoad = false;
          }
      } else {
          shouldStartTourOnLoad = false; // Don't start if user has courses or not in browser
      }
      // ---------------------------------------------

      // --- Attempt to start tour AFTER initial load/build --- 
      // This will be called again by the reactive statement if allModulesLoaded becomes true later
      console.log('[Create Course Page] Initial attempt to start tour after initPageData.');
      // Add a small delay before trying to start the tour
      setTimeout(tryStartCreateCourseTour, 200); // 200ms delay
      // ------------------------------------------------------
    };
    
    initPageData();
    
    // Set up event listener to clear state when navigating away
    if (browser) {
      const handleBeforeUnload = () => {
        // Save state for page reloads
        saveStateToStorage();
        console.log("Saved state during beforeunload");
      };
      
      // Add listeners
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        initialLoadingState.stopLoading();
        console.log('[+page] Running onMount cleanup');
        cleanupFunctions.forEach(cleanup => cleanup());
      };
    }
  });

  // Update check when allModulesLoaded changes state reactively
  $: if (browser && allModulesLoaded) { // Added browser check
      console.log(`[Create Course Page] allModulesLoaded changed to: ${allModulesLoaded}, attempting tour start.`);
      tryStartCreateCourseTour();
  }

  // Handle SvelteKit navigation events with afterNavigate
  afterNavigate(({ from, to }) => {
    if (browser) {
      console.log(`Navigation from ${from?.url.pathname || 'initial'} to ${to?.url.pathname || 'unknown'}`);
      
      // If we're coming from create-course (prevent clearing during initial load)
      if (from && from.url.pathname.startsWith('/create-course')) {
        // Check if we're navigating away from create-course
        if (to && to.url.pathname && !to.url.pathname.startsWith('/create-course')) {
          console.log('Navigating away from create-course, clearing state');
          clearStoredState();
        }
      }
    }
  });
</script>

<div
  class="min-h-screen bg-light-background-secondary md:bg-light-background-secondary"
>
  <div class="md:hidden flex flex-col min-h-screen">
    <!-- Top Navigation Bar Space -->
    <div class=" w-full"></div>
    
    <!-- Fixed Header Section for Mobile -->
    <div
      class="md:hidden sticky  top-[70px] z-40 bg-light-bg-secondary dark:bg-dark-bg-secondary shadow-sm -mx-6"
    >
      <div class="pt-4 pb-2 ">
        <div class="px-6">
          <CourseGenerationHeader />
        </div>

        {#if courseStructure}
          <div class="px-6">
            <h1 class="text-h2-mobile-bold mt-4 mb-2 text-Black dark:text-White">
              {courseStructure.OG_Course_Title}
            </h1>
            <p
              class="text-semi-body mb-4 opacity-80 text-light-text-secondary dark:text-dark-text-secondary"
            >
              {courseStructure.OG_Course_Objective}
            </p>
          </div>

          <!-- Module Navigation -->
          <div
            data-tour="module-navigation-mobile"
            class="flex gap-2 overflow-x-auto whitespace-nowrap pl-4 pb-2 scrollbar-hide"
          >
            {#each courseStructure.OG_Module_Title as moduleTitle, index}
              {@const isActive = currentModuleIndex === index}
              <button
                class="px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 
                {isActive
                  ? 'text-body-semibold bg-Green dark:bg-Green2 text-white'
                  : 'text-body bg-Black/5 dark:bg-White/10 text-Green dark:text-Green2 hover:bg-gray-200'}"
                on:click={() => selectModule(index)}
              >
                Module {index + 1}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Mobile Scrollable Content -->
    <div class="md:hidden flex-1 mb-[-100px]">
      {#if courseStructure}
        <div class="space-y-6 pt-6">
          <!-- Module Content -->
          <div class="rounded-xl mb-32">
            <div class="flex items-center gap-4 lg:gap-8 lg:justify-between mb-6">
              <div class="flex items-center justify-center gap-2 lg:gap-4">
                <h2
                  class="text-body-semibold lg:text-h4-medium text-Black dark:text-White"
                >
                  Module {currentModuleIndex + 1}: {courseStructure
                    .OG_Module_Title[currentModuleIndex]}
                </h2>
                <button
                  class="text-[#42C1C8] hover:text-[#2A4D61] rounded-full transition-colors duration-200 {moduleRegenerating[currentModuleIndex] ? 'cursor-not-allowed opacity-50' : ''}"
                  on:click={() => handleRegenerateModuleVideos(currentModuleIndex)}
                  disabled={moduleRegenerating[currentModuleIndex]}
                >
                  {#if moduleRegenerating[currentModuleIndex]}
                    <img src="/images/loading-spin.gif" alt="Loading" class="w-5 h-5" />
                  {:else}
                    <svg
                      class="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M15.1667 1L15.7646 2.11777C16.1689 2.87346 16.371 3.25131 16.2374 3.41313C16.1037 3.57495 15.6635 3.44426 14.7831 3.18288C13.9029 2.92155 12.9684 2.78095 12 2.78095C6.75329 2.78095 2.5 6.90846 2.5 12C2.5 13.6791 2.96262 15.2535 3.77093 16.6095M8.83333 23L8.23536 21.8822C7.83108 21.1265 7.62894 20.7486 7.7626 20.5868C7.89627 20.425 8.33649 20.5557 9.21689 20.8171C10.0971 21.0784 11.0316 21.219 12 21.219C17.2467 21.219 21.5 17.0915 21.5 12C21.5 10.3208 21.0374 8.74647 20.2291 7.39047"
                      />
                    </svg>
                  {/if}
                </button>
              </div>
              <button
                data-tour="add-custom-video-button-mobile"
                class="text-nowrap bg-brand-red hover:bg-ButtonHover text-mini-body lg:text-semi-body text-white px-2 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                on:click={handleAddCustomVideoClick}
              >
                Add Custom Video
                <Plus class="w-4 h-4 lg:w-6 lg:h-6" />
              </button>
            </div>

            {#if showCustomUrlInput}
              <div class="mb-6">
                <YoutubeUrlInput
                  moduleIndex={currentModuleIndex}
                  onVideoAdd={handleCustomVideoAdd}
                  moduleTitle={courseStructure?.OG_Module_Title[
                    currentModuleIndex
                  ] || ""}
                  onClose={handleModalClose}
                />
              </div>
            {/if}

            <ModuleVideoGrid
              {courseStructure}
              bind:moduleVideos
              bind:selectedVideos
              {currentModuleIndex}
              {error}
            />
          </div>
        </div>
      {/if}
    </div>

    <!-- Mobile Generate Course Button -->
    <div class="fixed md:hidden bottom-[5.5rem] z-50">
      {#if !allModulesAreVisited}
        <button
          data-tour="select-next-module-button-mobile"
          class="px-4 py-3 rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 gap-2 {!allModulesLoaded ? 'bg-white cursor-not-allowed text-Grey' : 'dark:bg-brand-turquoise bg-brand-navy text-white'}"
          on:click={() => selectModule(nextUnvisitedModuleIndex)}
          disabled={!allModulesLoaded || nextUnvisitedModuleIndex === -1}
        >
          <div class="flex items-center gap-2">
            <span class="text-mini-body">Select Module {nextUnvisitedModuleIndex !== -1 ? nextUnvisitedModuleIndex + 1 : ''} video</span>
            <svg class="{!allModulesLoaded ? 'text-Grey' : 'text-white'}" width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="Component 7">
              <path id="Vector" d="M20.5 12H4.50002" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path id="Vector_2" d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              </svg>
              
          </div>
        </button>
      {:else if allModulesLoaded}
        <button
          data-tour="create-complete-course-button-mobile"
          class="px-4 py-2 rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 gap-2 {!courseStructure?.OG_Module_Title.every(
            (_, index) => selectedVideos[index] !== undefined
          )
            ? 'bg-white cursor-not-allowed text-Grey'
            : 'bg-brand-red hover:bg-ButtonHover text-white'}"
          on:click={handleSaveCourse}
          disabled={!courseStructure?.OG_Module_Title.every(
            (_, index) => selectedVideos[index] !== undefined
          )}
        >
          <div class="flex items-center gap-2">
            <span class="text-mini-body">Complete Creating Course</span>
            <svg
              class="w-5 h-5 {!allModulesLoaded ? 'fill-Grey' : ''}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </div>
        </button>
      {/if}
    </div>
  </div>

  <!-- Desktop Layout -->
  <div class="hidden md:block container mx-auto">
    <CourseGenerationHeader />
    {#if courseStructure}
      <div class="flex flex-col gap-8">
        <!-- Course Title and Objective -->
        <div>
          <h1 class="text-h2-mobile lg:text-h2 text-Black dark:text-White mb-2">
            {courseStructure.OG_Course_Title}
          </h1>
          <p
            class="text-semi-body lg:text-body text-light-text-secondary dark:text-dark-text-secondary"
          >
            {courseStructure.OG_Course_Objective}
          </p>
        </div>

        <!-- Module Navigation with scroll buttons -->
        <div data-tour="module-navigation" class="relative flex items-center">
          <!-- Left scroll button -->
          <button 
            class="absolute left-0 z-10 p-1 bg-white dark:bg-dark-bg-primary rounded-full shadow-md text-Green dark:text-Green2 hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
            on:click={() => scrollModuleNav('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>
          
          <!-- Module navigation container -->
          <div 
            bind:this={moduleNavContainer}
            class="flex gap-2 overflow-x-auto scrollbar-hide mx-8 py-2 scroll-smooth"
          >
            {#each courseStructure.OG_Module_Title as title, index}
              {@const isActive = currentModuleIndex === index}
              {@const isNextUnvisited = !visitedModules[index] && index === nextUnvisitedModuleIndex}
              <button
                class="px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 flex-shrink-0
                {isActive
                  ? 'text-body-semibold bg-Green dark:bg-Green2 text-white'
                  : isNextUnvisited
                    ? 'text-body bg-Black/5 dark:bg-White/10 text-Green dark:text-Green2 hover:bg-gray-200 border-2 border-Green2 animate-pulse shadow-md'
                    : 'text-body bg-Black/5 dark:bg-White/10 text-Green dark:text-Green2 hover:bg-gray-200'}"
                on:click={() => selectModule(index)}
              >
                Module {index + 1}
              </button>
            {/each}
          </div>
          
          <!-- Right scroll button -->
          <button 
            class="absolute right-0 z-10 p-1 bg-white dark:bg-dark-bg-primary rounded-full shadow-md text-Green dark:text-Green2 hover:bg-gray-100 dark:hover:bg-dark-bg-secondary"
            on:click={() => scrollModuleNav('right')}
            aria-label="Scroll right"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>

        <!-- Current Module Content -->
        <div>
          <div class="flex items-center gap-8 lg:justify-between mb-6">
            <div class="flex items-center justify-center gap-2 lg:gap-4">
              <h2
                class="text-body-semibold lg:text-h4-medium text-Black dark:text-White"
              >
                Module {currentModuleIndex + 1}: {courseStructure
                  .OG_Module_Title[currentModuleIndex]}
              </h2>
              <button
                data-tour="regenerate-button"
                class="text-[#42C1C8] hover:text-[#2A4D61] rounded-full transition-colors duration-200 {moduleRegenerating[currentModuleIndex] ? 'cursor-not-allowed opacity-50' : ''}"
                on:click={() => handleRegenerateModuleVideos(currentModuleIndex)}
                disabled={moduleRegenerating[currentModuleIndex]}
              >
                {#if moduleRegenerating[currentModuleIndex]}
                  <img src="/images/loading-spin.gif" alt="Loading" class="w-5 h-5" />
                {:else}
                  <svg
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15.1667 1L15.7646 2.11777C16.1689 2.87346 16.371 3.25131 16.2374 3.41313C16.1037 3.57495 15.6635 3.44426 14.7831 3.18288C13.9029 2.92155 12.9684 2.78095 12 2.78095C6.75329 2.78095 2.5 6.90846 2.5 12C2.5 13.6791 2.96262 15.2535 3.77093 16.6095M8.83333 23L8.23536 21.8822C7.83108 21.1265 7.62894 20.7486 7.7626 20.5868C7.89627 20.425 8.33649 20.5557 9.21689 20.8171C10.0971 21.0784 11.0316 21.219 12 21.219C17.2467 21.219 21.5 17.0915 21.5 12C21.5 10.3208 21.0374 8.74647 20.2291 7.39047"
                    />
                  </svg>
                {/if}
              </button>
            </div>
            <button
              data-tour="add-custom-video-button"
              class="text-nowrap bg-brand-red hover:bg-ButtonHover text-mini-body lg:text-semi-body text-white px-2 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              on:click={handleAddCustomVideoClick}
            >
              Add Custom Video
              <Plus class="w-4 h-4 lg:w-6 lg:h-6" />
            </button>
          </div>

          {#if showCustomUrlInput}
            <div class="mb-6">
              <YoutubeUrlInput
                moduleIndex={currentModuleIndex}
                onVideoAdd={handleCustomVideoAdd}
                moduleTitle={courseStructure?.OG_Module_Title[
                  currentModuleIndex
                ] || ""}
                onClose={handleModalClose}
              />
            </div>
          {/if}

          <div data-tour="module-video-grid">
          <ModuleVideoGrid
            {courseStructure}
            bind:moduleVideos
            bind:selectedVideos
            {currentModuleIndex}
            {error}
          />
          </div>
        </div>
      </div>

      <!-- Generate Complete Course Button -->
      <!-- Desktop Generate Course Button -->
      <div
        class="hidden md:flex justify-left mt-4 mb-10 w-auto h-[54px]"
        in:fly={{ y: 20, duration: 500, delay: 200 }}
        out:fade
      >
        {#if !allModulesAreVisited}
          <button
            data-tour="select-next-module-button"
            on:click={() => selectModule(nextUnvisitedModuleIndex)}
            class="px-4 py-2 rounded-2xl text-base shadow-lg flex items-center justify-center transition-all duration-200 min-w-[250px] gap-2 {!allModulesLoaded ? 'bg-white cursor-not-allowed text-Grey' : 'dark:bg-brand-turquoise bg-brand-navy text-white'}"
            disabled={!allModulesLoaded || nextUnvisitedModuleIndex === -1}
          >
            <span class="text-body">Select Module {nextUnvisitedModuleIndex !== -1 ? nextUnvisitedModuleIndex + 1 : ''} video</span>
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g id="Component 7">
              <path id="Vector" d="M20.5 12H4.50002" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path id="Vector_2" d="M15.5 17C15.5 17 20.5 13.3176 20.5 12C20.5 10.6824 15.5 7 15.5 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              </svg> 
          </button>
        {:else}
          <button
            data-tour="create-complete-course-button"
            on:click={handleSaveCourse}
            class="px-4 py-2 rounded-2xl text-base shadow-lg flex items-center justify-center transition-all duration-200 min-w-[250px] gap-2 {!allModulesLoaded ||
            !courseStructure?.OG_Module_Title.every(
              (_, index) => selectedVideos[index] !== undefined
            )
              ? 'bg-white cursor-not-allowed text-Grey'
              : 'bg-brand-red hover:bg-ButtonHover text-white'}"
            disabled={!allModulesLoaded ||
              !courseStructure?.OG_Module_Title.every(
                (_, index) => selectedVideos[index] !== undefined
              )}
          >
            <span class="text-body">Create Complete Course</span>
            <svg
              class="w-5 h-5 {!allModulesLoaded ? 'fill-Grey' : ''}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        {/if}
      </div>
    {:else}
      <div class="max-w-2xl mx-auto text-center">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    {/if}
  </div>

</div>

<!-- Keep this for complete course generation -->
<CourseGenerationModal />

<!-- Add CustomTourGuide Component -->
<CustomTourGuide 
  currentModuleIndex={currentModuleIndex} 
  totalModules={courseStructure ? courseStructure.OG_Module_Title.length : 0} 
/>

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  /* Add dynamic header height class */
  .h-header {
    height: var(--header-height, 220px);
  }
  
  @keyframes text-only-animation {
    0%, 100% {
      color: #41C1CB;
      border-color: #41C1CB;
      text-shadow: 0 0 0 rgba(65, 193, 203, 0);
    }
    50% {
      color: #2A4D61;
      border-color: #2A4D61;
      text-shadow: 0 0 8px rgba(65, 193, 203, 0.5);
    }
  }
  
  .animate-text-only {
    animation: text-only-animation 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
