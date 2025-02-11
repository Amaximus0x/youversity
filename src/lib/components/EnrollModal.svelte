<script lang="ts">
  import { goto } from "$app/navigation";
  import { user } from "$lib/stores/auth";
  import type { FinalCourseStructure } from "$lib/types/course";
  import { enrollInCourse } from "$lib/firebase";

  export let show = false;
  export let courseDetails: FinalCourseStructure;
  export let onClose: () => void;

  let enrolling = false;

  async function handleEnroll() {
    if (!$user) {
      goto("/login");
      return;
    }

    try {
      enrolling = true;
      await enrollInCourse($user.uid, courseDetails.id);
      goto(`/course/${courseDetails.id}/learn`);
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      enrolling = false;
      onClose();
    }
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-Black/60 z-[56] flex items-center justify-center px-4"
    on:click|self={onClose}
  >
    <div
      class="bg-gradient-light dark:bg-gradient-dark rounded-[32px] p-4 max-w-md w-full"
    >
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-4">
          <!-- Logo -->
          <div class="flex justify-center">
            <img
              src="/youversity-logo-small.svg"
              alt="Youversity"
              class="h-12"
            />
          </div>

          <!-- Course Description -->
          <p class="text-center text-semi-body text-Black2">
            This course exceeded my expectations! The instructor explained
            motion principles in an engaging
          </p>
        </div>

        <!-- Enroll Button -->
        <button
          class="w-full px-4 py-3 flex items-center justify-center gap-2 bg-Green hover:bg-GreenHover text-white rounded-2xl transition-colors disabled:opacity-50"
          on:click={handleEnroll}
          disabled={enrolling}
        >
          <span class="text-semibody-medium">
            {enrolling ? "Enrolling..." : "Enroll"}
          </span>
          {#if !enrolling}
            <img src="/icons/arrow-right-white.svg" alt="" class="w-6 h-6" />
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
