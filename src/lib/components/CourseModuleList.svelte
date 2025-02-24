<script lang="ts">
    import { currentModuleStore, enrollmentProgressStore } from "$lib/stores/course";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import type { FinalCourseStructure } from "$lib/types/course";
    import EnrollModal from "./EnrollModal.svelte";

    export let courseDetails: FinalCourseStructure;
    export let isCreator: boolean = false;
    export let isEnrolled: boolean = false;
    export let showProgress: boolean = false;
    export let currentModule: number | undefined = undefined;

    let showEnrollModal = false;
    $: completedModules = $enrollmentProgressStore?.completedModules || [];

    // Helper function to check if a module is completed
    function isModuleCompleted(index: number): boolean {
        return completedModules.includes(index);
    }

    // Update the module card styling
    $: activeModuleClass = (index: number) =>
        $currentModuleStore === index ? "bg-[rgba(66,193,200,0.1)]" : "";

    // Function to handle module navigation
    function handleModuleClick(index: number) {
        if (!isEnrolled && !isCreator) {
            showEnrollModal = true;
            return;
        }
        currentModuleStore.set(index);
        goto(`/course/${$page.params.id}`);
    }

    $: progress = $enrollmentProgressStore?.moduleProgress || [];

  
</script>

<div class="flex flex-col gap-4">
    <!-- Progress Section for web-->
    {#if showProgress && (isCreator || isEnrolled)}
        <div
            class="hidden lg:block rounded-2xl border border-light-border dark:border-dark-border"
        >
            <h3
                class="text-body-semibold border-b border-light-border dark:border-dark-border p-2 text-light-text-primary dark:text-dark-text-primary mb-4"
            >
                Your Progress
            </h3>

            <div class="flex items-center gap-4 px-2 pb-2">
                <div
                    class="flex-1 h-3 bg-black/[0.05] rounded-[2000px] overflow-hidden"
                >
                    <div
                        class="h-full bg-brand-turquoise rounded-[200000px] transition-all duration-300"
                        style="width: {((completedModules.length ||
                                  0) /
                                  10) *
                              100}%"
                    />
                </div>
                <span
                    class="text-body text-light-text-primary dark:text-dark-text-primary"
                >
                    {Math.round(((completedModules.length || 0) / 10) * 100)}%
                </span>
            </div>
        </div>
    {/if}

    <div
        class="border border-light-border dark:border-dark-border rounded-3xl overflow-hidden"
    >
        <!-- Progress Section for mobile-->
        {#if showProgress && (isCreator || isEnrolled)}
            <div
                class="block lg:hidden p-2 border-b border-light-border dark:border-dark-border"
            >
                <div class="flex items-center gap-4 px-2 py-2">
                    <div
                        class="flex-1 h-3 bg-black/[0.05] rounded-[2000px] overflow-hidden"
                    >
                        <div
                            class="h-full bg-brand-turquoise rounded-[200000px] transition-all duration-300"
                            style="width: {((completedModules.length ||
                                      0) /
                                      10) *
                                  100}%"
                        />
                    </div>
                    <span
                        class="text-body text-light-text-primary dark:text-dark-text-primary"
                    >
                        {Math.round(((completedModules.length || 0) / 10) * 100)}%
                    </span>
                </div>
            </div>
        {/if}

        <div class="hidden lg:block">
            <h3
                class="text-body-semibold text-Black p-2 border-b border-light-border dark:border-dark-border bg-BackgroundRed"
            >
                Course Module
            </h3>
        </div>

        <div class="p-2">
            <!-- Course Modules List -->
            <div class="space-y-2.5">
                {#if courseDetails?.Final_Module_Title?.length > 0}
                    <!-- Course Introduction Card -->
                    <div
                        class="hidden lg:block p-2 rounded-2xl border border-light-border hover:bg-Black/5 dark:hover:bg-Black/5 transition-colors duration-200 {activeModuleClass(
                            -1,
                        )}"
                    >
                        <button
                            class="w-full flex items-center gap-4"
                            on:click={() => {
                                currentModuleStore.set(-1);
                                if (typeof currentModule !== "undefined") {
                                    currentModule = -1;
                                }
                            }}
                        >
                            <!-- Module Info -->
                            <div class="flex-1 min-w-0 text-center">
                                <p
                                    class="text-wrap text-body-semibold text-Black2 px-2 py-6 mb-2"
                                >
                                    Course Introduction and Objectives
                                </p>
                            </div>
                        </button>
                    </div>

                    <!-- Regular Module Cards -->
                    {#each courseDetails.Final_Module_Title as title, index (index)}
                        <div
                            class="p-2 rounded-2xl border border-light-border lg:hover:bg-Black/5 lg:dark:hover:bg-Black/5 transition-colors duration-200 {activeModuleClass(
                                index,
                            )}"
                        >
                            <button
                                class="w-full flex items-center  gap-4"
                                on:click={() => handleModuleClick(index)}
                            >
                                <!-- Module Info -->
                                <div class="flex-1 min-w-0 text-left">
                                    
                                        <p
                                            class="text-semibody-medium text-Black mb-2 inline-block"
                                        >
                                            <span
                                                class="text-semibody-medium text-Black2"
                                            >
                                                {(index + 1)
                                                    .toString()
                                                    .padStart(2, "0")}:
                                            </span>
                                            {title}
                                        </p>
                                        <div class="flex items-start justify-between gap-2"> 
                                    <p
                                        class="text-mini-body text-light-text-tertiary"
                                    >
                                        {courseDetails
                                            ?.Final_Module_Video_Duration?.[
                                            index
                                        ] || "0"} min
                                    </p>

                                    <!-- {#if getModuleStatus(index)} -->
                                    {#if isModuleCompleted(index)}
                                            <img 
                                                src="/images/checkmark-circle.svg" 
                                                alt="Completed" 
                                                class="w-3 h-3 flex-shrink-0"
                                            />
                                            {/if} 
                                    </div>
                                </div>

                                <!-- Thumbnail Container -->
                                <div
                                    class="relative w-[30%] max-w-[139px] aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-black/5"
                                >
                                    {#if courseDetails?.Final_Module_Thumbnails?.[index]}
                                        <img
                                            src={courseDetails
                                                .Final_Module_Thumbnails[index]}
                                            alt="Video Thumbnail"
                                            class="absolute inset-0 w-full h-full object-cover"
                                        />
                                    {:else}
                                        <div
                                            class="absolute inset-0 flex items-center justify-center bg-black/5"
                                        >
                                            <img
                                                src="/icons/youtube.svg"
                                                alt="Video"
                                                class="w-8 h-8"
                                            />
                                        </div>
                                    {/if}
                                    <!-- Play Button Overlay -->
                                    <div
                                        class="absolute inset-0 flex items-center justify-center bg-black/20"
                                    >
                                        <img
                                            src="/icons/youtube-icon.svg"
                                            alt="Play"
                                            class="w-4 h-4"
                                        />
                                    </div>
                                </div>
                            </button>
                        </div>
                    {/each}

                    <!-- Course Conclusion Card - Only show for enrolled users and creators -->
                    {#if (isEnrolled || isCreator) && courseDetails?.Final_Module_Title?.length >= 0}
                        <div
                            class="hidden lg:block p-2 rounded-2xl border border-light-border hover:bg-Black/5 dark:hover:bg-Black/5 transition-colors duration-200 {activeModuleClass(
                                courseDetails.Final_Module_Title.length
                            )}"
                        >
                            <button
                                class="w-full flex items-center gap-4"
                                on:click={() => {
                                    currentModuleStore.set(
                                        courseDetails.Final_Module_Title.length,
                                    );
                                    if (typeof currentModule !== "undefined") {
                                        currentModule =
                                            courseDetails.Final_Module_Title
                                                .length;
                                    }
                                }}
                            >
                                <!-- Module Info -->
                                <div class="flex-1 min-w-0 text-center">
                                    <p
                                        class="text-body-semibold text-Black2 px-2 py-6 mb-2"
                                    >
                                        Course Conclusion
                                    </p>
                                </div>
                            </button>
                        </div>
                    {/if}
                {:else}
                    <div class="p-4 text-center text-light-text-tertiary">
                        No modules available
                    </div>
                {/if}
            </div>

            <!-- YouTube Playlist Button -->
            {#if courseDetails?.YouTube_Playlist_URL}
                <div class="mt-2">
                    <a
                        href={courseDetails.YouTube_Playlist_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="w-full px-4 py-2 flex items-center justify-center gap-2 bg-brand-red hover:bg-ButtonHover text-white rounded-2xl transition-colors"
                    >
                        <span class="text-semibody"
                            >View Playlist on Youtube</span
                        >
                    </a>
                </div>
            {/if}
        </div>
    </div>

    <!-- Course Conclusion Button - Mobile Only -->
    {#if (isEnrolled || isCreator) && courseDetails?.Final_Module_Title?.length > 0}
    <div class="block lg:hidden mt-4">
        <button
            class="flex items-center text-brand-turquoise"
            on:click={() => {
                currentModuleStore.set(courseDetails.Final_Module_Title.length);
                if (typeof currentModule !== "undefined") {
                    currentModule = courseDetails.Final_Module_Title.length;
                }
                goto(`/course/${$page.params.id}`);
            }}
        >
            <span class="text-body">Course Conclusion</span>
            <img
                src="/icons/arrow-right.svg"
                alt="Conclusion"
                class="w-6 h-6"
            />
        </button>
    </div>
{/if}
</div>

<!-- Enroll Modal -->
<EnrollModal
    show={showEnrollModal}
    {courseDetails}
    onClose={() => {
        showEnrollModal = false;
    }}
/>
