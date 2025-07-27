<script lang="ts">
    import { onMount } from "svelte";
    import { user } from "$lib/stores/auth";
    import VideoLibraryCard from "$lib/components/VideoLibraryCard.svelte";
    import TagsSidebar from "$lib/components/TagsSidebar.svelte";
    import AddVideoModal from "$lib/components/AddVideoModal.svelte";
    import CreateCourseModal from "$lib/components/modals/CreateCourseModal.svelte";
    import { goto } from "$app/navigation";
    import { get } from "svelte/store";
    import { collection, getDocs, query, where } from 'firebase/firestore';
    import { db } from '$lib/firebase';

    // State for videos and tags
    let allVideos: any[] = [];
    let displayedVideos: any[] = [];
    let availableTags: { id: string; name: string; count: number }[] = [];
    let tagVideos: { [key: string]: any[] } = {};
    let loading = true;
    let error: string | null = null;
    let activeTab: "saved" | "assigned" = "saved";
    let showSortDropdown = false;
    let sortOption: "newest" | "oldest" = "newest";

    // Selection related state
    let showOptionsMenu = false;
    let optionsMenuPosition = { x: 0, y: 0 };
    let selectMode = false;
    let selectedVideos: Set<string> = new Set();
    let hasSelectionOccurred = false;
    let showAddVideoModal = false;
    let showCreateCourseModal = false;
    let createCourseVideos: any[] = [];

    // Video counts for tabs
    let videoCount = {
        saved: 0,
        assigned: 0
    };

    // Function to fetch videos from Firestore
    async function fetchVideos() {
        try {
            loading = true;
            error = null;

            const currentUser = get(user);
            if (!currentUser) {
                error = 'Please sign in to view videos';
                return;
            }

            // Query to fetch only current user's videos
            const videosRef = collection(db, 'savedVideos');
            const userVideosQuery = query(videosRef, where('userId', '==', currentUser.uid));
            const querySnapshot = await getDocs(userVideosQuery);
            
            allVideos = querySnapshot.docs.map(doc => ({
                documentId: doc.id,  // Firestore document ID
                ...doc.data()  // This includes the videoId field (YouTube ID)
            }));

            // Update video counts - all videos are now user's videos
            videoCount = {
                saved: allVideos.length, // All fetched videos are user's videos
                assigned: 0 // This will be implemented when assignment feature is added
            };

            // Extract unique tags and their counts
            const tagCounts = new Map<string, number>();
            const tagVideoMap: { [key: string]: any[] } = {};
            
            allVideos.forEach(video => {
                if (video.tag) {
                    tagCounts.set(video.tag, (tagCounts.get(video.tag) || 0) + 1);
                    if (!tagVideoMap[video.tag]) {
                        tagVideoMap[video.tag] = [];
                    }
                    tagVideoMap[video.tag].push(video);
                }
            });

            // Convert tag counts to array format
            availableTags = Array.from(tagCounts.entries()).map(([id, count]) => ({
                id,
                name: id.charAt(0).toUpperCase() + id.slice(1),
                count
            }));

            // Sort tags by count (most frequent first)
            availableTags.sort((a, b) => b.count - a.count);
            
            // Store tag videos mapping
            tagVideos = tagVideoMap;
            
            // Set initial displayed videos
            updateDisplayedVideos();
            
        } catch (err) {
            console.error('Error fetching videos:', err);
            error = err instanceof Error ? err.message : 'Failed to load videos';
        } finally {
            loading = false;
        }
    }

    // Function to update displayed videos based on sort option
    function updateDisplayedVideos() {
        let filtered = [...allVideos];
        
        // Sort videos
        filtered.sort((a, b) => {
            const dateA = new Date(a.publishedAt).getTime();
            const dateB = new Date(b.publishedAt).getTime();
            return sortOption === 'newest' ? dateB - dateA : dateA - dateB;
        });

        displayedVideos = filtered;
    }

    // Function to handle video click
    function handleVideoClick(id: string) {
        if (selectMode) {
            toggleVideoSelection(id);
        } else {
            goto(`/video-library/${id}`);
        }
    }

    // Function to handle options menu click
    function handleOptionsClick(event: MouseEvent) {
        event.stopPropagation();
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        optionsMenuPosition = {
            x: rect.left,
            y: rect.bottom + window.scrollY,
        };
        showOptionsMenu = true;
    }

    // Function to toggle video selection
    function toggleVideoSelection(id: string) {
        if (selectedVideos.has(id)) {
            selectedVideos.delete(id);
        } else {
            selectedVideos.add(id);
            hasSelectionOccurred = true;
        }
        selectedVideos = new Set(selectedVideos);
    }

    // Function to handle sort option selection
    function handleSortSelect(option: "newest" | "oldest") {
        sortOption = option;
        showSortDropdown = false;
        updateDisplayedVideos();
    }

    // Function to handle click outside of dropdown
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest(".sort-dropdown")) {
            showSortDropdown = false;
        }
        if (showOptionsMenu && !target.closest(".options-menu")) {
            showOptionsMenu = false;
        }
    }

    // Function to handle video upload
    function handleUploadVideo() {
        showAddVideoModal = true;
    }

    // Function to handle video added
    function handleVideoAdded() {
        fetchVideos(); // Refresh the video list
    }

    // Function to enter select mode
    function enterSelectMode() {
        selectMode = true;
        hasSelectionOccurred = false;
        showOptionsMenu = false;
    }

    // Function to select all videos
    function selectAllVideos() {
        displayedVideos.forEach((video) => {
            selectedVideos.add(video.videoId);
        });
        selectedVideos = new Set(selectedVideos);
        hasSelectionOccurred = true;
        showOptionsMenu = false;
        selectMode = true;
    }

    // Function to show insights
    function showInsights() {
        alert("Insights feature coming soon!");
        showOptionsMenu = false;
    }

    // Function to cancel selection
    function cancelSelection() {
        selectMode = false;
        hasSelectionOccurred = false;
        selectedVideos.clear();
        selectedVideos = new Set(selectedVideos);
    }

    // Functions for selected videos actions
    function createNewCourse() {
        if (selectedVideos.size === 0) {
            alert("Please select at least one video to create a course.");
            return;
        }
        
        // Get selected video data
        const selectedVideoData = displayedVideos.filter(video => 
            selectedVideos.has(video.videoId)
        );
        
        // Show the create course modal with selected videos
        showCreateCourseModal = true;
        createCourseVideos = selectedVideoData;
    }

    function addToExistingCourse() {
        alert(`Add ${selectedVideos.size} videos to existing course - Coming soon!`);
    }

    function assignVideos() {
        alert(`Assign ${selectedVideos.size} videos - Coming soon!`);
    }

    function deleteVideos() {
        alert(`Delete ${selectedVideos.size} videos - Coming soon!`);
    }

    // Update displayed videos when sort option changes
    $: if (sortOption) {
        updateDisplayedVideos();
    }

    function handleVideoSelect(videoId: string, selected: boolean) {
        if (selected) {
            selectedVideos.add(videoId);
            hasSelectionOccurred = true;
        } else {
            selectedVideos.delete(videoId);
        }
        selectedVideos = new Set(selectedVideos);
    }

    onMount(() => {
        fetchVideos();
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });

    // Selected videos count
    $: selectedCount = selectedVideos.size;
</script>

<div class="min-h-screen">
    <!-- Header Section -->
    <div class="mb-8">
        <h1
            class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary mb-4"
        >
            Video Library
        </h1>
        <p
            class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body lg:text-body"
        >
            Access all your saved and uploaded videos. Organize, preview, and
            turn them into learning content with ease.
        </p>
    </div>

    <!-- Tabs and Sort Section -->
    <div class="mb-6">
        <!-- Border container that spans full width -->
        <div
            class="relative border-b border-light-border dark:border-dark-border"
        >
            <div class="container lg:pl-4 max-w-auto">
                <!-- Tabs -->
                <div class="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-1">
                    <button
                        class="pb-4 relative whitespace-nowrap {activeTab ===
                        'saved'
                            ? 'text-Green dark:text-TransparentGreen2 text-body-semibold'
                            : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
                        on:click={() => (activeTab = "saved")}
                    >
                        <span class="hidden lg:inline">Saved videos</span>
                        <span class="lg:hidden">Saved</span>
                        <span
                            class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium"
                        >
                            {videoCount.saved}
                        </span>
                        {#if activeTab === "saved"}
                            <div
                                class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"
                            ></div>
                        {/if}
                    </button>

                    <button
                        class="pb-4 relative whitespace-nowrap {activeTab ===
                        'assigned'
                            ? 'text-Green dark:text-TransparentGreen2 text-body-semibold'
                            : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
                        on:click={() => (activeTab = "assigned")}
                    >
                        <span class="hidden lg:inline">Assigned videos</span>
                        <span class="lg:hidden">Assigned</span>
                        <span
                            class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium"
                        >
                            {videoCount.assigned}
                        </span>
                        {#if activeTab === "assigned"}
                            <div
                                class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"
                            ></div>
                        {/if}
                    </button>
                </div>
                <!-- Sort and Create Course Section - Desktop -->
                <div
                    class="hidden lg:flex items-center gap-4 absolute right-0 top-[-8px] h-full"
                >
                    <!-- Sort Dropdown -->
                    <div class="sort-dropdown relative">
                        <button
                            class="h-[42px] px-4 py-2 bg-black/5 dark:bg-white/10 rounded-lg justify-start items-center gap-[17px] inline-flex"
                            on:click|stopPropagation={() =>
                                (showSortDropdown = !showSortDropdown)}
                        >
                            <div
                                class="text-light-text-secondary dark:text-dark-text-secondary"
                            >
                                Sort by
                            </div>
                            <div data-svg-wrapper class="relative">
                                <svg
                                    class="text-light-text-primary dark:text-dark-text-primary"
                                    width="16"
                                    height="27"
                                    viewBox="0 0 16 27"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 10.5C12 10.5 9.05403 6.50001 7.99997 6.5C6.9459 6.49999 4 10.5 4 10.5"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                    <path
                                        d="M12 16.5C12 16.5 9.05403 20.5 7.99997 20.5C6.9459 20.5 4 16.5 4 16.5"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </div>
                        </button>

                        {#if showSortDropdown}
                            <div
                                class="absolute right-0 mt-2 w-48 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-light-border dark:border-dark-border z-50"
                            >
                                <button
                                    class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption ===
                                    'newest'
                                        ? 'bg-black/5 dark:bg-white/10'
                                        : ''}"
                                    on:click={() => handleSortSelect("newest")}
                                >
                                    <span>Newest</span>
                                    {#if sortOption === "newest"}
                                        <svg
                                            class="w-4 h-4 text-Green dark:text-TransparentGreen2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    {/if}
                                </button>
                                <button
                                    class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption ===
                                    'oldest'
                                        ? 'bg-black/5 dark:bg-white/10'
                                        : ''}"
                                    on:click={() => handleSortSelect("oldest")}
                                >
                                    <span>Oldest</span>
                                    {#if sortOption === "oldest"}
                                        <svg
                                            class="w-4 h-4 text-Green dark:text-TransparentGreen2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                                stroke-width="2"
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    {/if}
                                </button>
                            </div>
                        {/if}
                    </div>

                    <!-- Add Video Button -->
                    <button
                        class="flex items-center gap-2 px-2 pl-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
                        on:click={handleUploadVideo}
                    >
                        <span class="text-body">Add video</span>
                        <img
                            src="/icons/BoxArrowUp.svg"
                            alt="Create"
                            class="w-6 h-6"
                        />
                    </button>
                </div>
            </div>
        </div>

        <!-- Sort and Upload Button - Mobile -->
        <div class="flex lg:hidden items-center justify-end gap-4 mt-4">
            <!-- Sort Dropdown -->
            <div class="sort-dropdown relative">
                <button
                    class="h-[42px] px-4 py-2 bg-black/5 dark:bg-white/10 rounded-lg justify-start items-center gap-[17px] inline-flex"
                    on:click|stopPropagation={() =>
                        (showSortDropdown = !showSortDropdown)}
                >
                    <div
                        class="text-light-text-secondary dark:text-dark-text-secondary"
                    >
                        Sort by
                    </div>
                    <div data-svg-wrapper class="relative">
                        <svg
                            class="text-black dark:text-white"
                            width="16"
                            height="27"
                            viewBox="0 0 16 27"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M12 10.5C12 10.5 9.05403 6.50001 7.99997 6.5C6.9459 6.49999 4 10.5 4 10.5"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M12 16.5C12 16.5 9.05403 20.5 7.99997 20.5C6.9459 20.5 4 16.5 4 16.5"
                                stroke="currentColor"
                                stroke-width="1.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </div>
                </button>

                {#if showSortDropdown}
                    <div
                        class="absolute right-0 mt-2 w-48 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-light-border dark:border-dark-border z-50"
                    >
                        <button
                            class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption ===
                            'newest'
                                ? 'bg-black/5 dark:bg-white/10'
                                : ''}"
                            on:click={() => handleSortSelect("newest")}
                        >
                            <span>Newest</span>
                            {#if sortOption === "newest"}
                                <svg
                                    class="w-4 h-4 text-Green dark:text-TransparentGreen2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            {/if}
                        </button>
                        <button
                            class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption ===
                            'oldest'
                                ? 'bg-black/5 dark:bg-white/10'
                                : ''}"
                            on:click={() => handleSortSelect("oldest")}
                        >
                            <span>Oldest</span>
                            {#if sortOption === "oldest"}
                                <svg
                                    class="w-4 h-4 text-Green dark:text-TransparentGreen2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            {/if}
                        </button>
                    </div>
                {/if}
            </div>

            <!-- Add Video Button -->
            <button
                class="flex items-center gap-2 px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
                on:click={handleUploadVideo}
            >
                <span class="text-body text-nowrap">Add video</span>
                <img src="/icons/BoxArrowUp.svg" alt="Create" class="w-6 h-6" />
            </button>
        </div>
    </div>

    <!-- Selection Toolbar - Only shown when videos are selected -->
    {#if selectMode && selectedCount > 0}
        <div class="w-full py-4 mb-6">
            <div
                class="container mx-auto flex flex-wrap gap-4 items-center justify-between"
            >
                <div class="flex flex-wrap gap-4">
                    <button
                        class="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors flex items-center gap-2"
                        on:click={createNewCourse}
                    >
                        <span>Create New Course</span>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M8 1V15"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <path
                                d="M1 8H15"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    </button>

                    <button
                        class="px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors flex items-center gap-2"
                        on:click={addToExistingCourse}
                    >
                        <span>Add to Existing Course</span>
                        <img
                            src="/icons/FolderPlus.svg"
                            alt="Add to Existing Course"
                            class="w-6 h-6"
                        />
                    </button>

                    <button
                        class="px-4 py-2 bg-black/5 dark:bg-white/10 text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-black/5 dark:bg-white/20 transition-colors flex items-center gap-2"
                        on:click={assignVideos}
                    >
                        <span>Assign</span>
                        <svg
                            class="text-light-text-primary dark:text-dark-text-primary"
                            width="24"
                            height="25"
                            viewBox="0 0 24 25"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <g id="UserPlus">
                                <path
                                    id="Vector"
                                    d="M24 13.2537C24 13.4527 23.921 13.6434 23.7803 13.7841C23.6397 13.9247 23.4489 14.0037 23.25 14.0037H21.75V15.5037C21.75 15.7027 21.671 15.8934 21.5303 16.0341C21.3897 16.1747 21.1989 16.2537 21 16.2537C20.8011 16.2537 20.6103 16.1747 20.4697 16.0341C20.329 15.8934 20.25 15.7027 20.25 15.5037V14.0037H18.75C18.5511 14.0037 18.3603 13.9247 18.2197 13.7841C18.079 13.6434 18 13.4527 18 13.2537C18 13.0548 18.079 12.8641 18.2197 12.7234C18.3603 12.5828 18.5511 12.5037 18.75 12.5037H20.25V11.0037C20.25 10.8048 20.329 10.6141 20.4697 10.4734C20.6103 10.3328 20.8011 10.2537 21 10.2537C21.1989 10.2537 21.3897 10.3328 21.5303 10.4734C21.671 10.6141 21.75 10.8048 21.75 11.0037V12.5037H23.25C23.4489 12.5037 23.6397 12.5828 23.7803 12.7234C23.921 12.8641 24 13.0548 24 13.2537ZM18.5747 18.7709C18.7027 18.9234 18.765 19.1204 18.7478 19.3187C18.7305 19.517 18.6352 19.7004 18.4828 19.8284C18.3304 19.9565 18.1334 20.0187 17.935 20.0015C17.7367 19.9843 17.5534 19.889 17.4253 19.7366C15.5391 17.4903 12.9459 16.2537 10.125 16.2537C7.30406 16.2537 4.71094 17.4903 2.82469 19.7366C2.69664 19.8889 2.51334 19.984 2.3151 20.0012C2.11687 20.0183 1.91995 19.956 1.76766 19.828C1.61536 19.6999 1.52018 19.5166 1.50304 19.3184C1.48589 19.1202 1.5482 18.9232 1.67625 18.7709C3.07688 17.1041 4.81875 15.92 6.75469 15.2862C5.57897 14.554 4.67374 13.4587 4.17594 12.1661C3.67814 10.8736 3.61486 9.45403 3.99567 8.1223C4.37649 6.79057 5.18067 5.61909 6.28657 4.7851C7.39246 3.95112 8.73989 3.5 10.125 3.5C11.5101 3.5 12.8575 3.95112 13.9634 4.7851C15.0693 5.61909 15.8735 6.79057 16.2543 8.1223C16.6351 9.45403 16.5719 10.8736 16.0741 12.1661C15.5763 13.4587 14.671 14.554 13.4953 15.2862C15.4312 15.92 17.1731 17.1041 18.5747 18.7709ZM10.125 14.7537C11.0892 14.7537 12.0317 14.4678 12.8334 13.9322C13.6351 13.3965 14.2599 12.6351 14.6289 11.7443C14.9979 10.8535 15.0944 9.87334 14.9063 8.92768C14.7182 7.98203 14.2539 7.11338 13.5721 6.4316C12.8904 5.74982 12.0217 5.28552 11.0761 5.09742C10.1304 4.90932 9.15021 5.00586 8.25942 5.37484C7.36863 5.74381 6.60726 6.36866 6.07159 7.17034C5.53591 7.97203 5.25 8.91457 5.25 9.87875C5.25149 11.1712 5.76558 12.4103 6.6795 13.3243C7.59342 14.2382 8.83253 14.7523 10.125 14.7537Z"
                                    fill="currentcolor"
                                />
                            </g>
                        </svg>
                    </button>

                    <button
                        class="p-2 text-light-text-primary dark:text-dark-text-primary rounded-full bg-black/5 dark:bg-white/20 transition-colors"
                        on:click={deleteVideos}
                    >
                        <img
                            src="/icons/Trash.svg"
                            alt="Delete"
                            class="w-6 h-6"
                        />
                    </button>
                </div>

                <div
                    class="flex items-center gap-2 bg-brand-red/5 rounded-full pl-4 px-2 py-2"
                >
                    <span class="text-brand-red text-body"
                        >{selectedCount} video{selectedCount !== 1 ? "s" : ""} selected</span
                    >
                    <button
                        class=" text-light-text-primary dark:text-dark-text-primary hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors"
                        on:click={cancelSelection}
                    >
                        <img src="/icons/X.svg" alt="Cancel" class="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Main Content Area with Sidebar and Video Grid -->
    <div class="flex gap-6">
        <!-- Left Sidebar - Tags Section (Desktop only) -->
        <div class="hidden lg:block">
            <TagsSidebar 
                {availableTags}
                {tagVideos}
                onTagDeleted={fetchVideos}
            />
        </div>

        <!-- Video Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {#if loading}
                {#each Array(6) as _}
                    <div class="animate-pulse">
                        <div class="w-full h-[390px] bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-[14px]"></div>
                    </div>
                {/each}
            {:else if error}
                <div class="col-span-full text-center py-8">
                    <p class="text-light-text-secondary dark:text-dark-text-secondary">Error loading videos. Please try again.</p>
                </div>
            {:else if displayedVideos.length === 0}
                <div class="col-span-full text-center py-8">
                    <p class="text-light-text-secondary dark:text-dark-text-secondary text-body">No videos found matching your filters.</p>
                </div>
            {:else}
                {#each displayedVideos as video}
                    <VideoLibraryCard
                        title={video.title}
                        description={video.summary}
                        date={new Date(video.publishedAt).toLocaleDateString()}
                        duration="25 min"
                        thumbnailUrl={video.thumbnailUrl}
                        selectable={selectMode}
                        selected={selectedVideos.has(video.videoId)}
                        onClick={() => handleVideoClick(video.videoId)}
                        onOptionsClick={(e) => handleOptionsClick(e)}
                        onSelect={(selected) => handleVideoSelect(video.videoId, selected)}
                    />
                {/each}
            {/if}
        </div>
    </div>
</div>

<!-- Options Menu -->
{#if showOptionsMenu}
    <div
        class="options-menu fixed z-50 bg-light-bg-primary dark:bg-dark-bg-primary shadow-lg rounded-md border border-light-border dark:border-dark-border"
        style="left: {optionsMenuPosition.x}px; top: {optionsMenuPosition.y}px;"
    >
        <ul class="w-48 py-2">
            <li>
                <button
                    class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                    on:click={enterSelectMode}
                >
                    Select
                </button>
            </li>
            <li>
                <button
                    class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary"
                    on:click={selectAllVideos}
                >
                    Select All
                </button>
            </li>
            <li>
                <button
                    class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary flex items-center justify-between"
                    on:click={showInsights}
                >
                    <span>Insight</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21.75 19.5C21.75 19.6989 21.671 19.8897 21.5303 20.0303C21.3897 20.171 21.1989 20.25 21 20.25H3C2.80109 20.25 2.61032 20.171 2.46967 20.0303C2.32902 19.8897 2.25 19.6989 2.25 19.5V4.5C2.25 4.30109 2.32902 4.11032 2.46967 3.96967C2.61032 3.82902 2.80109 3.75 3 3.75C3.19891 3.75 3.38968 3.82902 3.53033 3.96967C3.67098 4.11032 3.75 4.30109 3.75 4.5V13.3472L8.50594 9.1875C8.63536 9.07421 8.79978 9.00885 8.97165 9.00236C9.14353 8.99587 9.31241 9.04866 9.45 9.15188L14.9634 13.2872L20.5059 8.4375C20.5786 8.36556 20.6652 8.30925 20.7605 8.27201C20.8557 8.23478 20.9575 8.21741 21.0597 8.22097C21.1619 8.22454 21.2623 8.24896 21.3547 8.29275C21.4471 8.33653 21.5296 8.39875 21.5971 8.47558C21.6645 8.5524 21.7156 8.64222 21.7471 8.7395C21.7786 8.83678 21.7899 8.93948 21.7802 9.04128C21.7706 9.14307 21.7402 9.24182 21.691 9.33146C21.6418 9.42109 21.5748 9.49972 21.4941 9.5625L15.4941 14.8125C15.3646 14.9258 15.2002 14.9912 15.0283 14.9976C14.8565 15.0041 14.6876 14.9513 14.55 14.8481L9.03656 10.7147L3.75 15.3403V18.75H21C21.1989 18.75 21.3897 18.829 21.5303 18.9697C21.671 19.1103 21.75 19.3011 21.75 19.5Z" fill="#2A4D61"/>
                      </svg>
                </button>
            </li>
        </ul>
    </div>
{/if}

<!-- Add Video Modal -->
{#if showAddVideoModal}
    <AddVideoModal
        onClose={() => (showAddVideoModal = false)}
        onVideoAdded={handleVideoAdded}
    />
{/if}

<!-- Create Course Modal -->
{#if showCreateCourseModal}
    <CreateCourseModal
        bind:showModal={showCreateCourseModal}
        videos={createCourseVideos}
        on:close={() => {
            showCreateCourseModal = false;
            createCourseVideos = [];
            // Clear selection after course creation
            selectedVideos.clear();
            selectedVideos = new Set(selectedVideos);
            selectMode = false;
            hasSelectionOccurred = false;
        }}
        on:courseCreated={() => {
            // Course creation complete - CourseReadyModal will be shown
        }}
    />
{/if}
