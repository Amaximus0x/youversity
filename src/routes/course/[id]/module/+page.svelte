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
        getSharedCourse,
        likeCourse,
    } from "$lib/firebase";
    import { getUserProfile } from "$lib/services/profile";
    import CourseModuleList from "$lib/components/CourseModuleList.svelte";
    import CourseRatings from "$lib/components/CourseRatings.svelte";
    import ShareModal from "$lib/components/ShareModal.svelte";
    import CourseHeader from "$lib/components/CourseHeader.svelte";
    import {
        toggleBookmark,
        isBookmarked as checkBookmarkStatus,
    } from "$lib/firebase";

    let courseDetails: FinalCourseStructure | null = null;
    let loading = true;
    let error: string | null = null;
    let isCreator = false;
    let isEnrolled = false;
    let enrollmentProgress: any = null;
    let moduleProgress: { completed?: boolean }[] = [];
    let showShareModal = false;
    let isBookmarked = false;
    let creatorProfile: any = null;
    let hasLiked = false;
    let liking = false;
    // Add state for active tab
    let activeTab: "modules" | "reviews" = "modules";

    // Get the active tab from URL params
    $: {
        const tab = $page.url.searchParams.get("tab");
        activeTab = tab === "reviews" ? "reviews" : "modules";
    }

    // Function to handle tab change
    function handleTabChange(tab: "modules" | "reviews") {
        activeTab = tab;
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        history.pushState({}, "", url.toString());
    }

    // Add like handler
    async function handleLike() {
        if (!$user) {
            goto("/login");
            return;
        }

        try {
            liking = true;
            const newLikeState = await likeCourse($user.uid, $page.params.id);
            hasLiked = newLikeState;

            // Update local likes count
            if (courseDetails) {
                courseDetails.likes =
                    (courseDetails.likes || 0) + (newLikeState ? 1 : -1);
            }
        } catch (error) {
            console.error("Error liking course:", error);
        } finally {
            liking = false;
        }
    }

    // Handle bookmark
    async function handleBookmark() {
        if (!$user) {
            goto("/login");
            return;
        }

        const newState = !isBookmarked;
        isBookmarked = newState;

        try {
            await toggleBookmark($user.uid, $page.params.id);
        } catch (error) {
            console.error("Error bookmarking course:", error);
            isBookmarked = !newState;
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
                        enrollmentProgress = await getEnrollmentProgress(
                            $user.uid,
                            $page.params.id,
                        );
                    }

                    // Check bookmark status
                    isBookmarked = await checkBookmarkStatus(
                        $user.uid,
                        $page.params.id,
                    );
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

            // Get creator profile
            if (courseDetails?.createdBy) {
                creatorProfile = await getUserProfile(courseDetails.createdBy);
            }

            // Initialize module progress array
            if (courseDetails?.Final_Module_Title) {
                moduleProgress = new Array(
                    courseDetails.Final_Module_Title.length,
                ).fill({ completed: false });
            }
        } catch (err) {
            console.error("Error fetching course:", err);
            error =
                err instanceof Error ? err.message : "Failed to load course";
        } finally {
            loading = false;
        }
    });

    // Add this function with other functions
    function handleShare() {
        showShareModal = true;
    }
</script>

<div class="min-h-screen mx-[-20px] mb-[32px]">
    <!-- Tab buttons -->
    <div class="w-full border-b border-light-border dark:border-dark-border">
        <div class="container mx-auto flex gap-2 px-5 py-2">
            <button
                class="flex-1 px-4 py-4 text-h4- rounded-lg transition-colors {activeTab ===
                'modules'
                    ? 'bg-Green text-white'
                    : 'text-Green bg-Black/5 hover:bg-Black/10'}"
                on:click={() => handleTabChange("modules")}
            >
                Course Modules
            </button>
            <button
                class="flex-1 px-4 py-4 text-semi-body rounded-lg transition-colors {activeTab ===
                'reviews'
                    ? 'bg-Green text-white'
                    : 'text-Green bg-Black/5 hover:bg-Black/10'}"
                on:click={() => handleTabChange("reviews")}
            >
                Reviews
            </button>
        </div>
    </div>

    <div class="container mx-auto px-5 py-6">
        {#if loading}
            <div class="flex justify-center items-center min-h-[200px]">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise"
                ></div>
            </div>
        {:else if error}
            <div class="text-brand-red text-center p-4">{error}</div>
        {:else if courseDetails}
            <!-- Course Title -->
            <h1
                class="text-h4-medium lg:text-h2 text-Black dark:text-White mb-4"
            >
                {courseDetails.Final_Course_Title}
            </h1>

            <CourseHeader
                {courseDetails}
                {creatorProfile}
                {isCreator}
                {isBookmarked}
                {hasLiked}
                {liking}
                {showShareModal}
                on:like={handleLike}
                on:bookmark={handleBookmark}
                on:share={() => (showShareModal = true)}
            />

            <div class="mt-6">
                <!-- Tab Content -->
                {#if activeTab === "modules"}
                    <CourseModuleList
                        {courseDetails}
                        {isCreator}
                        {isEnrolled}
                        showProgress={true}
                        completedModules={isCreator
                            ? moduleProgress
                                  .map((m, i) => (m?.completed ? i : -1))
                                  .filter((i) => i !== -1)
                            : enrollmentProgress?.completedModules || []}
                    />
                {:else}
                    <CourseRatings 
                        courseId={$page.params.id}
                        showReadAll={false}
                    />
                {/if}
            </div>
        {/if}
    </div>
</div>

<!-- Share Modal -->
<ShareModal
    show={showShareModal}
    courseId={$page.params.id}
    onClose={() => (showShareModal = false)}
/>
