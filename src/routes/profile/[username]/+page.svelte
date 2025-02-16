<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import {
        getUserProfileByUsername,
        getUserProfile,
    } from "$lib/services/profile";
    import { getPublicCoursesByCreator } from "$lib/firebase";
    import type { FinalCourseStructure } from "$lib/types/course";
    import TrendingCard from "$lib/components/TrendingCard.svelte";
    import ShareModal from "$lib/components/ShareModal.svelte";

    let loading = true;
    let error: string | null = null;
    let profile: any = null;
    let courses: FinalCourseStructure[] = [];
    let showShareModal = false;
    let selectedCourseId = '';
    let shareType = 'profile';      
    // Share profile
    function handleProfileShare() {
        shareType = 'profile';
        showShareModal = true;
    }
    function handleCourseShare(courseId: string) {
        selectedCourseId = courseId;
        shareType = 'course';
        showShareModal = true;
        console.log("Share course:", courseId);
    }

   

    onMount(async () => {
        try {
            const username = $page.params.username;

            // Try to get profile by username first
            profile = await getUserProfileByUsername(username);
            console.log(profile);

            // If not found, try getting by uid
            if (!profile) {
                profile = await getUserProfile(username);
            }

            if (!profile) {
                throw new Error("Profile not found");
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

<div
    class="w-full min-h-screen bg-light-background-primary dark:bg-dark-background-primary"
>
    {#if loading}
        <div class="flex justify-center items-center min-h-screen">
            <div
                class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise"
            ></div>
        </div>
    {:else if error}
        <div class="text-brand-red text-center p-4">{error}</div>
    {:else}
        <div class="relative w-full h-full">
            <!-- Mobile-only controls -->
            <div
                class="flex justify-between items-center mb-2 mt-2.5 lg:hidden"
            >
                <button
                    class="text-light-text-primary dark:text-dark-text-primary"
                >
                    <img
                        src="/icons/arrow-left.svg"
                        alt="Back"
                        class="w-6 h-6"
                    />
                </button>
                <button
                    class="text-light-text-primary dark:text-dark-text-primary"
                    on:click={handleProfileShare}
                >
                    <svg
                        class="w-6 h-6 text-light-text-primary dark:text-dark-text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M21 6.5C21 8.15685 19.6569 9.5 18 9.5C16.3431 9.5 15 8.15685 15 6.5C15 4.84315 16.3431 3.5 18 3.5C19.6569 3.5 21 4.84315 21 6.5Z"
                            stroke="currentColor"
                            stroke-width="1.5"
                        />
                        <path
                            d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z"
                            stroke="currentColor"
                            stroke-width="1.5"
                        />
                        <path
                            d="M21 17.5C21 19.1569 19.6569 20.5 18 20.5C16.3431 20.5 15 19.1569 15 17.5C15 15.8431 16.3431 14.5 18 14.5C19.6569 14.5 21 15.8431 21 17.5Z"
                            stroke="currentColor"
                            stroke-width="1.5"
                        />
                        <path
                            d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495"
                            stroke="currentColor"
                            stroke-width="1.5"
                        />
                    </svg>
                </button>
            </div>

            <!-- Desktop Layout Container -->
            <div class="w-full h-full lg:flex lg:gap-8 lg:px-4 lg:py-4">
                <!-- Left Column - Fixed -->
                <div class="w-full lg:w-[30%] lg:max-w-[400px] lg:min-w-[320px] lg:fixed lg:left-[280px]">
                    <!-- Profile Card -->
                    <div
                        class="flex flex-col items-center p-4 gap-4 border border-light-border-primary dark:border-dark-border-primary rounded-[32px] overflow-hidden shadow-lg"
                    >
                        <!-- Profile Image -->
                        <div
                            class="w-[130px] h-[130px] lg:w-[247px] lg:h-[247px]"
                        >
                            {#if profile.photoURL}
                                <img
                                    src={profile.photoURL}
                                    alt={profile.displayName}
                                    class="w-full h-full rounded-full object-cover"
                                />
                            {:else}
                                <div
                                    class="w-full h-full rounded-full bg-Black/5 flex items-center justify-center"
                                >
                                    <span
                                        class="text-[#2A4D61] text-h2 font-medium"
                                    >
                                        {(
                                            profile.username?.[0] ||
                                            profile.displayName?.[0] ||
                                            "U"
                                        ).toUpperCase()}
                                    </span>
                                </div>
                            {/if}
                        </div>

                        <div class="flex flex-col items-center gap-2">
                            <h1
                                class="text-h4-medium text-[28px] lg:text-h2 lg:text-[32px] text-light-text-primary dark:text-dark-text-primary"
                            >
                                {profile.username}
                            </h1>
                            <span
                                class="flex gap-2 text-semi-body-medium text-light-text-primary dark:text-dark-text-primary"
                                >JOINED:
                                <p
                                    class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary"
                                >
                                    {new Date(
                                        profile.createdAt?.toDate?.() ||
                                            profile.createdAt ||
                                            Date.now(),
                                    ).toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </p>
                            </span>
                        </div>
                        <!-- ProfileShare Button -->
                        <button
                            class="hidden lg:flex absolute top-4 right-4 p-2 rounded-full justify-start items-center gap-2.5 hover:bg-black/10 z-10"
                            on:click={handleProfileShare}
                        >
                            <svg
                                class="w-6 h-6 text-light-text-primary dark:text-dark-text-primary"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M21 6.5C21 8.15685 19.6569 9.5 18 9.5C16.3431 9.5 15 8.15685 15 6.5C15 4.84315 16.3431 3.5 18 3.5C19.6569 3.5 21 4.84315 21 6.5Z"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M21 17.5C21 19.1569 19.6569 20.5 18 20.5C16.3431 20.5 15 19.1569 15 17.5C15 15.8431 16.3431 14.5 18 14.5C19.6569 14.5 21 15.8431 21 17.5Z"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                />
                            </svg>
                        </button>
                    </div>

                    <!-- About Card -->
                    <div
                        class="mt-4 flex flex-col items-start lg:p-4 gap-4 lg:border border-light-border-primary dark:border-dark-border-primary rounded-[32px]"
                    >
                        <h2
                            class="text-h4-medium text-light-text-primary dark:text-dark-text-primary"
                        >
                            About
                        </h2>
                        <p
                            class="text-body text-light-text-secondary dark:text-dark-text-secondary break-words"
                        >
                            <!-- {profile.bio || "No bio available"} -->
                            Lorem ipsum dolor sit amet consectetur adipisicing elit.
                            Quisquam, quos. Lorem ipsum dolor sit amet consectetur
                            adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit
                            amet consectetur adipisicing elit. Quisquam, quos. Lorem
                            ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
                            quos. Lorem ipsum dolor sit amet consectetur adipisicing
                            elit. Quisquam, quos.
                        </p>
                    </div>
                </div>

                <!-- Right Column - Scrollable -->
                <div class="w-full lg:w-[70%] lg:ml-[calc(30%+280px)] xl:ml-[calc(25%+280px)]">
                    <h2
                        class="text-h4-medium mb-4 text-light-text-primary dark:text-dark-text-primary"
                    >
                        Courses Created
                    </h2>
                    <div class="sm:grid grid-cols-1 md:grid-cols-2 gap-4">
                        {#if courses.length === 0}
                            <p
                                class="text-body text-light-text-secondary dark:text-dark-text-secondary"
                            >
                                No courses created yet
                            </p>
                        {:else}
                            {#each courses as course}
                                <TrendingCard 
                                    {course}
                                    onShare={handleCourseShare}
                                />
                            {/each}
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<ShareModal
    show={showShareModal}
    shareType={shareType}
    id={profile?.username || profile?.uid}
    courseId={selectedCourseId}
    onClose={() => (showShareModal = false)}
/>

<style>
    @media (min-width: 1024px) {
        :global(body) {
            overflow-y: auto;
        }

        /* Ensure the fixed column stays within viewport */
        .lg\:fixed {
            height: calc(100vh - 96px);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(66, 193, 200, 0.5) transparent;
        }

        /* Add responsive container width adjustments */
        @media (min-width: 1536px) {
            .lg\:w-[30%] {
                width: 25%;
            }
            .lg\:max-w-[400px] {
                max-width: 450px;
            }
        }

        /* Webkit scrollbar styling */
        .lg\:fixed::-webkit-scrollbar {
            width: 6px;
        }

        .lg\:fixed::-webkit-scrollbar-track {
            background: transparent;
        }

        .lg\:fixed::-webkit-scrollbar-thumb {
            background-color: rgba(66, 193, 200, 0.5);
            border-radius: 3px;
        }
    }
</style>
