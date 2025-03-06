<script lang="ts">
    import { page } from "$app/stores";
    import { onMount, onDestroy } from "svelte";
    import { user } from "$lib/stores/auth";
    import { goto } from "$app/navigation";
    import { currentModuleStore, enrollmentProgressStore } from "$lib/stores/course";
    import type { FinalCourseStructure, EnrollmentProgress } from "$lib/types/course";
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
        hasLikedCourse,
    } from "$lib/firebase";
    import { browser } from "$app/environment";

    let courseDetails: FinalCourseStructure | null = null;
    let loading = true;
    let error: string | null = null;
    let isCreator = false;
    let isEnrolled = false;
    let enrollmentProgress: EnrollmentProgress | null = null;
    let moduleProgress: { completed?: boolean }[] = [];
    let showShareModal = false;
    let isBookmarked = false;
    let creatorProfile: any = null;
    let hasLiked = false;
    let liking = false;
    let isModulePage = true;
    let currentModule: number | undefined;
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

    // Load saved state from localStorage
    function loadSavedState() {
        if (browser) {
            const savedState = localStorage.getItem(
                `course_${$page.params.id}_state`,
            );
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    // Only load non-critical states from localStorage
                    isBookmarked = state.isBookmarked ?? false;
                    hasLiked = state.hasLiked ?? false;
                    isEnrolled = state.isEnrolled ?? false;
                    
                    console.log('Module page - Loaded state from localStorage:', { 
                        isBookmarked, 
                        hasLiked, 
                        isEnrolled 
                    });
                } catch (error) {
                    console.error("Error parsing saved state:", error);
                }
            } else {
                // If no saved state for this course, ensure isEnrolled is false
                isEnrolled = false;
                console.log('Module page - No saved state, setting isEnrolled=false');
            }

            // Only load enrollment progress if this course is marked as enrolled
            if (isEnrolled) {
                // Load enrollment progress from localStorage
                const savedProgress = localStorage.getItem(
                    `course_${$page.params.id}_progress`,
                );
                
                if (savedProgress) {
                    try {
                        const progress = JSON.parse(savedProgress);
                        if (progress) {
                            // Ensure progress has all required fields
                            enrollmentProgress = {
                                quizResults: progress.quizResults || { moduleQuizzes: {} },
                                moduleProgress: progress.moduleProgress || {},
                                completedModules: Array.isArray(progress.completedModules) 
                                    ? [...progress.completedModules] 
                                    : [],
                                lastAccessedModule: progress.lastAccessedModule || 0
                            };
                            
                            // Update the store immediately
                            enrollmentProgressStore.set(enrollmentProgress);
                            console.log('Module page - Loaded progress from localStorage:', enrollmentProgress);
                        }
                    } catch (error) {
                        console.error("Error parsing saved progress:", error);
                    }
                }
            } else {
                // If not enrolled, clear any existing enrollment progress
                enrollmentProgress = null;
                enrollmentProgressStore.set(null);
                console.log('Module page - Not enrolled, clearing enrollment progress');
            }
        }
    }

    // Save state to localStorage
    function saveState(updates = {}) {
        if (browser) {
            const currentState = {
                isEnrolled,
                isBookmarked,
                hasLiked,
                ...updates,
            };
            // Only save if we have valid enrollment status
            if (isEnrolled !== null && isEnrolled !== undefined) {
                localStorage.setItem(
                    `course_${$page.params.id}_state`,
                    JSON.stringify(currentState),
                );
            }
        }
    }

    // Save enrollment progress to localStorage
    function saveProgress() {
        if (browser && enrollmentProgress && isEnrolled) {
            localStorage.setItem(
                `course_${$page.params.id}_progress`,
                JSON.stringify(enrollmentProgress),
            );
            console.log('Module page - Saved progress to localStorage:', enrollmentProgress);
        }
    }

    // Cleanup function to ensure we don't leave stale data in the store
    onDestroy(() => {
        // Don't reset the store on destroy, as we want to keep the data for other pages
        // Save progress before leaving the page
        saveProgress();
    });

    // Add this subscription to the enrollmentProgressStore
    // Subscribe to the enrollmentProgressStore to ensure we always have the latest data
    $: {
        console.log('Module page - Current store value:', $enrollmentProgressStore);
        if ($enrollmentProgressStore) {
            enrollmentProgress = $enrollmentProgressStore;
            console.log('Module page - Updated from store:', enrollmentProgress);
            // Save to localStorage whenever it changes
            saveProgress();
        }
    }

    // Make sure isEnrolled is set correctly when enrollmentProgress changes
    $: if (enrollmentProgress && enrollmentProgress.completedModules.length > 0 && !isEnrolled) {
        // This is a safety check - if we have enrollment progress but isEnrolled is false,
        // we need to verify if the user is actually enrolled in this course
        console.log('Module page - Warning: Found enrollment progress but isEnrolled is false, verifying...');
        
        // If we have a user, check with the server
        if ($user) {
            getUserCourse($user.uid, $page.params.id).then(courseData => {
                if (courseData && courseData.isEnrolled) {
                    isEnrolled = true;
                    console.log('Module page - Verified enrollment with server, setting isEnrolled=true');
                } else {
                    // If the server says not enrolled, clear the progress
                    isEnrolled = false;
                    enrollmentProgress = null;
                    enrollmentProgressStore.clear();
                }
            }).catch(error => {
                console.error('Error verifying enrollment:', error);
                // On error, assume not enrolled and clear progress
                isEnrolled = false;
                enrollmentProgress = null;
                enrollmentProgressStore.clear();
            });
        } else {
            // If no user, we can't be enrolled
            isEnrolled = false;
            enrollmentProgress = null;
            enrollmentProgressStore.clear();
            console.log('Module page - No user, clearing enrollment progress');
        }
    }

    onMount(async () => {
        // Load saved state initially
        loadSavedState();
        
        // If we have enrollment progress from localStorage, make sure isEnrolled is true
        if (enrollmentProgress && enrollmentProgress.completedModules.length > 0) {
            isEnrolled = true;
            console.log('Module page - Setting isEnrolled=true based on enrollment progress');
        }
        
        try {
            if ($user) {
                // First, try to get the course data with enrollment info
                const courseData = await getUserCourse($user.uid, $page.params.id);
                
                if (courseData) {
                    courseDetails = courseData;
                    isCreator = courseData.isCreator === true;
                    
                    // This is the source of truth for enrollment status
                    const serverEnrollmentStatus = courseData.isEnrolled === true;
                    
                    // If the server says we're not enrolled but localStorage says we are,
                    // trust the server and clear the localStorage data
                    if (!serverEnrollmentStatus && isEnrolled) {
                        console.log('Module page - Server says not enrolled but localStorage says enrolled, clearing data');
                        isEnrolled = false;
                        enrollmentProgress = null;
                        enrollmentProgressStore.clear();
                        
                        // Clear the localStorage state
                        localStorage.removeItem(`course_${$page.params.id}_progress`);
                        localStorage.removeItem(`course_${$page.params.id}_state`);
                    } else {
                        // Otherwise, update isEnrolled based on server data
                        isEnrolled = serverEnrollmentStatus;
                    }
                    
                    // Save state after getting enrollment info
                    saveState({ isEnrolled });
                    
                    // Check if user has liked the course
                    hasLiked = await hasLikedCourse($user.uid, $page.params.id);
                    
                    // Check bookmark status
                    isBookmarked = await checkBookmarkStatus($user.uid, $page.params.id);
                    
                    // Only fetch enrollment progress if we're enrolled and don't already have it
                    if (isEnrolled && (!enrollmentProgress || enrollmentProgress.completedModules.length === 0)) {
                        console.log('Module page - Fetching enrollment progress from server');
                        const progress = await getEnrollmentProgress($user.uid, $page.params.id);
                        
                        if (progress) {
                            // Ensure progress has all required fields
                            enrollmentProgress = {
                                quizResults: progress.quizResults || { moduleQuizzes: {} },
                                moduleProgress: progress.moduleProgress || {},
                                completedModules: Array.isArray(progress.completedModules) 
                                    ? [...progress.completedModules] 
                                    : [],
                                lastAccessedModule: progress.lastAccessedModule || 0
                            };
                            
                            // Update the store as well
                            enrollmentProgressStore.set(enrollmentProgress);
                            
                            // Save to localStorage
                            saveProgress();
                            
                            console.log('Module page - Enrollment progress from server:', enrollmentProgress);
                        }
                    } else if (isEnrolled && enrollmentProgress) {
                        // If we already have progress from localStorage, make sure it's in the store
                        enrollmentProgressStore.set(enrollmentProgress);
                        console.log('Module page - Using cached enrollment progress:', enrollmentProgress);
                    } else if (!isEnrolled) {
                        // If not enrolled, ensure progress is cleared
                        enrollmentProgress = null;
                        enrollmentProgressStore.clear();
                        console.log('Module page - Not enrolled, clearing enrollment progress');
                    }
                    
                    // Get creator profile
                    if (courseDetails.createdBy) {
                        creatorProfile = await getUserProfile(courseDetails.createdBy);
                    }
                }
            }

            // If not logged in or no course data yet, try getting shared course
            if (!courseDetails) {
                const sharedCourseData = await getSharedCourse($page.params.id);
                if (!sharedCourseData) {
                    error = "Course not found";
                    return;
                }
                courseDetails = sharedCourseData;
                
                // For shared courses, always set these to false
                isEnrolled = false;
                isCreator = false;
                
                // Clear any enrollment progress data
                enrollmentProgress = null;
                enrollmentProgressStore.clear();
                
                // Clear localStorage for this course
                localStorage.removeItem(`course_${$page.params.id}_progress`);
                localStorage.removeItem(`course_${$page.params.id}_state`);
                
                console.log('Module page - Loaded shared course, cleared enrollment data');
                
                // Get creator profile for shared course
                if (courseDetails.createdBy) {
                    creatorProfile = await getUserProfile(courseDetails.createdBy);
                }
            }

            // Initialize module progress array
            if (courseDetails?.Final_Module_Title) {
                moduleProgress = new Array(
                    courseDetails.Final_Module_Title.length,
                ).fill({ completed: false });
                
                // Update module progress based on enrollment data
                if (enrollmentProgress?.completedModules) {
                    enrollmentProgress.completedModules.forEach(moduleIndex => {
                        if (moduleIndex >= 0 && moduleIndex < moduleProgress.length) {
                            moduleProgress[moduleIndex] = { completed: true };
                        }
                    });
                }
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

<div class="min-h-screen mx-[-20px]">
    <!-- Tab buttons -->
    <div
        class=" w-full bg-BackgroundRed dark:bg-dark-bg-secondary border-b border-light-border dark:border-dark-border fixed top-[70px] pt-6 lg:top-[96px] lg:left-[262px] lg:right-[26px] left-0 right-0 z-[50]"
    >
        <div class="container mx-auto flex gap-2 px-5 py-2">
            <button
                class="flex-1 px-4 py-3 text-h4- rounded-lg transition-colors {activeTab ===
                'modules'
                    ? 'bg-Green dark:bg-Green2 text-white'
                    : 'text-Green dark:text-Green2 bg-Black/5 dark:bg-White/10 hover:bg-Black/10'}"
                on:click={() => handleTabChange("modules")}
            >
                Course Modules
            </button>
            <button
                class="flex-1 px-4 py-3 text-semi-body rounded-lg transition-colors {activeTab ===
                'reviews'
                    ? 'bg-Green dark:bg-Green2 text-white'
                    : 'text-Green dark:text-Green2 bg-Black/5 dark:bg-White/10 hover:bg-Black/10'}"
                on:click={() => handleTabChange("reviews")}
            >
                Reviews
            </button>
        </div>
    </div>

    <!-- Content with top padding to account for fixed header -->
    <div class="container mx-auto px-5 pt-[84px] lg:pt-[176px] pb-8">
        {#if loading}
            <div class="flex justify-center items-center min-h-screen">
                <div
                    class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-turquoise"
                ></div>
            </div>
        {:else if error}
            <div class="text-brand-red text-center p-4">{error}</div>
        {:else if courseDetails}
            <!-- Course Title -->
            <h1
                class="text-h4-medium font-bold lg:text-h2 text-Black dark:text-White pt-6 mb-4"
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
                {isModulePage}
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
                        bind:currentModule
                    />
                    <!-- {#if isEnrolled && import.meta.env.DEV}
                        <div class="mt-4 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                            Debug: isEnrolled={isEnrolled.toString()}, 
                            completedModules={enrollmentProgress?.completedModules?.length || 0}
                        </div>
                    {/if} -->
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
