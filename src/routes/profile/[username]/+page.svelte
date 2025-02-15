<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { getUserProfileByUsername, getUserProfile } from "$lib/services/profile";
  import { getPublicCoursesByCreator } from "$lib/firebase";
  import type { FinalCourseStructure } from "$lib/types/course";

  let loading = true;
  let error: string | null = null;
  let profile: any = null;
  let courses: FinalCourseStructure[] = [];

  onMount(async () => {
    try {
      const username = $page.params.username;
      
      // Try to get profile by username first
      profile = await getUserProfileByUsername(username);
      
      // If not found, try getting by uid
      if (!profile) {
        profile = await getUserProfile(username);
      }
      
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get creator's courses
      courses = await getPublicCoursesByCreator(profile.uid);
    } catch (err) {
      console.error("Error:", err);
      error = err instanceof Error ? err.message : "An error occurred";
    } finally {
      loading = false;
    }
  });
</script>

<div class="w-full min-h-screen bg-light-background-primary dark:bg-dark-background-primary">
  {#if loading}
    <div class="flex justify-center items-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise"></div>
    </div>
  {:else if error}
    <div class="text-brand-red text-center p-4">{error}</div>
  {:else}
    <div class="container mx-auto px-4 py-8">
      <!-- Profile Header -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-8">
        <div class="w-24 h-24 lg:w-32 lg:h-32">
          {#if profile.photoURL}
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              class="w-full h-full rounded-full object-cover"
            />
          {:else}
            <div class="w-full h-full rounded-full bg-Black/5 flex items-center justify-center">
              <span class="text-[#2A4D61] text-h2 font-medium">
                {(profile.username?.[0] || profile.displayName?.[0] || "U").toUpperCase()}
              </span>
            </div>
          {/if}
        </div>
        
        <div>
          <h1 class="text-h4-medium lg:text-h2 text-light-text-primary dark:text-dark-text-primary">
            {profile.displayName || profile.username}
          </h1>
          <p class="text-body text-light-text-secondary dark:text-dark-text-secondary mt-2">
            {profile.bio || "No bio available"}
          </p>
        </div>
      </div>

      <!-- Courses Section -->
      <div>
        <h2 class="text-h4-medium mb-6 text-light-text-primary dark:text-dark-text-primary">
          Courses Created
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#if courses.length === 0}
            <p class="text-body text-light-text-secondary dark:text-dark-text-secondary">
              No courses created yet
            </p>
          {:else}
            {#each courses as course}
              <a 
                href={`/course/${course.id}`}
                class="bg-white dark:bg-dark-background-secondary rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={course.Final_Course_Thumbnail || "/placeholder-course.jpg"}
                  alt={course.Final_Course_Title}
                  class="w-full h-48 object-cover"
                />
                <div class="p-4">
                  <h3 class="text-h4-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                    {course.Final_Course_Title}
                  </h3>
                  <p class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary line-clamp-2">
                    {course.Final_Course_Introduction}
                  </p>
                  <div class="flex items-center gap-4 mt-4">
                    <div class="flex items-center gap-2">
                      <img src="/icons/view.svg" alt="Views" class="w-5 h-5" />
                      <span class="text-mini-body text-light-text-secondary">
                        {course.views || 0} views
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <img src="/icons/upvote.svg" alt="Likes" class="w-5 h-5" />
                      <span class="text-mini-body text-light-text-secondary">
                        {course.likes || 0} likes
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div> 