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

    let loading = false;
    let error: string | null = null;
    let activeTab: "saved" | "uploaded" | "assigned" = "saved";
    let showSortDropdown = false;
    let sortOption: "newest" | "oldest" = "newest";
    let displayedVideos = savedVideos;

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
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        optionsMenuPosition = {
            x: rect.left,
            y: rect.bottom + window.scrollY
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
        displayedVideos.forEach(video => {
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
            Access all your saved and uploaded videos. Organize, preview, and turn them into learning content with ease.
        </p>
    </div>

    <!-- Tabs and Sort Section -->
    <div class="mb-6">
        <!-- Border container that spans full width -->
        <div
            class="relative border-b border-light-border dark:border-dark-border"
        >
            <div class="container max-w-auto">
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
        <div class="hidden lg:flex items-center gap-4 absolute right-0 top-[-8px]   h-full ">
            <!-- Sort Dropdown -->
            <div class="sort-dropdown relative">
              <button 
                class="h-[42px] px-4 py-2 bg-black/5 dark:bg-white/10 rounded-lg justify-start items-center gap-[17px] inline-flex"
                on:click|stopPropagation={() => showSortDropdown = !showSortDropdown}
              >
                <div class="text-light-text-secondary dark:text-dark-text-secondary">Sort by</div>
                <div data-svg-wrapper class="relative">
                  <svg class="text-light-text-primary dark:text-dark-text-primary" width="16" height="27" viewBox="0 0 16 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 10.5C12 10.5 9.05403 6.50001 7.99997 6.5C6.9459 6.49999 4 10.5 4 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 16.5C12 16.5 9.05403 20.5 7.99997 20.5C6.9459 20.5 4 16.5 4 16.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>
  
              {#if showSortDropdown}
                <div class="absolute right-0 mt-2 w-48 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-light-border dark:border-dark-border z-50">
                  <button
                    class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption === 'newest' ? 'bg-black/5 dark:bg-white/10' : ''}"
                    on:click={() => handleSortSelect('newest')}
                  >
                    <span>Newest</span>
                    {#if sortOption === 'newest'}
                      <svg class="w-4 h-4 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    {/if}
                  </button>
                  <button
                    class="w-full px-4 py-2 text-left text-light-text-primary dark:text-dark-text-primary hover:bg-light-bg-secondary dark:hover:bg-dark-bg-secondary transition-colors flex items-center justify-between {sortOption === 'oldest' ? 'bg-black/5 dark:bg-white/10' : ''}"
                    on:click={() => handleSortSelect('oldest')}
                  >
                    <span>Oldest</span>
                    {#if sortOption === 'oldest'}
                      <svg class="w-4 h-4 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
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
              <img src="/icons/BoxArrowUp.svg" alt="Create" class="w-6 h-6" />
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
    <div class="w-full py-4  mb-6">
        <div class="container mx-auto flex flex-wrap gap-4 items-center justify-between">
            <div class="flex flex-wrap gap-4">
                <button 
                    class="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors flex items-center gap-2"
                    on:click={createNewCourse}
                >
                    <span>Create New Course</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 1V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                
                <button
                    class="px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors flex items-center gap-2"
                    on:click={addToExistingCourse}
                >
                    <span>Add to Existing Course</span>
                    <img src="/icons/FolderPlus.svg" alt="Add to Existing Course" class="w-6 h-6" />
                </button>
                
                <button
                    class="px-4 py-2 bg-black/5 dark:bg-white/10 text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-black/5 dark:hover:bg-white/20 transition-colors flex items-center gap-2"
                    on:click={assignVideos}
                >
                    <span>Assign</span>
                    <img src="/icons/UserPlus.svg" alt="Assign" class="w-6 h-6" />
                </button>
                
                <button
                    class="p-2 text-light-text-primary dark:text-dark-text-primary rounded-full bg-black/5 dark:bg-white/20 transition-colors"
                    on:click={deleteVideos}
                >
                    <img src="/icons/Trash.svg" alt="Delete" class="w-6 h-6" />
                </button>
            </div>
            
            <div class="flex items-center gap-2 bg-brand-red/5 rounded-full pl-4 px-2 py-2">
                <span class="text-brand-red text-body">{selectedCount} video{selectedCount !== 1 ? 's' : ''} selected</span>
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

    <!-- Video Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 video-3col:grid-cols-3 gap-6">
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
                            <div class="flex items-center justify-between mt-2">
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
                <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L6 6M18 18L14 14M14 6L18 2M2 18L6 14M10 1V4M1 10H4M16 10H19M10 16V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </li>
    </ul>
</div>
{/if}
