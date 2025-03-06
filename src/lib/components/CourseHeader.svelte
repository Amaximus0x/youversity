<script lang="ts">
    import { goto } from "$app/navigation";
    import { user } from "$lib/stores/auth";
    import { currentModuleStore, enrollmentProgressStore } from "$lib/stores/course";
    import type { FinalCourseStructure } from "$lib/types/course";
    import { page } from "$app/stores";

    export let courseDetails: FinalCourseStructure;
    export let creatorProfile: any;
    export let isCreator: boolean = false;
    export let isBookmarked: boolean = false;
    export let hasLiked: boolean = false;
    export let liking: boolean = false;
    export const showShareModal: boolean = false;
    export let isEnrolled: boolean = false;
    export let isIntroPage: boolean = false;
    export let isModulePage: boolean = false;
    export let isCoursePage: boolean = false;

    // Check if we're on the module page
    // $: isModulePage = $page.url.pathname.includes("/module");

    // Helper function to format numbers
    function formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return num.toString();
    }

    // Helper function to format dates
    function formatDate(dateInput: any): string {
        let date: Date;
        try {
            if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
                date = dateInput.toDate();
            } else if (dateInput instanceof Date) {
                date = dateInput;
            } else {
                date = new Date();
            }
        } catch (e) {
            date = new Date();
        }
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
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
<div class="flex items-center justify-between gap-4 mt-4" id="likes">
    <div class="flex items-center gap-4">
        <!-- Upvotes -->
        <button
            class="flex items-center gap-2 bg-Black/5 dark:bg-white/10 px-2 py-2 rounded-2xl hover:opacity-80 transition-opacity disabled:opacity-50"
            on:click={handleLike}
            disabled={liking}
        >
            <img
                src={hasLiked
                    ? "/icons/upvote-filled.svg"
                    : "/icons/upvote.svg"}
                alt="Upvotes"
                class="w-5 h-5 opacity-60 dark:opacity-100 dark:invert dark:brightness-200"
            />
            <span
                class={hasLiked
                    ? "text-semibody-medium text-light-text-primary dark:text-dark-text-primary"
                    : "text-mini-body text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-secondary dark:hover:text-dark-text-secondary"}
            >
                {formatNumber(courseDetails?.likes || 0)} Upvotes
            </span>
        </button>

        <!-- Views -->
        <div class="flex items-center gap-2">
            <img src="/icons/view.svg" alt="Views" class="w-5 h-5 opacity-60 dark:opacity-100 dark:invert dark:brightness-200" />
            <span class="text-mini-body text-light-text-secondary dark:text-dark-text-secondary">
                {formatNumber(courseDetails?.views || 0)} views
            </span>
        </div>
    </div>

    <!-- Module Button and Intro button for mobile only -->
     <!-- {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length} show intro button else show module button -->
     <!-- {#if $currentModuleStore == -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length}
       
        <button
            class="flex items-center gap-2 bg-Black/5 dark:bg-White/10 px-2 py-2 rounded-full hover:opacity-80 transition-opacity"
            on:click={() => {
                goto(`/course/${courseDetails.id}/module?tab=modules`);
            }}
        >
        Modules
        </button>
     {/if} -->














     <!-- class="{isIntroPage ? 'hidden' : 'lg:hidden'} flex items-center" -->
    <div class=" flex items-center">
        <button
            class="{isCoursePage ? 'hidden' : 'lg:hidden'} flex items-center"
            on:click={() => {
                if (isModulePage && (!isCreator || !isEnrolled)) {
                    goto(`/course/${courseDetails.id}/intro`);
                } else if (isModulePage && (isCreator || isEnrolled)) {
                    //set the last accessed module or -1
                    const lastModule =
                    $enrollmentProgressStore?.lastAccessedModule || -1;
                    currentModuleStore.set(lastModule);
                    goto(`/course/${$page.params.id}`);
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
                <img
                    src="/icons/arrow-right.svg"
                    alt="Modules"
                    class="w-6 h-6"
                />
            {/if}
        </button>

        <!-- Course Intro Button on course page for mobile -->
        {#if !isIntroPage && !isModulePage}
            <div class="lg:hidden">
                <button
                    class="px-4 py-2 text-body text-brand-turquoise hover:text-brand-turquoise/80 flex items-center gap-1"
                on:click={() => {
                    goto(`/course/${courseDetails.id}/module?tab=modules`);
                }}
            >
                Modules
                <img
                    src="/icons/arrow-right.svg"
                    alt="Introduction"
                    class="w-6 h-6"
                />
            </button>
        </div>
        {/if}
    </div>

</div>

<!-- Creator Info with Bookmark and Share Button -->
<div class="flex items-center justify-between mt-4">
    <!-- Creator Info -->
    <div class="flex items-center gap-3">
        <button
            class="flex items-center gap-3 hover:opacity-80 transition-opacity"
            on:click={() => goto(`/profile/${creatorProfile?.username || creatorProfile?.uid}`)}
        >
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

            <div >
                <p
                    class="text-semi-body text-light-text-secondary dark:text-dark-text-secondary"
                >
                    <span
                        class="text-body-semibold text-light-text-primary dark:text-dark-text-primary"
                        >Creator:</span
                    >
                    {creatorProfile?.username ||
                        creatorProfile?.displayName ||
                        "Unknown Creator"}
                </p>
                <div class="self-stretch text-mini-body text-light-text-tertiary dark:text-dark-text-tertiary text-left">
                    {formatDate(courseDetails.createdAt)}
                </div>
            </div>
        </button>
    </div>

    <div class="flex items-center gap-4">
        <!-- Bookmark Button -->
        <!-- {#if isEnrolled }    -->
            <button
                class="w-full px-2 py-2 text-semibody-medium flex items-center justify-center gap-2 bg-Black/5 dark:bg-White/10 text-Green dark:text-Green2 rounded-full"
                on:click={handleBookmark}
            >
                {#if isBookmarked}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-Green dark:text-Green2">
                        <path d="M12 22C7.75736 22 5.63604 22 4.31802 20.5356C3 19.0711 3 16.7141 3 12C3 7.28595 3 4.92893 4.31802 3.46446C5.63604 2 7.75736 2 12 2C16.2426 2 18.364 2 19.682 3.46446C21 4.92893 21 7.28595 21 12C21 16.7141 21 19.0711 19.682 20.5356C18.364 22 16.2426 22 12 22Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 2.5V9.82621C8 11.0733 8 11.6969 8.38642 11.9201C9.13473 12.3523 10.5384 10.9103 11.205 10.4761C11.5916 10.2243 11.7849 10.0984 12 10.0984C12.2151 10.0984 12.4084 10.2243 12.795 10.4761C13.4616 10.9103 14.8653 12.3523 15.6136 11.9201C16 11.6969 16 11.0733 16 9.82621V2.5" stroke="#241015" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                {:else}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-Green dark:text-Green2">
                        <path d="M12 22C7.75736 22 5.63604 22 4.31802 20.5356C3 19.0711 3 16.7141 3 12C3 7.28595 3 4.92893 4.31802 3.46446C5.63604 2 7.75736 2 12 2C16.2426 2 18.364 2 19.682 3.46446C21 4.92893 21 7.28595 21 12C21 16.7141 21 19.0711 19.682 20.5356C18.364 22 16.2426 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M8 2.5V9.82621C8 11.0733 8 11.6969 8.38642 11.9201C9.13473 12.3523 10.5384 10.9103 11.205 10.4761C11.5916 10.2243 11.7849 10.0984 12 10.0984C12.2151 10.0984 12.4084 10.2243 12.795 10.4761C13.4616 10.9103 14.8653 12.3523 15.6136 11.9201C16 11.6969 16 11.0733 16 9.82621V2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                {/if}
            </button>
        <!-- {/if} -->

        <!-- Share Button -->
        <!-- {#if $currentModuleStore === -1 || $currentModuleStore === courseDetails?.Final_Module_Title?.length} -->
            <button
                class="flex items-center gap-2 bg-Black/5 dark:bg-White/10 px-2 py-2 rounded-full hover:opacity-80 transition-opacity"
                on:click={handleShare}
            >
                <svg
                    class="w-6 h-6 text-Green dark:text-Green2"
                    width="24"
                    height="24"
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
        <!-- {/if} -->
    </div>
</div>

<!-- Navigation Buttons - Only for enrolled users and creators -->

{#if isEnrolled || (isCreator && $currentModuleStore !== -1 && $currentModuleStore !== 0)}
    <div class="flex items-center {$currentModuleStore !== 10 ? 'justify-between' : 'justify-end'} mt-4">
        {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length}
            <!-- Prev and Next Buttons -->
            <div class="flex items-center gap-4">
                <button
                    class="px-2 pr-[14px] py-2 text-semi-body bg-Black/5 dark:bg-White/10 rounded-lg text-Green dark:text-Green2 hover:text-GreenHover flex items-center gap-1"
                    on:click={() => {
                        if ($currentModuleStore > -1) {
                            currentModuleStore.set($currentModuleStore - 1);
                            goto(`/course/${courseDetails.id}`);
                        }
                    }}
                    disabled={$currentModuleStore === -1}
                >
                    <svg
                        class=" stroke-Green dark:stroke-Green2 rotate-180"
                        width="24"
                        height="24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M9 6C9 6 15 10.4189 15 12C15 13.5812 9 18 9 18"
                            stroke=""
                            stroke-width="1.5"
                        />
                    </svg>
                    Prev
                </button>

                <button
                    class="px-2 py-2 pl-[14px] text-semi-body bg-Black/5 dark:bg-White/10 rounded-lg text-Green dark:text-Green2 hover:text-GreenHover flex items-center gap-1"
                    on:click={() => {
                        if (
                            $currentModuleStore <
                            (courseDetails?.Final_Module_Title?.length || 0)
                        ) {
                            currentModuleStore.set($currentModuleStore + 1);
                            goto(`/course/${courseDetails.id}`);
                        }
                    }}
                    disabled={$currentModuleStore ===
                        courseDetails?.Final_Module_Title?.length}
                >
                    Next
                    <svg
                        class="w-6 h-6 stroke-Green dark:stroke-Green2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                    >
                        <path
                            d="M9 6C9 6 15 10.4189 15 12C15 13.5812 9 18 9 18"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </button>
            </div>
        {/if}

        <!-- Course Intro Button for desktop -->
        <div class="hidden lg:flex justify-end">
            {#if $currentModuleStore !== -1 }
                <button
                    class="lg:flex  py-2 text-body text-brand-turquoise hover:text-brand-turquoise/80 flex items-center gap-1"
                    on:click={() => {
                        currentModuleStore.set(-1);
                        goto(`/course/${courseDetails.id}`);
                    }}
                >
                    Course Introduction
                    <img
                        src="/icons/arrow-right.svg"
                        alt="Introduction"
                        class="w-6 h-6"
                    />
                </button>
            {/if}
        </div>

        <!-- Course Intro Button for mobile -->
        <div class="lg:hidden">
            {#if $currentModuleStore !== -1 && $currentModuleStore !== courseDetails?.Final_Module_Title?.length}
                <button
                    class="lg:flex py-2 text-body text-brand-turquoise hover:text-brand-turquoise/80 flex items-center gap-1"
                    on:click={() => {
                        currentModuleStore.set(-1);
                        goto(`/course/${courseDetails.id}`);
                    }}
                >
                    Course Intro
                    <img
                        src="/icons/arrow-right.svg"
                        alt="Introduction"
                        class="w-6 h-6"
                    />
                </button>
            {/if}
        </div>
    </div>
{/if}
