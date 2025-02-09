<script lang="ts">
    import { goto } from "$app/navigation";
    import type { FinalCourseStructure } from "$lib/types/course";
    import { user } from "$lib/stores/auth";
    import { onMount } from "svelte";
    import { getUserProfile } from "$lib/services/profile";

    export let course: FinalCourseStructure & { id: string };
    export let onShare: (courseId: string) => void;

    async function handleNavigateToCourse(courseId: string) {
        try {
            if ($user) {
                await goto(`/course/${courseId}`);
            } else {
                const returnUrl = `/course/${courseId}`;
                await goto(
                    `/login?redirectTo=${encodeURIComponent(returnUrl)}`,
                );
            }
        } catch (error) {
            console.error("Error navigating to course:", error);
        }
    }

    let creatorProfile = {
        photoURL: "",
        username: "",
    };

    onMount(async () => {
        if (course.createdBy) {
            const profile = await getUserProfile(course.createdBy);
            if (profile) {
                creatorProfile = {
                    photoURL: profile.photoURL || "",
                    username: profile.username || "Unknown",
                };
            }
        }
    });

    function getRelativeTimeString(date: Date | any): string {
        const timestamp = date?.toDate?.() || date;
        const now = new Date();
        const then = new Date(timestamp);
        const diffInSeconds = Math.floor(
            (now.getTime() - then.getTime()) / 1000,
        );

        const minute = 60;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 30;
        const year = day * 365;

        if (diffInSeconds < minute) {
            return "just now";
        } else if (diffInSeconds < hour) {
            const minutes = Math.floor(diffInSeconds / minute);
            return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < day) {
            const hours = Math.floor(diffInSeconds / hour);
            return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < week) {
            const days = Math.floor(diffInSeconds / day);
            return `${days} day${days > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < month) {
            const weeks = Math.floor(diffInSeconds / week);
            return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
        } else if (diffInSeconds < year) {
            const months = Math.floor(diffInSeconds / month);
            return `${months} month${months > 1 ? "s" : ""} ago`;
        } else {
            const years = Math.floor(diffInSeconds / year);
            return `${years} year${years > 1 ? "s" : ""} ago`;
        }
    }

    function formatViewCount(views: number): string {
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}m`;
        } else if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}k`;
        }
        return views.toString();
    }

    function formatDuration(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        return `${hours}h`;
    }
</script>

<div
    class="w-full h-full backdrop-blur-sm rounded-[14px] border border-light-border dark:border-dark-border flex flex-col justify-start items-start overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
    on:click={() => handleNavigateToCourse(course.id)}
    on:keydown={(e) => e.key === "Enter" && handleNavigateToCourse(course.id)}
    role="button"
    tabindex="0"
>
    <!-- Thumbnail Section -->
    <div class="relative w-full h-[148px]">
        <img
            src={course.Final_Course_Thumbnail ||
                "/images/course-placeholder.png"}
            alt={course.Final_Course_Title}
            class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black/30" />

        <!-- Share Button -->
        <button
            class="absolute top-4 right-4 p-2 bg-black/30 rounded-full justify-start items-center gap-2.5 hover:bg-black/10 z-10"
            on:click|stopPropagation={(e) => {
                e.preventDefault();
                onShare(course.id);
            }}
        >
            <img src="/icons/share-icon.svg" alt="Share" class="w-6 h-6" />
        </button>
    </div>

    <!-- Content Section -->
    <div class="flex-1 w-full p-4 flex flex-col gap-4">
        <!-- Course Title -->
        <h3
            class="text-light-text-primary dark:text-dark-text-primary text-body-semibold line-clamp-2"
        >
            {course.Final_Course_Title}
        </h3>

        <div class="flex flex-col gap-2">

        <!-- Creator Info & Views -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div
                    class="w-6 h-6 rounded-full overflow-hidden bg-light-bg-secondary dark:bg-dark-bg-secondary flex items-center justify-center"
                >
                    {#if creatorProfile.photoURL}
                        <img
                            src={creatorProfile.photoURL}
                            alt={creatorProfile.username}
                            class="w-full h-full object-cover"
                        />
                    {:else}
                        <span
                            class="text-mini-body font-medium text-light-text-primary dark:text-dark-text-primary uppercase"
                        >
                            {creatorProfile.username[0] || "?"}
                        </span>
                    {/if}
                </div>
                <span
                    class="text-light-text-secondary dark:text-dark-text-secondary text-mini-body"
                >
                    {creatorProfile.username}
                </span>
            </div>
            <div class="flex items-center gap-2">
                <span
                    class="text-light-text-secondary dark:text-dark-text-secondary text-mini-body"
                >
                    {formatViewCount(course.views || 0)}
                </span>
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <g id="view">
                        <path
                            id="Vector"
                            d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z"
                            stroke="#42C1C8"
                            stroke-width="1.5"
                        />
                        <path
                            id="Vector_2"
                            d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z"
                            stroke="#42C1C8"
                            stroke-width="1.5"
                        />
                    </g>
                </svg>
                <!-- <img src="/icons/view.svg" alt="Views" class="w-4 h-4 fill-current text-brand-turquoise" /> -->
            </div>
        </div>

        <!-- Date & Duration -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <img src="/icons/calendar.svg" alt="Date" class="w-4 h-4" />
                <span
                    class="text-light-text-secondary dark:text-dark-text-secondary text-mini-body"
                >
                    {getRelativeTimeString(course.createdAt)}
                </span>
            </div>
            <div class="flex items-center gap-2">
                <span
                    class="text-light-text-secondary dark:text-dark-text-secondary text-mini-body"
                >
                    Duration: {course?.Final_Course_Duration
                        ? formatDuration(course.Final_Course_Duration)
                        : "--"}
                </span>
                <img
                    src="/icons/time-quarter.svg"
                    alt="Duration"
                    class="w-4 h-4"
                />
            </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-3 bg-Black/5 dark:bg-White/5 rounded-full overflow-hidden">
            <div class="h-full bg-brand-turquoise rounded-full" style="width: {course.progress || 0}%"></div>
        </div>
        </div>

        <!-- View Course Button -->
        <button
            class="w-full px-4 py-2 bg-brand-red hover:bg-ButtonHover rounded-lg justify-center items-center gap-2 transition-colors duration-200"
            on:click|stopPropagation={() =>
                handleNavigateToCourse(course.id)}
        >
            <span class="text-white text-semi-body  ">{course.progress ? "Continue" : "Start Course"}</span>
        </button>
    </div>
</div>
