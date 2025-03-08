<script lang="ts">
  import { user } from "$lib/stores/auth";
  import { signInWithGoogle } from "$lib/services/auth";
  import { page } from "$app/stores";
  import {
    getUserCourses,
    getPublicCourses,
    toggleCoursePrivacy,
    likeCourse,
    getEnrollmentProgress,
  } from "$lib/firebase";
  import type { FinalCourseStructure } from "$lib/types/course";
  import {
    ArrowRight,
    Share2,
    ThumbsUp,
    ThumbsDown,
    Eye,
    Play,
    Plus,
    ArrowUp,
  } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import CourseFilter from "$lib/components/CourseFilter.svelte";
  import { loadingState } from "$lib/stores/loadingState";
  import { onMount } from "svelte";
  import ShareModal from "$lib/components/ShareModal.svelte";
  import { Copy, X } from "lucide-svelte";
  import CourseList from "$lib/components/CourseList.svelte";
  import Skeleton from "$lib/components/Skeleton.svelte";
  import TrendingCourseList from "$lib/components/TrendingCourseList.svelte";
  import LoadingOverlay from "$lib/components/LoadingOverlay.svelte";
  import CourseCreationOverlay from "$lib/components/CourseCreationOverlay.svelte";
  import UserCourseList from "$lib/components/UserCourseList.svelte";
  import { notifications } from "$lib/stores/notificationStore";
  import { browser } from "$app/environment";
  import { isAuthenticated } from "$lib/stores/auth";
  import LandingHeader from "$lib/components/LandingHeader.svelte";

  let learningObjective = "";
  let userCourses: (FinalCourseStructure & { id: string })[] = [];
  let loading = false;
  let error: string | null = null;
  let filteredCourses: (FinalCourseStructure & { id: string })[] = [];
  let showShareModal = false;
  let selectedCourseId = "";
  let publicCourses: (FinalCourseStructure & { id: string })[] = [];
  let isInputFocused = false;
  let trendingCoursesLoading = true;
  let showLoadingOverlay = false;
  let showCreationOverlay = false;

  // Redirect authenticated users to dashboard
  onMount(() => {
    if ($isAuthenticated) {
      goto("/dashboard");
    }
  });

  function navigateToLogin() {
    goto("/login");
  }

  async function loadUserCourses() {
    try {
      loading = true;
      error = null;
      const courses = await getUserCourses($user!.uid);

      // Load progress for each course
      const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
          const enrollmentProgress = await getEnrollmentProgress(
            $user!.uid,
            course.id,
          );
          let progress;
          let isCompleted = false;

          if (enrollmentProgress?.completedModules) {
            progress = Math.round(
              (enrollmentProgress.completedModules.length /
                course.Final_Module_Title.length) *
                100,
            );
            // Check if the course is completed (final quiz passed)
            isCompleted =
              enrollmentProgress.quizResults?.finalQuiz?.completed &&
              enrollmentProgress.quizResults?.finalQuiz?.passed;
          }

          return {
            ...course,
            progress,
            isCompleted,
          };
        }),
      );

      userCourses = coursesWithProgress;
      filteredCourses = [...userCourses];
    } catch (err) {
      console.error("Error loading courses:", err);
      error = (err as Error).message;
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    try {
      console.log("Fetching trending courses...");
      // Get courses sorted by views/likes
      publicCourses = await getPublicCourses();
      // Sort by views and likes
      publicCourses.sort((a, b) => {
        const scoreA = (a.views || 0) + (a.likes || 0);
        const scoreB = (b.views || 0) + (b.likes || 0);
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error("Error loading trending courses:", error);
    } finally {
      trendingCoursesLoading = false;
    }
  });

  async function handleCreateCourse(e: Event) {
    e.preventDefault();

    if (!learningObjective.trim()) {
      return; // Don't proceed if learning objective is empty
    }

    try {
      if ($user) {
        // Show creation overlay first
        showCreationOverlay = true;

        // Wait for 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Navigate to create-course page
        await goto(
          `/create-course?objective=${encodeURIComponent(learningObjective)}`,
        );
      } else {
        // For unauthenticated users, redirect to login with return URL
        const returnUrl = `/create-course?objective=${encodeURIComponent(learningObjective)}`;
        await goto(`/login?redirectTo=${encodeURIComponent(returnUrl)}`);
      }
    } catch (error) {
      console.error("Navigation error:", error);
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
      case "name-asc":
        sortedCourses.sort((a, b) =>
          a.Final_Course_Title.localeCompare(b.Final_Course_Title),
        );
        break;
      case "name-desc":
        sortedCourses.sort((a, b) =>
          b.Final_Course_Title.localeCompare(a.Final_Course_Title),
        );
        break;
      case "date-new":
        sortedCourses.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "date-old":
        sortedCourses.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
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
      console.log("Updated course:", updatedCourse);

      // Update the course in userCourses
      userCourses = userCourses.map((course) =>
        course.id === courseId ? { ...course, ...updatedCourse } : course,
      );

      // Refresh public courses list
      const updatedPublicCourses = await getPublicCourses();
      publicCourses = updatedPublicCourses;

      // Update filtered courses
      filteredCourses = [...userCourses];
    } catch (error) {
      console.error("Error toggling course privacy:", error);
    }
  }
</script>

<LoadingOverlay show={showLoadingOverlay} />

<CourseCreationOverlay show={showCreationOverlay} />

<div class="min-h-screen flex flex-col bg-gradient-light dark:bg-gradient-dark">
  <!-- Landing Header -->
  <LandingHeader />

  <!-- Hero Section -->
  <section
    class="flex-1 flex flex-col items-center justify-center px-4 pt-8 md:py-24 "
  >
    <div class="max-w-5xl mx-auto text-center flex flex-col items-center justify-center gap-14">
      <div
        class="self-stretch inline-flex flex-col justify-start items-center gap-8"
      >
        <div class="self-stretch relative text-center justify-center">
          <span
            class="text-[#42c1c9] text-[40px] font-bold font-['Poppins'] leading-[48px]"
            >Transform
          </span><span
            class="text-white text-[40px] font-bold font-['Poppins'] leading-[48px]"
          >
          </span><span
            class="text-[#dddada] text-[40px] font-bold font-['Poppins'] leading-[48px]"
            >Your</span
          ><span
            class="text-white text-[40px] font-bold font-['Poppins'] leading-[48px]"
          >
            <br /></span
          ><span
            class="text-[#ee3d4e] text-[40px] font-bold font-['Poppins'] leading-[48px]"
            >YouTube
          </span><span
            class="text-white text-[40px] font-bold font-['Poppins'] leading-[48px]"
          >
          </span><span
            class="text-[#dddada] text-[40px] font-bold font-['Poppins'] leading-[48px]"
            >Time<br />Into Real
          </span><span
            class="text-white text-[40px] font-bold font-['Poppins'] leading-[48px]"
          >
          </span><span
            class="text-[#42c1c9] text-[40px] font-bold font-['Poppins'] leading-[48px]"
            >Learning</span
          >
        </div>

        <div
          class="self-stretch relative text-center justify-center text-[#797979] text-sm font-normal font-['Poppins'] leading-snug"
        >
          Turn those "just 5 more minutes" of YouTube into actual knowledge that
          matters. YouVersity transforms your watching habits into structured
          learning adventures.
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-6 md:gap-16 justify-center">
        <button
          on:click={navigateToLogin}
          class=" px-10 py-4 bg-brand-red text-white rounded-lg  transition-all text-body-semibold font-medium"
        >
        <div class="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 7L9.48415 8.39405C8.80774 10.222 8.46953 11.136 7.80278 11.8028C7.13603 12.4695 6.22204 12.8077 4.39405 13.4842L3 14L4.39405 14.5158C6.22204 15.1923 7.13603 15.5305 7.80278 16.1972C8.46953 16.864 8.80774 17.778 9.48415 19.6059L10 21L10.5158 19.6059C11.1923 17.778 11.5305 16.864 12.1972 16.1972C12.864 15.5305 13.778 15.1923 15.6059 14.5158L17 14L15.6059 13.4842C13.778 12.8077 12.864 12.4695 12.1972 11.8028C11.5305 11.136 11.1923 10.222 10.5158 8.39405L10 7Z" stroke="#ffff" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M18 3L17.7789 3.59745C17.489 4.38087 17.3441 4.77259 17.0583 5.05833C16.7726 5.34408 16.3809 5.48903 15.5975 5.77892L15 6L15.5975 6.22108C16.3809 6.51097 16.7726 6.65592 17.0583 6.94167C17.3441 7.22741 17.489 7.61913 17.7789 8.40255L18 9L18.2211 8.40255C18.511 7.61913 18.6559 7.22741 18.9417 6.94166C19.2274 6.65592 19.6191 6.51097 20.4025 6.22108L21 6L20.4025 5.77892C19.6191 5.48903 19.2274 5.34408 18.9417 5.05833C18.6559 4.77259 18.511 4.38087 18.2211 3.59745L18 3Z" stroke="#ffff" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          <span>Create Course</span>
          </div>
        </button>

        <button
          on:click={() => {}}
          class="px-10 py-4  text-brand-turquoise rounded-lg bg-brand-turquoise/10 transition-all text-body-semibold font-medium"
        >
        <div class="flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="play-circle-02">
            <path id="Vector" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#41C1CB" stroke-width="1.5"/>
            <path id="Vector_2" d="M9.5 11.1998V12.8002C9.5 14.3195 9.5 15.0791 9.95576 15.3862C10.4115 15.6932 11.0348 15.3535 12.2815 14.6741L13.7497 13.8738C15.2499 13.0562 16 12.6474 16 12C16 11.3526 15.2499 10.9438 13.7497 10.1262L12.2815 9.32594C11.0348 8.6465 10.4115 8.30678 9.95576 8.61382C9.5 8.92086 9.5 9.6805 9.5 11.1998Z" fill="#41C1CB"/>
            </g>
            </svg>            
           <span>Watch Demo</span>
        </div>
        </button>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="pt-16 px-4">
    <div class="max-w-6xl mx-auto">
      <h2
        class="text-h2 text-light-text-primary dark:text-dark-text-primary text-center mb-12"
      >
      How it Works
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div
          class="p-6 rounded-xl bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border"
        >
          <div
            class="w-12 h-12 bg-brand-red/10 rounded-full flex items-center justify-center mb-4"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.5 9.5L14.5 14.5M14.5 9.5L9.5 14.5M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="#EE434A"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3
            class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-2"
          >
            AI-Powered Learning
          </h3>
          <p
            class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary"
          >
            Our AI technology creates personalized learning experiences tailored
            to your interests and goals.
          </p>
        </div>

       

        
      </div>
    </div>
  </section>


  <section class="pt-16 px-4 ">
  <div class="w-[390px] inline-flex flex-col justify-start items-start gap-6">
    <div class="self-stretch relative justify-center text-[#ee3d4e] text-base font-semibold font-['Poppins'] leading-normal">CREATE YOUR COURSE</div>
    <div class="self-stretch flex flex-col justify-start items-start gap-4">
        <div class="self-stretch relative justify-center text-[#dddada] text-2xl font-bold font-['Poppins'] leading-loose">Start Learning Simply enter what you Want to Learn</div>
        <div class="self-stretch relative justify-center text-[#797979] text-sm font-normal font-['Poppins'] leading-snug">Learning something new is easier than ever. Just enter a topic, and we’ll provide personalized resources to guide you every step of the way.</div>
    </div>
    <div class="self-stretch flex flex-col justify-start items-end gap-4">
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-[13px] h-[9.50px] left-[5.50px] top-[5.50px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-0 h-px left-[12px] top-[2px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-px h-0 left-[21px] top-[12px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-px h-0 left-[2px] top-[12px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[0.71px] h-[0.71px] left-[18.36px] top-[4.93px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[0.71px] h-[0.71px] left-[4.93px] top-[4.93px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[8.06px] h-[5.38px] left-[7.98px] top-[16.62px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Identify What You Want to Learn:</span><span class="text-white text-xs font-normal font-['Poppins'] leading-tight"> </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">Decide on the skill, subject, or topic you want to explore. </span></div>
        </div>
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-5 h-[15px] left-[2px] top-[7px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-0.5 h-[5px] left-[12px] top-[2px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-px h-0 left-[7px] top-[12px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-px h-0 left-[11.50px] top-[12px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-px h-0 left-[16px] top-[12px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-2.5 h-0 left-[7px] top-[17px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Input Prompt:</span><span class="text-white text-xs font-normal font-['Poppins'] leading-tight"> </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">Enter a clear and specific prompt describing your learning objective.</span></div>
        </div>
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-2.5 h-4 left-[7px] top-[4px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Click on Create Course: </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">Select "Create Course" to instantly generate a structured course with lessons and resources.</span></div>
        </div>
    </div>
</div>
</section>

<section class="pt-16 px-4 ">
  <div class="w-[390px] inline-flex flex-col justify-start items-start gap-6">
    <div class="self-stretch relative justify-center text-[#ee3d4e] text-base font-semibold font-['Poppins'] leading-normal">WATCH IT TRANSFORM</div>
    <div class="self-stretch flex flex-col justify-start items-start gap-4">
        <div class="self-stretch relative justify-center text-[#dddada] text-2xl font-bold font-['Poppins'] leading-loose">AI-Powered Learning, Structured for You</div>
        <div class="self-stretch relative justify-center text-[#797979] text-sm font-normal font-['Poppins'] leading-snug">Our AI curates top YouTube content on your topic, structuring it into a step-by-step course for seamless learning.</div>
    </div>
    <div class="self-stretch flex flex-col justify-start items-end gap-4">
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-[18px] h-[19px] left-[2px] top-[2px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-2 h-2 left-[14px] top-[14px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-2 h-[9px] left-[7px] top-[7px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Curated Content: </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">AI selects high-quality videos tailored to your topic for the best learning experience.</span></div>
        </div>
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-[5px] h-[5px] left-[3px] top-[3px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[5px] h-[5px] left-[3px] top-[16px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[13.35px] h-[13px] left-[7.65px] top-[5.50px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[5px] h-[5px] left-[16px] top-[3px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[3px] h-[5px] left-[18px] top-[16px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Smart Organization: </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">Your course follows a logical sequence, guiding you from basics to advanced concepts.</span></div>
        </div>
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-[18px] h-[15px] left-[3px] top-[7px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-0 h-[13px] left-[12px] top-[9px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[7px] h-[3.50px] left-[8.50px] top-[2px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Instant Learning: </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">Get your structured course in seconds and start learning immediately.</span></div>
        </div>
    </div>
</div>
</section>

<section class="pt-16 px-4 ">
  <div class="w-[390px] inline-flex flex-col justify-start items-start gap-6">
    <div class="self-stretch relative justify-center text-[#ee3d4e] text-base font-semibold font-['Poppins'] leading-normal">LEARN YOUR WAY</div>
    <div class="self-stretch flex flex-col justify-start items-start gap-4">
        <div class="self-stretch relative justify-center text-[#dddada] text-2xl font-bold font-['Poppins'] leading-loose">Personalized Learning at Your Own Pace</div>
        <div class="self-stretch relative justify-center text-[#797979] text-sm font-normal font-['Poppins'] leading-snug">Take charge of your learning. Move at your pace, track progress, and reinforce knowledge with auto-generated quizzes.</div>
    </div>
    <div class="self-stretch flex flex-col justify-start items-end gap-4">
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-4 h-4 left-[5.50px] top-[2.50px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[0.01px] h-0 left-[17px] top-[7px] absolute ring-2 ring-[#41c1cb]"></div>
                <div class="w-[5px] h-[5px] left-[2.50px] top-[16.50px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-0.5 h-0.5 left-[8.50px] top-[19.50px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-0.5 h-0.5 left-[2.50px] top-[13.50px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Self-Paced Learning: </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">Move through lessons at a comfortable pace, allowing for a flexible and stress-free experience.</span></div>
        </div>
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-5 h-5 left-[2px] top-[2px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[15px] h-[15px] left-[4.50px] top-[4.50px] absolute bg-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Progress Tracking: </span><span class="text-white text-xs font-normal font-['Poppins'] leading-tight"> </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">Monitor your learning milestones and stay motivated with real-time progress updates.</span></div>
        </div>
        <div class="self-stretch p-4 bg-white/10 rounded-lg inline-flex justify-start items-start gap-2.5">
            <div class="w-6 h-6 relative">
                <div class="w-[7px] h-1.5 left-[3.50px] top-[4px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[1.50px] h-0 left-[2px] top-[6px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[1.50px] h-0 left-[20.50px] top-[6px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[7px] h-1.5 left-[13.50px] top-[4px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[3px] h-[1.50px] left-[10.50px] top-[4.50px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-[18px] h-1.5 left-[3px] top-[14px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
                <div class="w-0.5 h-1.5 left-[18px] top-[14px] absolute ring-[1.50px] ring-[#41c1cb]"></div>
            </div>
            <div class="flex-1 relative justify-center"><span class="text-white text-xs font-bold font-['Poppins'] leading-tight">Knowledge Reinforcement: </span><span class="text-[#dddada] text-xs font-normal font-['Poppins'] leading-tight">Test your knowledge with AI-generated quizzes for better retention and mastery.</span></div>
        </div>
    </div>
</div>
</section>

<section class="pt-16 px-4 ">
  <div class="flex flex-col items-center justify-center gap-6">
    <div class="self-stretch inline-flex flex-col justify-start items-start gap-4">
      <div class="self-stretch relative text-center justify-center text-[#dddada] text-[32px] font-bold font-['Poppins'] leading-10">Learning for Everyone, Anywhere</div>
      <div class="self-stretch relative text-center justify-center text-[#797979] text-sm font-normal font-['Poppins'] leading-snug">Knowledge should have no barriers. Our platform is designed to be accessible to anyone, anywhere—whether you're a student, professional, or lifelong learner. If you're eager to learn, we’re here for you.</div>
      <img src="/images/landing/learning.png" alt="Learning" class="w-[390px] h-[193px]">
    </div>
</section>

<section class="pt-16 px-4 ">
  <div class="w-[390px] inline-flex flex-col justify-start items-start gap-6">
    <div class="self-stretch flex flex-col justify-start items-start gap-4">
        <div class="self-stretch relative text-center justify-center text-[#dddada] text-[32px] font-bold font-['Poppins'] leading-10">What our Early users Say</div>
    </div>
    <div class="self-stretch flex flex-col justify-start items-start gap-6">
        <div class="self-stretch inline-flex justify-start items-start gap-4">
            <img class="w-11 h-11 relative rounded-full" src="https://placehold.co/44x44" />
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-4">
                <div class="flex flex-col justify-start items-start gap-2">
                    <div class="w-[143px] relative justify-center text-white text-base font-semibold font-['Poppins'] leading-normal">Chantal John</div>
                    <div class="self-stretch relative justify-center text-[#797979] text-sm font-medium font-['Poppins']">Kia Student</div>
                </div>
                <div class="self-stretch relative justify-center text-[#dddada] text-sm font-normal font-['Poppins'] leading-snug">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using</div>
            </div>
        </div>
        <div class="self-stretch inline-flex justify-start items-start gap-4">
            <img class="w-11 h-11 relative rounded-full" src="https://placehold.co/44x44" />
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-4">
                <div class="flex flex-col justify-start items-start gap-2">
                    <div class="w-[143px] relative justify-center text-white text-base font-semibold font-['Poppins'] leading-normal">Chantal John</div>
                    <div class="self-stretch relative justify-center text-[#797979] text-sm font-medium font-['Poppins']">Kia Student</div>
                </div>
                <div class="self-stretch relative justify-center text-[#dddada] text-sm font-normal font-['Poppins'] leading-snug">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using</div>
            </div>
        </div>
        <div class="self-stretch inline-flex justify-start items-start gap-4">
            <img class="w-11 h-11 relative rounded-full" src="https://placehold.co/44x44" />
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-4">
                <div class="flex flex-col justify-start items-start gap-2">
                    <div class="w-[143px] relative justify-center text-white text-base font-semibold font-['Poppins'] leading-normal">Chantal John</div>
                    <div class="self-stretch relative justify-center text-[#797979] text-sm font-medium font-['Poppins']">Kia Student</div>
                </div>
                <div class="self-stretch relative justify-center text-[#dddada] text-sm font-normal font-['Poppins'] leading-snug">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using</div>
            </div>
        </div>
    </div>
</div>
</section>


<section class="pt-16 px-4 ">
  <div class="w-[390px] px-4 py-8 bg-gradient-to-b from-[#fff2f3] to-cyan-50 rounded-[32px] inline-flex flex-col justify-start items-center gap-16">
    <div class="self-stretch flex flex-col justify-start items-center gap-8">
        <img class="w-[100.97px] h-[108.74px] relative" src="/YV.svg" />
        <div class="self-stretch relative text-center justify-center text-black text-[32px] font-bold font-['Poppins'] capitalize leading-10">You can Discover and explore variety of trending courses.</div>
    </div>
    <div class="w-[238px] px-8 pt-[15px] pb-4 bg-[#ee3d4e] rounded-lg shadow-[0px_4px_6px_-1px_rgba(99,55,174,0.25)] shadow-[0px_4px_6px_-1px_rgba(99,55,174,0.25)] shadow-[inset_0px_2px_4px_0px_rgba(99,55,174,0.25)] inline-flex justify-center items-center gap-4">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g id="arrow-up-right-03">
        <path id="Vector" d="M16.5 7.5L6 18" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
        <path id="Vector_2" d="M8 6.18791C8 6.18791 16.0479 5.50949 17.2692 6.73079C18.4906 7.95209 17.812 16 17.812 16" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        </svg>
        <div class="relative justify-center text-white text-base font-semibold font-['Poppins'] leading-normal">Get Started</div>
    </div>
</div>
</section>

  <!-- Footer -->
  <footer
    class="py-8 px-4 bg-light-bg-primary dark:bg-dark-bg-primary border-t border-light-border dark:border-dark-border"
  >
    <div
      class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center"
    >
      <div class="flex items-center mb-4 md:mb-0">
        <img src="/YV.svg" alt="Youversity Logo" class="w-8 h-8 mr-2" />
        <span
          class="text-light-text-primary dark:text-dark-text-primary font-medium"
          >Youversity</span
        >
      </div>

      <div
        class="text-light-text-tertiary dark:text-dark-text-tertiary text-mini-body"
      >
        © {new Date().getFullYear()} Youversity. All rights reserved.
      </div>
    </div>
  </footer>
</div>

{#if showShareModal}
  <ShareModal
    show={showShareModal}
    courseId={selectedCourseId}
    onClose={() => (showShareModal = false)}
  />
{/if}

<style>
  :global(body) {
    @apply antialiased;
  }

  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
</style>
