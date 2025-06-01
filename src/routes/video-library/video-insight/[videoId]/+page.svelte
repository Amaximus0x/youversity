<script lang="ts">
    import { page } from "$app/stores";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation"; // For navigation

    // Mock data for the specific video being viewed
    // This would typically be fetched based on $page.params.videoId
    const videoDetails = {
        id: "1", // Should match currentVideoId or be fetched
        title: "Coding for Everyone: The Foundations of Web Development and AI",
        thumb: "/images/videoCardThumb.png", // Thumbnail for display
        // videoUrl and description might not be needed directly on this page but kept for consistency
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description:
            "Mastering Motion Design: From Concept to Creation,' where creativity meets technology...",
    };

    // Mock data for assignees - this is the new content for this page
    const assignees = [
        {
            id: "user1",
            name: "Zeke 839",
            progress: 30,
            quizScore: null,
            completionDate: null,
            time: null,
            status: "In Progress",
        },
        {
            id: "user2",
            name: "Wisdom 147",
            progress: 100,
            quizScore: 80,
            completionDate: "24/05/2025",
            time: "10:14 AM",
            status: "Completed",
        },
        {
            id: "user3",
            name: "Annabel 152",
            progress: 0,
            quizScore: null,
            completionDate: null,
            time: null,
            status: "Not started",
        },
        {
            id: "user4",
            name: "James 321",
            progress: 100,
            quizScore: null,
            completionDate: null,
            time: null,
            status: "Completed",
        },
    ];

    // Mock data for tags sidebar - styled like the main video library page
    const availableTags = [
        { id: "ai", name: "AI", count: 3 },
        { id: "crypto", name: "Crypto", count: 0 },
        { id: "design", name: "Design", count: 0 },
        { id: "finance", name: "Finance", count: 0 },
        { id: "health", name: "Health", count: 0 },
    ];

    // Mock sub-items for the AI tag
    const aiSubItems = [
        {
            id: "vidSub1",
            title: "Coding for Everyone...",
            thumb: "/images/videoCardThumb.png",
        },
        {
            id: "vidSub2",
            title: "Understanding AI...",
            thumb: "/images/videoCardThumb.png",
        },
        {
            id: "vidSub3",
            title: "Web3 and AI focu...",
            thumb: "/images/videoCardThumb.png",
        },
    ];

    let currentVideoId: string | null = null;
    let expandedTagId: string | null = "ai"; // Default 'AI' tag to be expanded
    let tagSearchQuery = "";

    // For visual consistency with the main library page's tabs
    // On this page, "Assigned" should likely be the active tab contextually
    let activeTabForDisplay: "saved" | "uploaded" | "assigned" = "assigned";
    const videoCountForDisplay = {
        // These counts might be for the overall library, not just this video
        saved: 6, // Example count from screenshot
        uploaded: 0, // Assuming 0 for now
        assigned: 3, // Example count from screenshot
    };

    onMount(() => {
        currentVideoId = $page.params.videoId;
        // TODO: Fetch actual videoDetails based on currentVideoId
        // TODO: Fetch actual assignees for this videoId
        // TODO: Fetch actual availableTags, their counts, and sub-items if applicable
        // TODO: The videoCountForDisplay might need to be fetched or passed if it's dynamic
    });

    function toggleTagExpansion(tagId: string) {
        expandedTagId = expandedTagId === tagId ? null : tagId;
    }

    function handleUploadVideo() {
        // This button is present in the header
        goto("/video-library/upload"); // Or wherever your upload page is
    }

    function goBackToVideoLibrary() {
        // Could go back to the main library or the specific video view page
        // For now, let's assume going back to the main library or previous page
        // If coming from videoId page: goto(`/video-library/${currentVideoId}`);
        // If always to main library: goto(`/video-library`);
        history.back();
    }

    function handleDeleteTag(tagId: string) {
        alert(`Delete tag ${tagId} - functionality to be implemented.`);
        if (expandedTagId === tagId) {
            expandedTagId = null;
        }
    }

    $: filteredTags = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()),
    );

    // Placeholder functions for new action buttons
    function assignSelectedVideo() {
        alert("Assign video: " + videoDetails.title);
    }
    function downloadVideo() {
        alert("Download video: " + videoDetails.title);
    }
</script>

<!-- Overall page structure -->
<div class="min-h-screen text-light-text-primary dark:text-dark-text-primary">
    <div class="container mx-auto">
        <!-- Header Section (mimicking video-library/+page.svelte and [videoId]/+page.svelte) -->
        <div class="mb-8">
            <h1
                class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary mb-4"
            >
                Video Library
            </h1>
            <p
                class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body lg:text-body"
            >
                Access all your saved and uploaded videos. Organize, preview,
                and turn them into learning content with ease.
            </p>
        </div>

        <!-- Tabs and Upload Section (mimicking video-library pages) -->
        <div class="mb-6">
            <div
                class="relative border-b border-light-border dark:border-dark-border"
            >
                <div class="container lg:pl-4 max-w-auto">
                    <!-- Tabs -->
                    <div
                        class="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-1"
                    >
                        <button
                            class="pb-4 relative whitespace-nowrap {activeTabForDisplay ===
                            'saved'
                                ? 'text-brand-red dark:text-brand-red text-body-semibold'
                                : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
                            on:click={() => (activeTabForDisplay = "saved")}
                        >
                            <span class="hidden lg:inline">Saved videos</span>
                            <span class="lg:hidden">Saved</span>
                            <span
                                class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium"
                            >
                                {videoCountForDisplay.saved}
                            </span>
                            {#if activeTabForDisplay === "saved"}
                                <div
                                    class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red dark:bg-brand-red"
                                ></div>
                            {/if}
                        </button>
                        <button
                            class="pb-4 relative whitespace-nowrap {activeTabForDisplay ===
                            'assigned'
                                ? 'text-brand-red dark:text-brand-red text-body-semibold'
                                : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
                            on:click={() => (activeTabForDisplay = "assigned")}
                        >
                            <span class="hidden lg:inline">Assigned videos</span
                            >
                            <span class="lg:hidden">Assigned</span>
                            <span
                                class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium"
                            >
                                {videoCountForDisplay.assigned}
                            </span>
                            {#if activeTabForDisplay === "assigned"}
                                <div
                                    class="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red dark:bg-brand-red"
                                ></div>
                            {/if}
                        </button>
                    </div>
                    <!-- Upload Video Button - Desktop -->
                    <div
                        class="hidden lg:flex items-center gap-4 absolute right-0 top-[-8px] h-full"
                    >
                        <button
                            class="flex items-center gap-2 px-2 pl-4 py-2 bg-brand-turquoise text-white rounded-lg hover:bg-brand-turquoise/90 transition-colors"
                            on:click={handleUploadVideo}
                        >
                            <span class="text-body">Upload video</span>
                            <img
                                src="/icons/BoxArrowUp.svg"
                                alt="Upload"
                                class="w-6 h-6"
                            />
                        </button>
                    </div>
                </div>
            </div>
            <!-- Upload Video Button - Mobile -->
            <div class="flex lg:hidden items-center justify-end gap-4 mt-4">
                <button
                    class="flex items-center gap-2 px-4 py-2 bg-brand-turquoise text-white rounded-lg hover:bg-brand-turquoise/90 transition-colors"
                    on:click={handleUploadVideo}
                >
                    <span class="text-body text-nowrap">Upload video</span>
                    <img
                        src="/icons/BoxArrowUp.svg"
                        alt="Upload"
                        class="w-6 h-6"
                    />
                </button>
            </div>
        </div>

        <!-- Main Content Area: Tags Sidebar + Video Insight Content -->
        <div class="flex flex-col lg:flex-row gap-6">
            <!-- Left Sidebar - Tags Section (mimicking video-library pages) -->
            <div class="hidden lg:block w-[172px] flex-shrink-0 order-1">
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
                <div class="space-y-1">
                    {#each filteredTags as tag (tag.id)}
                        <div class="space-y-1">
                            <button
                                class="w-full h-[29px] flex items-center justify-between px-2 py-1 rounded-lg transition-colors {expandedTagId ===
                                tag.id
                                    ? 'bg-black/5 dark:bg-white/10'
                                    : 'hover:bg-black/5 dark:hover:bg-white/10'}"
                                on:click={() => toggleTagExpansion(tag.id)}
                            >
                                <div class="flex items-center gap-2">
                                    <img
                                        src="/icons/CaretRight.svg"
                                        alt="Dropdown"
                                        class="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary transition-transform {expandedTagId ===
                                        tag.id
                                            ? 'rotate-90'
                                            : ''}"
                                    />
                                    <span
                                        class="text-semi-body-medium text-light-text-tertiary dark:text-dark-text-tertiary"
                                    >
                                        {tag.name}
                                    </span>
                                </div>
                                {#if expandedTagId === tag.id}
                                    <button
                                        class="p-0.5 hover:bg-light-bg-primary dark:hover:bg-dark-bg-primary rounded transition-colors"
                                        on:click|stopPropagation={() =>
                                            handleDeleteTag(tag.id)}
                                        aria-label="Delete tag"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 20 21"
                                            fill="none"
                                            class="text-light-text-tertiary dark:text-dark-text-tertiary"
                                        >
                                            <path
                                                d="M16.875 4.25H13.75V3.625C13.75 3.12772 13.5525 2.65081 13.2008 2.29917C12.8492 1.94754 12.3723 1.75 11.875 1.75H8.125C7.62772 1.75 7.15081 1.94754 6.79917 2.29917C6.44754 2.65081 6.25 3.12772 6.25 3.625V4.25H3.125C2.95924 4.25 2.80027 4.31585 2.68306 4.43306C2.56585 4.55027 2.5 4.70924 2.5 4.875C2.5 5.04076 2.56585 5.19973 2.68306 5.31694C2.80027 5.43415 2.95924 5.5 3.125 5.5H3.75V16.75C3.75 17.0815 3.8817 17.3995 4.11612 17.6339C4.35054 17.8683 4.66848 18 5 18H15C15.3315 18 15.6495 17.8683 15.8839 17.6339C16.1183 17.3995 16.25 17.0815 16.25 16.75V5.5H16.875C17.0408 5.5 17.1997 5.43415 17.3169 5.31694C17.4342 5.19973 17.5 5.04076 17.5 4.875C17.5 4.70924 17.4342 4.55027 17.3169 4.43306C17.1997 4.31585 17.0408 4.25 16.875 4.25ZM8.75 13.625C8.75 13.7908 8.68415 13.9497 8.56694 14.0669C8.44973 14.1842 8.29076 14.25 8.125 14.25C7.95924 14.25 7.80027 14.1842 7.68306 14.0669C7.56585 13.9497 7.5 13.7908 7.5 13.625V8.625C7.5 8.45924 7.56585 8.30027 7.68306 8.18306C7.80027 8.06585 7.95924 8 8.125 8C8.29076 8 8.44973 8.06585 8.56694 8.18306C8.68415 8.30027 8.75 8.45924 8.75 8.625V13.625ZM12.5 13.625C12.5 13.7908 12.4342 13.9497 12.3169 14.0669C12.1997 14.1842 12.0408 14.25 11.875 14.25C11.7092 14.25 11.5503 14.1842 11.4331 14.0669C11.3158 13.9497 11.25 13.7908 11.25 13.625V8.625C11.25 8.45924 11.3158 8.30027 11.4331 8.18306C11.5503 8.06585 11.7092 8 11.875 8C12.0408 8 12.1997 8.06585 12.3169 8.18306C12.4342 8.30027 12.5 8.45924 12.5 8.625V13.625ZM12.5 4.25H7.5V3.625C7.5 3.45924 7.56585 3.30027 7.68306 3.18306C7.80027 3.06585 7.95924 3 8.125 3H11.875C12.0408 3 12.1997 3.06585 12.3169 3.18306C12.4342 3.30027 12.5 3.45924 12.5 3.625V4.25Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    </button>
                                {/if}
                            </button>
                            {#if expandedTagId === tag.id}
                                <div
                                    class="ml-2 pl-2 space-y-1 py-1 border-l border-light-border dark:border-dark-border"
                                >
                                    {#if tag.id === "ai"}
                                        {#each aiSubItems as subItem (subItem.id)}
                                            <button
                                                class="w-full flex items-center gap-1.5 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-left"
                                            >
                                                <img
                                                    src={subItem.thumb}
                                                    alt="Video thumbnail"
                                                    class="w-[23px] h-[15px] rounded object-cover flex-shrink-0"
                                                />
                                                <span
                                                    class="text-xs text-light-text-secondary dark:text-dark-text-secondary font-medium truncate"
                                                >
                                                    {subItem.title}
                                                </span>
                                            </button>
                                        {/each}
                                    {:else}
                                        <div class="px-1 py-2">
                                            <span
                                                class="text-xs text-light-text-tertiary dark:text-dark-text-tertiary"
                                            >
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

            <!-- Right Content: Video Insight Details -->
            <div class="flex-1 min-w-0 order-2 lg:order-3">
                <!-- Video Info Bar (Back button, Thumbnail, Title, Assign, Download) -->
                <div class="flex justify-between mb-10">
                    <div class="flex items-start gap-2">
                        <button
                            on:click={goBackToVideoLibrary}
                            class=" hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                class="text-light-text-primary dark:text-dark-text-primary"
                            >
                                <path
                                    d="M3.99976 12H19.9997"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                                <path
                                    d="M8.99997 17C8.99997 17 4.00002 13.3176 4 12C3.99999 10.6824 9 7 9 7"
                                    stroke="currentColor"
                                    stroke-width="1.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </button>
                        <img
                            src={videoDetails.thumb}
                            alt="Video thumbnail"
                            class="w-[70px] h-[40px] lg:w-[105px] lg:h-[60px] rounded-md object-cover"
                        />
                        <h2
                            class="w-[438px] text-semibody-medium lg:text-body-semibold text-light-text-primary dark:text-dark-text-primary "
                            title={videoDetails.title}
                        >
                            {videoDetails.title}
                        </h2>
                    </div>
                    <div class="flex items-start gap-3">
                        <button
                            on:click={assignSelectedVideo}
                            class="px-3 py-2 bg-black/5 dark:bg-white/10 text-light-text-secondary dark:text-dark-text-secondary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-semibody-medium"
                        >
                            Assign
                            <svg
                                class="w-6 h-6"
                                viewBox="0 0 24 25"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path
                                    d="M24 13.2537C24 13.4527 23.921 13.6434 23.7803 13.7841C23.6397 13.9247 23.4489 14.0037 23.25 14.0037H21.75V15.5037C21.75 15.7027 21.671 15.8934 21.5303 16.0341C21.3897 16.1747 21.1989 16.2537 21 16.2537C20.8011 16.2537 20.6103 16.1747 20.4697 16.0341C20.329 15.8934 20.25 15.7027 20.25 15.5037V14.0037H18.75C18.5511 14.0037 18.3603 13.9247 18.2197 13.7841C18.079 13.6434 18 13.4527 18 13.2537C18 13.0548 18.079 12.8641 18.2197 12.7234C18.3603 12.5828 18.5511 12.5037 18.75 12.5037H20.25V11.0037C20.25 10.8048 20.329 10.6141 20.4697 10.4734C20.6103 10.3328 20.8011 10.2537 21 10.2537C21.1989 10.2537 21.3897 10.3328 21.5303 10.4734C21.671 10.6141 21.75 10.8048 21.75 11.0037V12.5037H23.25C23.4489 12.5037 23.6397 12.5828 23.7803 12.7234C23.921 12.8641 24 13.0548 24 13.2537ZM18.5747 18.7709C18.7027 18.9234 18.765 19.1204 18.7478 19.3187C18.7305 19.517 18.6352 19.7004 18.4828 19.8284C18.3304 19.9565 18.1334 20.0187 17.935 20.0015C17.7367 19.9843 17.5534 19.889 17.4253 19.7366C15.5391 17.4903 12.9459 16.2537 10.125 16.2537C7.30406 16.2537 4.71094 17.4903 2.82469 19.7366C2.69664 19.8889 2.51334 19.984 2.3151 20.0012C2.11687 20.0183 1.91995 19.956 1.76766 19.828C1.61536 19.6999 1.52018 19.5166 1.50304 19.3184C1.48589 19.1202 1.5482 18.9232 1.67625 18.7709C3.07688 17.1041 4.81875 15.92 6.75469 15.2862C5.57897 14.554 4.67374 13.4587 4.17594 12.1661C3.67814 10.8736 3.61486 9.45403 3.99567 8.1223C4.37649 6.79057 5.18067 5.61909 6.28657 4.7851C7.39246 3.95112 8.73989 3.5 10.125 3.5C11.5101 3.5 12.8575 3.95112 13.9634 4.7851C15.0693 5.61909 15.8735 6.79057 16.2543 8.1223C16.6351 9.45403 16.5719 10.8736 16.0741 12.1661C15.5763 13.4587 14.671 14.554 13.4953 15.2862C15.4312 15.92 17.1731 17.1041 18.5747 18.7709ZM10.125 14.7537C11.0892 14.7537 12.0317 14.4678 12.8334 13.9322C13.6351 13.3965 14.2599 12.6351 14.6289 11.7443C14.9979 10.8535 15.0944 9.87334 14.9063 8.92768C14.7182 7.98203 14.2539 7.11338 13.5721 6.4316C12.8904 5.74982 12.0217 5.28552 11.0761 5.09742C10.1304 4.90932 9.15021 5.00586 8.25942 5.37484C7.36863 5.74381 6.60726 6.36866 6.07159 7.17034C5.53591 7.97203 5.25 8.91457 5.25 9.87875C5.25149 11.1712 5.76558 12.4103 6.6795 13.3243C7.59342 14.2382 8.83253 14.7523 10.125 14.7537Z"
                                    fill="currentcolor"
                                /></svg
                            >
                        </button>
                        <button
                            on:click={downloadVideo}
                            class="px-3 py-2 bg-black/5 dark:bg-white/10 text-light-text-secondary dark:text-dark-text-secondary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-semibody-medium"
                        >
                            Download
                            <svg
                                class="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                ><path d="M21 13.5V19.5C21 19.6989 20.921 19.8897 20.7803 20.0303C20.6397 20.171 20.4489 20.25 20.25 20.25H3.75C3.55109 20.25 3.36032 20.171 3.21967 20.0303C3.07902 19.8897 3 19.6989 3 19.5V13.5C3 13.3011 3.07902 13.1103 3.21967 12.9697C3.36032 12.829 3.55109 12.75 3.75 12.75C3.94891 12.75 4.13968 12.829 4.28033 12.9697C4.42098 13.1103 4.5 13.3011 4.5 13.5V18.75H19.5V13.5C19.5 13.3011 19.579 13.1103 19.7197 12.9697C19.8603 12.829 20.0511 12.75 20.25 12.75C20.4489 12.75 20.6397 12.829 20.7803 12.9697C20.921 13.1103 21 13.3011 21 13.5ZM11.4694 14.0306C11.539 14.1004 11.6217 14.1557 11.7128 14.1934C11.8038 14.2312 11.9014 14.2506 12 14.2506C12.0986 14.2506 12.1962 14.2312 12.2872 14.1934C12.3783 14.1557 12.461 14.1004 12.5306 14.0306L16.2806 10.2806C16.3856 10.1757 16.4572 10.042 16.4861 9.89648C16.5151 9.75092 16.5003 9.60002 16.4435 9.46291C16.3867 9.32579 16.2904 9.20861 16.167 9.12621C16.0435 9.04381 15.8984 8.99988 15.75 9H12.75V3C12.75 2.80109 12.671 2.61032 12.5303 2.46967C12.3897 2.32902 12.1989 2.25 12 2.25C11.8011 2.25 11.6103 2.32902 11.4697 2.46967C11.329 2.61032 11.25 2.80109 11.25 3V9H8.25C8.10158 8.99988 7.95646 9.04381 7.83301 9.12621C7.70957 9.20861 7.61335 9.32579 7.55653 9.46291C7.49972 9.60002 7.48487 9.75092 7.51385 9.89648C7.54284 10.042 7.61437 10.1757 7.71937 10.2806L11.4694 14.0306Z" fill="currentColor"/>                                </svg
                            >
                        </button>
                    </div>
                </div>

                <!-- Assignee Table -->
                <div
                    class="overflow-hidden"
                >
                    <!-- Table Header -->
                    <div
                        class="grid grid-cols-12 gap-4 px-6 py-4 bg-Black/5 dark:bg-White/10 rounded-lg text-sm text-light-text-tertiary dark:text-dark-text-tertiary font-medium"
                    >
                        <div class="col-span-3">Assignee</div>
                        <div class="col-span-3">Progress</div>
                        <div class="col-span-2 text-center">Quiz score</div>
                        <div class="col-span-2 text-center">
                            Completion Date
                        </div>
                        <div class="col-span-2 text-center">Time</div>
                    </div>

                    <!-- Table Body -->
                    <div>
                        {#each assignees as assignee (assignee.id)}
                            <div
                                class="grid grid-cols-12 gap-4 px-6 py-5 items-center text-semi-body text-light-text-primary dark:text-dark-text-primary"
                            >
                                <div class="col-span-3">{assignee.name}</div>
                                <div class="col-span-3">
                                    {#if assignee.status === "Not started"}
                                        <span>Not started</span>
                                    {:else}
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
                                            >
                                                <div
                                                    class="bg-brand-turquoise h-2.5 rounded-full"
                                                    style="width: {assignee.progress}%"
                                                ></div>
                                            </div>
                                            <span
                                                class="text-xs text-light-text-secondary dark:text-dark-text-secondary"
                                                >{assignee.progress}%</span
                                            >
                                        </div>
                                    {/if}
                                </div>
                                <div class="col-span-2 text-center">
                                    {assignee.quizScore !== null
                                        ? assignee.quizScore
                                        : "--"}
                                </div>
                                <div class="col-span-2 text-center">
                                    {assignee.completionDate || "--"}
                                </div>
                                <div class="col-span-2 text-center">
                                    {assignee.time || "--"}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    /* Ensure the custom scrollbar styles from the main video library page are applied if needed */
    /* For Webkit browsers */
    ::-webkit-scrollbar {
        width: 8px; /* For vertical scrollbars */
        height: 8px; /* For horizontal scrollbars */
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: #ccc; /* A neutral color, adjust as needed */
        border-radius: 4px;
    }
    .dark ::-webkit-scrollbar-thumb {
        background: #555; /* Darker thumb for dark mode */
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #aaa;
    }
    .dark ::-webkit-scrollbar-thumb:hover {
        background: #777;
    }

    /* Hiding scrollbar from specific elements if directly applied */
    .hide-scrollbar::-webkit-scrollbar {
        display: none; /* For Webkit browsers */
    }
    .hide-scrollbar {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
    }

    /* Ensure Poppins is applied if it's the primary font */
    body {
        font-family: "Poppins", sans-serif;
    }
</style>
