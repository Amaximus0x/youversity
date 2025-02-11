<script lang="ts">
  import { onMount } from "svelte";
  import { user } from "$lib/stores/auth";
  import { getUserCourses } from "$lib/firebase";
  import CourseCard from "$lib/components/CourseCard.svelte";
  import type { FinalCourseStructure } from "$lib/types/course";

  let courses: (FinalCourseStructure & { id: string })[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    if ($user) {
      try {
        const userCourses = await getUserCourses($user.uid);
        // Remove any duplicate courses based on course ID
        courses = Array.from(new Map(userCourses.map(course => [course.id, course])).values());
      } catch (err) {
        console.error("Error fetching courses:", err);
        error = err instanceof Error ? err.message : "Failed to load courses";
      } finally {
        loading = false;
      }
    }
  });
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-h2-mobile lg:text-h2 text-Black dark:text-White mb-8">
    My Courses
  </h1>

  {#if loading}
    <div class="flex justify-center items-center min-h-[200px]">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise"></div>
    </div>
  {:else if error}
    <div class="text-brand-red text-center p-4">{error}</div>
  {:else if courses.length === 0}
    <div class="text-center p-4">
      <p class="text-body text-Black2 dark:text-White mb-4">You haven't created or enrolled in any courses yet.</p>
      <a
        href="/create"
        class="inline-block px-4 py-2 bg-brand-red hover:bg-ButtonHover text-white rounded-2xl transition-colors"
      >
        Create Your First Course
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each courses as course (course.id)}
        <CourseCard {course} />
      {/each}
    </div>
  {/if}
</div> 