<script lang="ts">
    import { goto } from "$app/navigation";
    import { user } from "$lib/stores/auth";
    import { currentModuleStore } from "$lib/stores/course";
    import type { FinalCourseStructure } from "$lib/types/course";
    import { page } from "$app/stores";

    export let courseDetails: FinalCourseStructure;
    export let creatorProfile: any;
    export let isCreator: boolean = false;
    export let isBookmarked: boolean = false;
    export let hasLiked: boolean = false;
    export let liking: boolean = false;
    export let showShareModal: boolean = false;

    // Check if we're on the module page
    $: isModulePage = $page.url.pathname.includes("/module");

    // Helper function to format numbers
    function formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    }

    // Event dispatchers for actions
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    function handleLike() {
        dispatch("like");
    }

    function handleBookmark() {
        dispatch("bookmark");
    }

    function handleShare() {
        dispatch("share");
    }
</script>

<!-- Stats Section -->
<div class="flex items-center justify-between gap-4 mt-4">
    <div class="flex items-center gap-4">
        <!-- Upvotes -->
        <button
            class="flex items-center gap-2 bg-Black/5 px-2 py-2 rounded-2xl hover:opacity-80 transition-opacity disabled:opacity-50"
            on:click={handleLike}
            disabled={liking}
        >
            <img
                src={hasLiked
                    ? "/icons/upvote-filled.svg"
                    : "/icons/upvote.svg"}
                alt="Upvotes"
                class="w-5 h-5"
            />
            <span
                class={hasLiked
                    ? "text-semibody-medium text-Black"
                    : "text-mini-body text-Black2 hover:text-Black"}
            >
                {formatNumber(courseDetails?.likes || 0)} Upvotes
            </span>
        </button>

        <!-- Views -->
        <div class="flex items-center gap-2">
            <img src="/icons/view.svg" alt="Views" class="w-5 h-5" />
            <span class="text-mini-body text-light-text-secondary">
                {formatNumber(courseDetails?.views || 0)} views
            </span>
        </div>
    </div>

    <!-- Module Button -->
    <div class="lg:hidden flex items-center">
        <button
            class="flex items-center"
            on:click={() => {
                if (isModulePage) {
                    goto(`/course/${courseDetails.id}`);
                } else {
                    goto(`/course/${courseDetails.id}/module?tab=modules`);
                }
            }}
        >
            {#if isModulePage}
                <img
                    src="/icons/arrow-right.svg"
                    alt="Modules"
                    class="w-6 h-6 rotate-180"
                />
                <span class="text-body text-brand-turquoise">
                    {isModulePage ? "Course Intro" : "Modules"}
                </span>
            {:else}
            <span class="text-body text-brand-turquoise">
                {isModulePage ? "Course Intro" : "Modules"}
            </span>
                <img src="/icons/arrow-right.svg" alt="Modules" class="w-6 h-6" />
            {/if}

        </button>
    </div>
</div>

<!-- Creator Info with Bookmark and Share Button -->
<div class="flex items-center justify-between mt-4">
    <!-- Creator Info -->
    <div class="flex items-center gap-3">
        <div>
            {#if creatorProfile?.photoURL}
                <img
                    src={creatorProfile.photoURL}
                    alt="Creator"
                    class="w-12 h-12 rounded-full object-cover"
                />
            {:else}
                <div
                    class="w-12 h-12 rounded-full bg-Black/5 flex items-center justify-center"
                >
                    <span class="text-[#2A4D61] font-medium">
                        {(
                            creatorProfile?.username?.[0] ||
                            creatorProfile?.displayName?.[0] ||
                            "U"
                        ).toUpperCase()}
                    </span>
                </div>
            {/if}
        </div>

        <div>
            <p
                class="text-semi-body text-light-text-tertiary dark:text-dark-text-tertiary"
            >
                <span
                    class="text-body-semibold text-light-text-primary dark:text-dark-text-primary"
                    >Creator:</span
                >
                {creatorProfile?.username ||
                    creatorProfile?.displayName ||
                    "Unknown Creator"}
            </p>
            <div class="self-stretch text-[#a2a2a2] text-mini-body">
                {new Date(
                    courseDetails.createdAt?.toDate?.() ||
                        courseDetails.createdAt ||
                        Date.now(),
                ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                })}
            </div>
        </div>
    </div>

    <div class="flex items-center gap-4">
        <!-- Bookmark Button -->
        {#if !isCreator}
                <button
                    class="w-full px-2 py-2 text-semibody-medium flex items-center justify-center gap-2 bg-Black/5 text-Green rounded-full hover:bg-Black/5 transition-colors"
                    on:click={handleBookmark}
                >
                    <img
                        src={isBookmarked
                            ? "/icons/bookmark-filled.svg"
                            : "/icons/bookmark.svg"}
                        alt="Bookmark"
                        class="w-6 h-6"
                    />
                </button>
        {/if}

        <!-- Share Button -->
        <button
            class="flex items-center gap-2 bg-Black/5 px-2 py-2 rounded-full hover:opacity-80 transition-opacity"
            on:click={handleShare}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M21 6.5C21 8.15685 19.6569 9.5 18 9.5C16.3431 9.5 15 8.15685 15 6.5C15 4.84315 16.3431 3.5 18 3.5C19.6569 3.5 21 4.84315 21 6.5Z"
                    stroke="#494848"
                    stroke-width="1.5"
                />
                <path
                    d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z"
                    stroke="#494848"
                    stroke-width="1.5"
                />
                <path
                    d="M21 17.5C21 19.1569 19.6569 20.5 18 20.5C16.3431 20.5 15 19.1569 15 17.5C15 15.8431 16.3431 14.5 18 14.5C19.6569 14.5 21 15.8431 21 17.5Z"
                    stroke="#494848"
                    stroke-width="1.5"
                />
                <path
                    d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495"
                    stroke="#494848"
                    stroke-width="1.5"
                />
            </svg>
        </button>
    </div>
</div>
