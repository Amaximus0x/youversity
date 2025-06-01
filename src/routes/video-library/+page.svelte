<script lang="ts">
    import { onMount } from "svelte";
    import { user } from "$lib/stores/auth";
    import VideoLibraryCard from "$lib/components/VideoLibraryCard.svelte";
    import { goto } from "$app/navigation";
    import { get } from "svelte/store";

    // Mock data for videos - would be replaced with actual data fetching
    const savedVideos = [
        {
            id: "1",
            title: "Coding for Everyone: The Foundations of Web Development",
            description:
                "Start your programming journey by learning HTML, CSS, and JavaScript to build functional and interactive websites.",
            date: "10th May 2025",
            duration: "25 min",
        },
        {
            id: "2",
            title: "Coding for Everyone: The Foundations of Web Development",
            description:
                "Start your programming journey by learning HTML, CSS, and JavaScript to build functional and interactive websites.",
            date: "10th May 2025",
            duration: "25 min",
        },
        {
            id: "3",
            title: "Coding for Everyone: The Foundations of Web Development",
            description:
                "Start your programming journey by learning HTML, CSS, and JavaScript to build functional and interactive websites.",
            date: "10th May 2025",
            duration: "25 min",
        },
    ];

    const uploadedVideos = [
        {
            id: "4",
            title: "Coding for Everyone: The Foundations of Web Development",
            description:
                "Start your programming journey by learning HTML, CSS, and JavaScript to build functional and interactive websites.",
            date: "10th May 2025",
            duration: "25 min",
        },
        {
            id: "5",
            title: "Coding for Everyone: The Foundations of Web Development",
            description:
                "Start your programming journey by learning HTML, CSS, and JavaScript to build functional and interactive websites.",
            date: "10th May 2025",
            duration: "25 min",
        },
    ];

    const assignedVideos = [
        {
            id: "6",
            title: "Coding for Everyone: The Foundations of Web Development",
            description:
                "Start your programming journey by learning HTML, CSS, and JavaScript to build functional and interactive websites.",
            date: "10th May 2025",
            duration: "25 min",
        },
    ];

    // Mock data for tags
    const availableTags = [
        { id: "ai", name: "AI", count: 6 },
        { id: "design", name: "Design", count: 0 },
        { id: "finance", name: "Finance", count: 0 },
        { id: "health", name: "Health", count: 0 },
        { id: "crypto", name: "Crypto", count: 0 },
    ];

    let loading = false;
    let error: string | null = null;
    let activeTab: "saved" | "uploaded" | "assigned" = "saved";
    let showSortDropdown = false;
    let sortOption: "newest" | "oldest" = "newest";
    let displayedVideos = savedVideos;

    // Tag-related state
    let tagSearchQuery = "";
    let selectedTags = new Set<string>();
    let filteredTags = availableTags;
    let expandedTagId: string | null = null;

    // Selection related state
    let showOptionsMenu = false;
    let optionsMenuPosition = { x: 0, y: 0 };
    let selectMode = false;
    let selectedVideos = new Set<string>();
    let hasSelectionOccurred = false; // Track if any selection has occurred during this session

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

    // Function to handle sort option selection
    function handleSortSelect(option: "newest" | "oldest") {
        sortOption = option;
        showSortDropdown = false;
    }

    // Function to handle video upload
    function handleUploadVideo() {
        // Implement video upload functionality
        alert("Upload video functionality to be implemented");
    }

    // Function to handle video card click
    function handleVideoClick(id: string) {
        // When in select mode, clicking the card should select/deselect it
        if (selectMode) {
            toggleVideoSelection(id);
        } else {
            // Normal click behavior (e.g., play video)
            console.log(`Video ${id} clicked`);
        }
    }

    // Function to handle options menu click
    function handleOptionsClick(event: MouseEvent) {
        event.stopPropagation();
        const rect = (
            event.currentTarget as HTMLElement
        ).getBoundingClientRect();
        optionsMenuPosition = {
            x: rect.left,
            y: rect.bottom + window.scrollY,
        };
        showOptionsMenu = true;
    }

    // Function to enter select mode
    function enterSelectMode() {
        selectMode = true;
        hasSelectionOccurred = false; // Reset selection tracking when entering select mode
        showOptionsMenu = false;
    }

    // Function to select all videos
    function selectAllVideos() {
        displayedVideos.forEach((video) => {
            selectedVideos.add(video.id);
        });
        selectedVideos = selectedVideos; // Trigger reactivity
        hasSelectionOccurred = true; // Mark that selection has occurred
        showOptionsMenu = false;
        selectMode = true;
    }

    // Function to show insights
    function showInsights() {
        alert("Insights feature to be implemented");
        showOptionsMenu = false;
    }

    // Function to toggle selection of a video
    function toggleVideoSelection(id: string) {
        if (selectedVideos.has(id)) {
            selectedVideos.delete(id);
        } else {
            selectedVideos.add(id);
            hasSelectionOccurred = true; // Mark that selection has occurred
        }
        selectedVideos = new Set(selectedVideos); // Trigger reactivity
    }

    // Function to cancel selection mode
    function cancelSelection() {
        selectMode = false;
        hasSelectionOccurred = false; // Reset selection tracking
        selectedVideos.clear();
        selectedVideos = new Set(selectedVideos); // Trigger reactivity
    }

    // Function to toggle tag expansion
    function toggleTagExpansion(tagId: string) {
        if (expandedTagId === tagId) {
            expandedTagId = null; // Collapse if already expanded
        } else {
            expandedTagId = tagId; // Expand new tag
        }
    }

    // Placeholder for deleting a tag
    function handleDeleteTag(tagId: string) {
        alert(`Delete tag ${tagId} - functionality to be implemented.`);
        // Optionally, remove the tag from availableTags and collapse
        if (expandedTagId === tagId) {
            expandedTagId = null;
        }
        // Re-filter tags if it was removed from availableTags
        // availableTags = availableTags.filter(t => t.id !== tagId);
        // filteredTags = availableTags.filter(tag => tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()));
    }

    // Mock sub-items for the AI tag based on the screenshot
    const aiSubItems = [
        { id: 'vidSub1', title: 'Coding for Everyone...', thumb: '/images/videoCardThumb.png' },
        { id: 'vidSub2', title: 'Understanding AI...', thumb: '/images/videoCardThumb.png' },
        { id: 'vidSub3', title: 'Web3 and AI focu...', thumb: '/images/videoCardThumb.png' }
    ];

    // When all videos are deselected, exit selection mode only if selection has occurred previously
    $: if (selectMode && selectedCount === 0 && hasSelectionOccurred) {
        // This timeout prevents flickering during the selection/deselection process
        setTimeout(() => {
            if (selectedCount === 0) {
                selectMode = false;
                hasSelectionOccurred = false; // Reset selection tracking
            }
        }, 100);
    }

    // Filter tags based on search query
    $: filteredTags = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()),
    );

    // Functions for selected videos actions
    function createNewCourse() {
        alert(`Create new course with ${selectedVideos.size} videos`);
    }

    function addToExistingCourse() {
        alert(`Add ${selectedVideos.size} videos to existing course`);
    }

    function assignVideos() {
        alert(`Assign ${selectedVideos.size} videos`);
    }

    function deleteVideos() {
        alert(`Delete ${selectedVideos.size} videos`);
    }

    onMount(() => {
        // Add click outside listener
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    });

    // Reactive statement to determine which videos to display based on active tab
    $: {
        if (activeTab === "saved") {
            displayedVideos = [...savedVideos];
        } else if (activeTab === "uploaded") {
            displayedVideos = [...uploadedVideos];
        } else {
            displayedVideos = [...assignedVideos];
        }

        // Apply sorting if needed
        if (sortOption === "newest") {
            // Implement sorting logic here
        } else if (sortOption === "oldest") {
            // Implement sorting logic here
        }
    }

    // Video counts for tabs
    $: videoCount = {
        saved: savedVideos.length,
        uploaded: uploadedVideos.length,
        assigned: assignedVideos.length,
    };

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
                        'uploaded'
                            ? 'text-Green dark:text-TransparentGreen2 text-body-semibold'
                            : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
                        on:click={() => (activeTab = "uploaded")}
                    >
                        <span class="hidden lg:inline">Uploaded videos</span>
                        <span class="lg:hidden">Uploaded</span>
                        <span
                            class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium"
                        >
                            {videoCount.uploaded}
                        </span>
                        {#if activeTab === "uploaded"}
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

                    <!-- Upload Video Button -->
                    <button
                        class="flex items-center gap-2 px-2 pl-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
                        on:click={handleUploadVideo}
                    >
                        <span class="text-body">Upload video</span>
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

            <!-- Upload Video Button -->
            <button
                class="flex items-center gap-2 px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
                on:click={handleUploadVideo}
            >
                <span class="text-body text-nowrap">Upload video</span>
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
        <div class="hidden lg:block w-[172px] flex-shrink-0">
            <!-- Tags Search Bar -->
            <div class="relative mb-2">
                <input
                    type="text"
                    placeholder="Tags"
                    bind:value={tagSearchQuery}
                    class="w-full h-[29px] pl-2 pr-8 bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border rounded-lg text-semi-body text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:border-brand-red transition-colors"
                />
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        class="text-light-text-tertiary dark:text-dark-text-tertiary"
                    >
                        <path
                            d="M17.5 17.5L22 22"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <path
                            d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11Z"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>
            </div>

            <!-- Tags List -->
            <div class="space-y-1">
                {#each filteredTags as tag (tag.id)}
                    <div class="space-y-1">
                        <button
                            class="w-full h-[29px] flex items-center justify-between px-2 py-1 rounded-lg transition-colors {expandedTagId === tag.id ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
                            on:click={() => toggleTagExpansion(tag.id)}
                        >
                            <div class="flex items-center gap-2">
                                <img 
                                    src="/icons/CaretRight.svg" 
                                    alt="Dropdown" 
                                    class="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary transition-transform {expandedTagId === tag.id ? '' : 'rotate-[-90deg]'}" 
                                />
                                <span class="text-semi-body-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                                    {tag.name}
                                </span>
                            </div>

                            {#if expandedTagId === tag.id}
                                <button
                                    class="p-0.5 hover:bg-light-bg-primary dark:hover:bg-dark-bg-primary rounded transition-colors"
                                    on:click|stopPropagation={() => handleDeleteTag(tag.id)}
                                    aria-label="Delete tag"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 21" fill="none" class="text-light-text-tertiary dark:text-dark-text-tertiary">
                                        <path d="M16.875 4.25H13.75V3.625C13.75 3.12772 13.5525 2.65081 13.2008 2.29917C12.8492 1.94754 12.3723 1.75 11.875 1.75H8.125C7.62772 1.75 7.15081 1.94754 6.79917 2.29917C6.44754 2.65081 6.25 3.12772 6.25 3.625V4.25H3.125C2.95924 4.25 2.80027 4.31585 2.68306 4.43306C2.56585 4.55027 2.5 4.70924 2.5 4.875C2.5 5.04076 2.56585 5.19973 2.68306 5.31694C2.80027 5.43415 2.95924 5.5 3.125 5.5H3.75V16.75C3.75 17.0815 3.8817 17.3995 4.11612 17.6339C4.35054 17.8683 4.66848 18 5 18H15C15.3315 18 15.6495 17.8683 15.8839 17.6339C16.1183 17.3995 16.25 17.0815 16.25 16.75V5.5H16.875C17.0408 5.5 17.1997 5.43415 17.3169 5.31694C17.4342 5.19973 17.5 5.04076 17.5 4.875C17.5 4.70924 17.4342 4.55027 17.3169 4.43306C17.1997 4.31585 17.0408 4.25 16.875 4.25ZM8.75 13.625C8.75 13.7908 8.68415 13.9497 8.56694 14.0669C8.44973 14.1842 8.29076 14.25 8.125 14.25C7.95924 14.25 7.80027 14.1842 7.68306 14.0669C7.56585 13.9497 7.5 13.7908 7.5 13.625V8.625C7.5 8.45924 7.56585 8.30027 7.68306 8.18306C7.80027 8.06585 7.95924 8 8.125 8C8.29076 8 8.44973 8.06585 8.56694 8.18306C8.68415 8.30027 8.75 8.45924 8.75 8.625V13.625ZM12.5 13.625C12.5 13.7908 12.4342 13.9497 12.3169 14.0669C12.1997 14.1842 12.0408 14.25 11.875 14.25C11.7092 14.25 11.5503 14.1842 11.4331 14.0669C11.3158 13.9497 11.25 13.7908 11.25 13.625V8.625C11.25 8.45924 11.3158 8.30027 11.4331 8.18306C11.5503 8.06585 11.7092 8 11.875 8C12.0408 8 12.1997 8.06585 12.3169 8.18306C12.4342 8.30027 12.5 8.45924 12.5 8.625V13.625ZM12.5 4.25H7.5V3.625C7.5 3.45924 7.56585 3.30027 7.68306 3.18306C7.80027 3.06585 7.95924 3 8.125 3H11.875C12.0408 3 12.1997 3.06585 12.3169 3.18306C12.4342 3.30027 12.5 3.45924 12.5 3.625V4.25Z" fill="currentColor"/>
                                    </svg>
                                </button>
                            {/if}
                        </button>

                        {#if expandedTagId === tag.id}
                            <div class="ml-2 pl-2 space-y-1 py-1 border-l border-light-border dark:border-dark-border">
                                {#if tag.id === 'ai'}
                                    {#each aiSubItems as subItem (subItem.id)}
                                        <button class="w-full flex items-center gap-1.5 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-left">
                                            <img 
                                                src={subItem.thumb} 
                                                alt="Video thumbnail" 
                                                class="w-[23px] h-[15px] rounded object-cover flex-shrink-0" 
                                            />
                                            <span class="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium truncate">
                                                {subItem.title}
                                            </span>
                                        </button>
                                    {/each}
                                {:else}
                                    <div class="px-1 py-2">
                                        <span class="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                                            No videos for this tag yet.
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

        <!-- Video Grid -->
        <div class="flex-1 min-w-0">
            <div
                class="grid grid-cols-1 md:grid-cols-2 video-3col:grid-cols-3 gap-6"
            >
                <!-- Skeleton Loading -->
                {#if loading}
                    {#each Array(6) as _}
                        <div
                            class="w-full h-[390px] bg-light-bg-primary dark:bg-dark-bg-primary rounded-[14px] border border-light-border dark:border-dark-border overflow-hidden"
                        >
                            <!-- Thumbnail Skeleton -->
                            <div
                                class="relative w-full h-[148px] bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse"
                            >
                                <!-- Play Button Skeleton -->
                                <div
                                    class="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 animate-pulse"
                                />
                            </div>

                            <!-- Content Section -->
                            <div class="p-4 flex flex-col gap-4">
                                <!-- Title Skeleton -->
                                <div
                                    class="h-6 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg w-3/4 animate-pulse"
                                />

                                <div class="flex flex-col gap-2">
                                    <!-- Description Skeleton -->
                                    <div
                                        class="h-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded w-full animate-pulse"
                                    />
                                    <div
                                        class="h-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded w-3/4 animate-pulse"
                                    />

                                    <!-- Date & Duration Skeleton -->
                                    <div
                                        class="flex items-center justify-between mt-2"
                                    >
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-4 h-4 rounded bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse"
                                            />
                                            <div
                                                class="h-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded w-16 animate-pulse"
                                            />
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="h-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded w-24 animate-pulse"
                                            />
                                            <div
                                                class="w-4 h-4 rounded bg-light-bg-secondary dark:bg-dark-bg-secondary animate-pulse"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/each}
                {:else if displayedVideos.length === 0}
                    <div class="col-span-full text-center py-12">
                        <p
                            class="text-light-text-secondary dark:text-dark-text-secondary text-lg"
                        >
                            {#if activeTab === "saved"}
                                You haven't saved any videos yet.
                            {:else if activeTab === "uploaded"}
                                You haven't uploaded any videos yet.
                            {:else}
                                No assigned videos found.
                            {/if}
                        </p>
                    </div>
                {:else}
                    {#each displayedVideos as video (video.id)}
                        <VideoLibraryCard
                            title={video.title}
                            description={video.description}
                            date={video.date}
                            duration={video.duration}
                            onClick={() => handleVideoClick(video.id)}
                            onOptionsClick={handleOptionsClick}
                            selectable={selectMode}
                            selected={selectedVideos.has(video.id)}
                            onSelect={(selected) => {
                                if (selected) {
                                    selectedVideos.add(video.id);
                                    hasSelectionOccurred = true; // Mark that selection has occurred
                                } else {
                                    selectedVideos.delete(video.id);
                                }
                                selectedVideos = new Set(selectedVideos); // Trigger reactivity
                            }}
                        />
                    {/each}
                {/if}
            </div>
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
                    <svg
                        class="w-5 h-5"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M2 2L6 6M18 18L14 14M14 6L18 2M2 18L6 14M10 1V4M1 10H4M16 10H19M10 16V19"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </button>
            </li>
        </ul>
    </div>
{/if}
