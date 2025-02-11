<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { user } from "$lib/stores/auth";
  import { goto } from "$app/navigation";
  import { currentModuleStore } from "$lib/stores/course";
  import type { FinalCourseStructure } from "$lib/types/course";
  import {
    getUserCourse,
    getEnrollmentProgress,
    updateModuleProgress,
    getSharedCourse,
  } from "$lib/firebase";
  import CourseModuleList from "$lib/components/CourseModuleList.svelte";

  let courseDetails: FinalCourseStructure | null = null;
  let loading = true;
  let error: string | null = null;
  let isCreator = false;
  let isEnrolled = false;
  let enrollmentProgress: any = null;
  let moduleProgress: { completed?: boolean }[] = [];
  let currentVideoUrl: string = "";

  // Function to get video URL based on current module
  function getCurrentVideoUrl() {
    if (!courseDetails) return "";
    
    // For introduction
    if ($currentModuleStore === -1) {
      return courseDetails.Final_Course_Intro_Video || "";
    }
    
    // For conclusion
    if ($currentModuleStore === courseDetails.Final_Module_Title?.length) {
      return courseDetails.Final_Course_Conclusion_Video || "";
    }
    
    // For regular modules
    return courseDetails.Final_Module_Video_URL?.[$currentModuleStore] || "";
  }

  // Function to mark module as completed
  async function markModuleCompleted() {
    if (!$user || !isEnrolled || $currentModuleStore === undefined) return;

    try {
      await updateModuleProgress($user.uid, $page.params.id, $currentModuleStore);
      
      // Update local progress
      if (enrollmentProgress?.completedModules) {
        if (!enrollmentProgress.completedModules.includes($currentModuleStore)) {
          enrollmentProgress.completedModules.push($currentModuleStore);
        }
      }
    } catch (error) {
      console.error("Error updating module progress:", error);
    }
  }

  onMount(async () => {
    try {
      let courseData;
      if ($user) {
        courseData = await getUserCourse($user.uid, $page.params.id);
        if (courseData) {
          isCreator = courseData.isCreator;
          isEnrolled = courseData.isEnrolled;
          courseDetails = courseData.courseData;

          // Get enrollment progress if user is enrolled
          if (isEnrolled) {
            enrollmentProgress = await getEnrollmentProgress($user.uid, $page.params.id);
          }
        }
      }

      // If not logged in or no course data yet, try getting shared course
      if (!courseDetails) {
        courseData = await getSharedCourse($page.params.id);
        if (!courseData) {
          error = "Course not found";
          return;
        }
        courseDetails = courseData;
      }

      // Set current video URL
      currentVideoUrl = getCurrentVideoUrl();

      // Initialize module progress array
      if (courseDetails?.Final_Module_Title) {
        moduleProgress = new Array(courseDetails.Final_Module_Title.length).fill({ completed: false });
      }

      // Redirect if not enrolled and not creator
      if (!isEnrolled && !isCreator) {
        goto(`/course/${$page.params.id}`);
      }
    } catch (err) {
      console.error("Error fetching course:", err);
      error = err instanceof Error ? err.message : "Failed to load course";
    } finally {
      loading = false;
    }
  });

  // Update video URL when current module changes
  $: {
    if (courseDetails) {
      currentVideoUrl = getCurrentVideoUrl();
    }
  }
</script>

<div class="min-h-screen">
  <div class="container mx-auto px-5 py-6">
    {#if loading}
      <div class="flex justify-center items-center min-h-[200px]">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise"></div>
      </div>
    {:else if error}
      <div class="text-brand-red text-center p-4">{error}</div>
    {:else if courseDetails}
      <div class="grid lg:grid-cols-12 gap-6">
        <!-- Left Column - Video Player -->
        <div class="lg:col-span-8">
          <!-- Video Container -->
          <div class="relative w-full rounded-2xl overflow-hidden bg-black aspect-video mb-6">
            {#if currentVideoUrl}
              <iframe
                title="Course Video"
                src={currentVideoUrl}
                class="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            {:else}
              <div class="absolute inset-0 flex items-center justify-center bg-black/5">
                <img src="/icons/youtube.svg" alt="Video" class="w-16 h-16" />
              </div>
            {/if}
          </div>

          <!-- Module Title -->
          <h1 class="text-h4-medium lg:text-h2 text-Black dark:text-White mb-4">
            {#if $currentModuleStore === -1}
              Course Introduction and Objectives
            {:else if $currentModuleStore === courseDetails.Final_Module_Title?.length}
              Course Conclusion
            {:else}
              {courseDetails.Final_Module_Title[$currentModuleStore]}
            {/if}
          </h1>

          <!-- Mark as Complete Button -->
          {#if isEnrolled && $currentModuleStore !== undefined}
            <button
              class="px-4 py-2 bg-Green hover:bg-GreenHover text-white rounded-2xl transition-colors"
              on:click={markModuleCompleted}
            >
              Mark as Complete
            </button>
          {/if}
        </div>

        <!-- Right Column - Module List -->
        <div class="lg:col-span-4">
          <CourseModuleList
            {courseDetails}
            {isCreator}
            {isEnrolled}
            showProgress={true}
            {moduleProgress}
            {enrollmentProgress}
            completedModules={isCreator
              ? moduleProgress.map((m, i) => m?.completed ? i : -1).filter(i => i !== -1)
              : enrollmentProgress?.completedModules || []}
          />
        </div>
      </div>
    {/if}
  </div>
</div> 