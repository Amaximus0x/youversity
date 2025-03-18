<script lang="ts">
  import { onMount } from "svelte";
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
  import { goto } from "$app/navigation";
  import { Plus, ChevronLeft, ChevronRight } from "lucide-svelte";
  import { fade, fly } from "svelte/transition";
  import { getVideoTranscript } from "$lib/services/transcriptUtils";
  import { auth, setAuthTokenCookie, refreshToken } from "$lib/firebase";
  import { saveCourseToFirebase, enrollInCourse } from "$lib/firebase";
  import { user, isAuthenticated } from "$lib/stores/auth";
  // @ts-ignore - Svelte component import
  import CourseGenerationHeader from "$lib/components/CourseGenerationHeader.svelte";
  // @ts-ignore - Svelte component import
  import CourseGenerationModal from "$lib/components/CourseGenerationModal.svelte";
  import type { PageData } from './$types';

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

  // Reference to the module navigation container for scrolling
  let moduleNavContainer: HTMLElement;

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

  function selectModule(index: number) {
    currentModuleIndex = index;
    // Ensure the module is marked as visited
    visitedModules[index] = true;
    // Create a new array to trigger reactivity
    visitedModules = [...visitedModules];
    console.log("Visited modules:", visitedModules);
    console.log("All modules visited:", allModulesAreVisited);
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
  ) {
    if (!courseStructure) return;

    const moduleTitle = courseStructure.OG_Module_Title[moduleIndex];
    initialLoadingState.setCurrentModule(moduleIndex + 1);
    initialLoadingState.setStep(
      `Searching videos for Module ${moduleIndex + 1}: ${moduleTitle}`,
    );
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
        moduleTitle: moduleTitle,
        moduleIndex: moduleIndex.toString(),
        retry: retryCount.toString()
      });
      
      // Prepare headers with multiple sources of auth
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Authorization": `Bearer ${token}`
      };
      
      // Add server auth as backup
      const serverAuthuid = data?.serverAuth?.user?.uid as string | undefined;
      console.log("Server auth UID:", serverAuthuid || "None");
      
      if (serverAuthuid) {
        headers["X-Server-Auth-UID"] = serverAuthuid;
      }
      
      // In development mode, also add a test user ID header
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log("Adding development mode test header");
        headers["X-Dev-Test-UID"] = auth.currentUser?.uid || "dev-test-user";
      }
      
      const response = await fetch(
        `/api/search-videos?${queryParams.toString()}`,
        {
          headers,
          credentials: 'include' // Include cookies with the request
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

      // Check if all modules are loaded after this update
      allModulesLoaded = checkAllModulesLoaded();

      // Calculate progress: 20% for structure + 80% for modules
      // Each module takes an equal share of the remaining 80%
      const moduleProgress =
        (moduleIndex + 1) / courseStructure.OG_Module_Title.length;
      const totalProgress = 20 + moduleProgress * 80;
      initialLoadingState.setProgress(totalProgress);
    } catch (err: any) {
      console.error(`Error in module ${moduleIndex + 1}:`, err);
      error = err.message;
      initialLoadingState.setError(error);
      initialLoadingState.stopLoading();
    }
  }

  async function handleRegenerateModuleVideos(moduleIndex: number) {
    try {
      error = null;
      const searchPrompt =
        courseStructure!.OG_Module_YouTube_Search_Prompt[moduleIndex];
      await fetchVideosForModule(searchPrompt, moduleIndex);
    } catch (err: any) {
      console.error(
        `Error regenerating videos for module ${moduleIndex + 1}:`,
        err,
      );
      error = `Failed to regenerate videos for module ${moduleIndex + 1}`;
    }
  }

  async function handleSaveCourse() {
    if (!$user) {
      error = "Please sign in to save the course";
      return;
    }

    if (!courseStructure) return;

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

      finalLoadingState.setStep("Enrolling you in the course...");
      finalLoadingState.setProgress(95);

      await enrollInCourse($user.uid, courseId);

      finalLoadingState.setStep("Course is ready!");
      finalLoadingState.setProgress(100);
      finalLoadingState.setCourseId(courseId);
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
          0,
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

  // Get the objective from URL parameters on mount
  onMount(() => {
    const initPageData = async () => {
      const urlObjective = $page.url.searchParams.get("objective");
      if (urlObjective) {
        courseObjective = decodeURIComponent(urlObjective);

        // Start loading state for course generation
        initialLoadingState.startLoading();
        initialLoadingState.setStep("Analyzing your course objective...");

        await handleBuildCourse();
        
        // The visitedModules array is already initialized in handleBuildCourse
      } else {
        goto("/");
      }
    };
    
    initPageData();
    
    // Cleanup function to clear loading state when component is destroyed
    return () => {
      initialLoadingState.stopLoading();
    };
  });
</script>

<div
  class="min-h-screen bg-light-background-secondary md:bg-light-background-secondary"
>
  <!-- Fixed Header Section for Mobile -->
  <div
    class="md:hidden fixed top-[70px] left-0 right-0 z-40 bg-light-bg-secondary dark:bg-dark-bg-secondary"
  >
    <div class=" pt-4 pb-4">
      <div class="px-4">
        <CourseGenerationHeader />
      </div>

      {#if courseStructure}
        <div class="px-4">
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
          class="flex gap-2 overflow-x-auto whitespace-nowrap pl-4 pb-2 scrollbar-hide"
        >
          {#each courseStructure.OG_Module_Title as moduleTitle, index}
            {@const isActive = currentModuleIndex === index}
            {@const isNextUnvisited = !visitedModules[index] && index === getNextUnvisitedModuleIndex()}
            <button
              class="px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 
              {isActive
                ? 'text-body-semibold bg-Green dark:bg-Green2 text-white'
                : isNextUnvisited
                  ? 'text-body bg-Black/5 dark:bg-White/10 hover:bg-gray-200 border-2 border-Green2 animate-text-only'
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
  <div class="md:hidden mt-[calc(140px+env(safe-area-inset-top)+294px)] pb-32">
    {#if courseStructure}
      <div class="space-y-6">
        <!-- Module Content -->
        <div class=" rounded-xl">
          <div class="flex items-center gap-8 lg:justify-between mb-6">
            <div class="flex items-center justify-center gap-2 lg:gap-4">
              <h2
                class="text-body-semibold lg:text-h4-medium text-Black dark:text-White"
              >
                Module {currentModuleIndex + 1}: {courseStructure
                  .OG_Module_Title[currentModuleIndex]}
              </h2>
              <button
                class=" text-[#42C1C8] hover:text-[#2A4D61] rounded-full transition-colors duration-200"
                on:click={() =>
                  handleRegenerateModuleVideos(currentModuleIndex)}
              >
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
              </button>
            </div>
            <button
              class="text-nowrap bg-brand-red hover:bg-ButtonHover text-mini-body lg:text-semi-body text-white px-2 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              on:click={() => (showCustomUrlInput = true)}
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
                onClose={() => (showCustomUrlInput = false)}
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

  <!-- Desktop Layout -->
  <div class="hidden md:block container mx-auto">
    <CourseGenerationHeader />
    {#if courseStructure}
      <div class="space-y-8">
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
        <div class="relative flex items-center">
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
              {@const isNextUnvisited = !visitedModules[index] && index === getNextUnvisitedModuleIndex()}
              <button
                class="px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 flex-shrink-0
                {isActive
                  ? 'text-body-semibold bg-Green dark:bg-Green2 text-white'
                  : isNextUnvisited
                    ? 'text-body bg-Black/5 dark:bg-White/10 hover:bg-gray-200 border-2 border-Green2 animate-text-only'
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
                class=" text-[#42C1C8] hover:text-[#2A4D61] rounded-full transition-colors duration-200"
                on:click={() =>
                  handleRegenerateModuleVideos(currentModuleIndex)}
              >
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
              </button>
            </div>
            <button
              class="text-nowrap bg-brand-red hover:bg-ButtonHover text-mini-body lg:text-semi-body text-white px-2 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              on:click={() => (showCustomUrlInput = true)}
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
                onClose={() => (showCustomUrlInput = false)}
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

      <!-- Generate Complete Course Button -->
      <!-- Desktop Generate Course Button -->
      <div
        class="hidden md:flex justify-left mt-4 mb-10 w-auto h-[54px]"
        in:fly={{ y: 20, duration: 500, delay: 200 }}
        out:fade
      >
        <button
          on:click={handleSaveCourse}
          class="px-4 py-2 rounded-2xl text-base shadow-lg flex items-center justify-center transition-all duration-200 min-w-[250px] gap-2 {!allModulesLoaded ||
          !courseStructure?.OG_Module_Title.every(
            (_, index) => selectedVideos[index] !== undefined,
          ) || !allModulesAreVisited
            ? 'bg-white cursor-not-allowed text-Grey'
            : 'bg-brand-red hover:bg-ButtonHover text-white'}"
          disabled={!allModulesLoaded ||
            !courseStructure?.OG_Module_Title.every(
              (_, index) => selectedVideos[index] !== undefined,
            ) || !allModulesAreVisited}
        >
          <span class="text-body">Create Complete Course</span>
          <svg
            class="w-5 h-5 {!allModulesLoaded || !allModulesAreVisited ? 'fill-Grey' : ''}"
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

  <!-- Mobile Generate Course Button -->
  <div class="fixed md:hidden bottom-[8.5rem] z-50">
    <button
      class="px-4 py-3 rounded-lg shadow-lg flex items-center justify-center transition-all duration-200 gap-2 {!allModulesLoaded ||
      !courseStructure?.OG_Module_Title.every(
        (_, index) => selectedVideos[index] !== undefined,
      ) || !allModulesAreVisited
        ? 'bg-white cursor-not-allowed text-Grey'
        : 'bg-brand-red hover:bg-ButtonHover text-white'}"
      on:click={handleSaveCourse}
      disabled={!allModulesLoaded ||
        !courseStructure?.OG_Module_Title.every(
          (_, index) => selectedVideos[index] !== undefined,
        ) || !allModulesAreVisited}
    >
      <div class="flex items-center gap-2">
        <span class="text-body">Complete Creating Course</span>
        <svg
          class="w-5 h-5 {!allModulesLoaded || !allModulesAreVisited ? 'fill-Grey' : ''}"
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
  </div>
</div>

<!-- Keep this for complete course generation -->
<CourseGenerationModal />

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
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
