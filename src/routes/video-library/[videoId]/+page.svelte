<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation'; // For navigation, e.g. upload button
  import AssignVideoModal from '$lib/components/AssignVideoModal.svelte'; // Import the modal

  // Mock data for the specific video being viewed
  const videoDetails = {
    id: '1',
    title: 'Coding for Everyone: The Foundations of Web Development and AI',
    description:
      "Mastering Motion Design: From Concept to Creation,' where creativity meets technology. In this comprehensive course, you will embark on a journey through the dynamic world of motion design, gaining hands-on experience and foundational knowledge necessary to bring your ideas to life. From the basics of animation principles to advanced techniques in software like Adobe After Effects, you\'ll learn to harness the power of typography, color, sound, and storytelling in your projects. Whether you aspire to create eye-catching social media content, engaging advertisements, or innovative animations, this course will equip you with the tools and insights to thrive in the ever-evolving field of motion design. Let\'s dive into the art of motion and start creating!",
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Example YouTube embed URL
  };

  // Mock data for tags sidebar - styled like the main video library page
  const availableTags = [
    { id: "ai", name: "AI", count: 3 }, // Count is for display consistency, actual meaning might differ
    { id: "crypto", name: "Crypto", count: 0 },
    { id: "design", name: "Design", count: 0 },
    { id: "finance", name: "Finance", count: 0 },
    { id: "health", name: "Health", count: 0 },
  ];

  // Mock sub-items for the AI tag, similar to main library page
  const aiSubItems = [
      { id: 'vidSub1', title: 'Coding for Everyone...', thumb: '/images/videoCardThumb.png' },
      { id: 'vidSub2', title: 'Understanding AI...', thumb: '/images/videoCardThumb.png' },
      { id: 'vidSub3', title: 'Web3 and AI focu...', thumb: '/images/videoCardThumb.png' }
  ];

  let currentVideoId: string | null = null;
  let expandedTagId: string | null = 'ai'; // Default 'AI' tag to be expanded
  let tagSearchQuery = "";
  let showAssignModal = false; // State for controlling modal visibility

  // For visual consistency with the main library page's tabs
  let activeTabForDisplay: 'saved' | 'uploaded' | 'assigned' = 'saved';
  // Mock counts for tab display. In a real app, this might reflect the category of the current video.
  const videoCountForDisplay = {
    saved: 1, // Assuming the current video is 'saved' for display purposes
    uploaded: 0,
    assigned: 0,
  };


  onMount(() => {
    currentVideoId = $page.params.videoId;
    // TODO: Fetch actual videoDetails based on currentVideoId
    // TODO: Fetch actual availableTags, their counts, and sub-items if applicable
    // TODO: Determine the actual activeTabForDisplay and videoCountForDisplay based on the current video's properties
  });

  function toggleTagExpansion(tagId: string) {
    expandedTagId = expandedTagId === tagId ? null : tagId;
  }

  function handleUploadVideo() {
    // TODO: Implement actual upload functionality or navigation
    alert("Upload video functionality to be implemented");
  }

  function handleDeleteTag(tagId: string) {
    // TODO: Implement actual tag deletion
    alert(`Delete tag ${tagId} - functionality to be implemented.`);
    if (expandedTagId === tagId) {
        expandedTagId = null;
    }
  }

  // Filter tags based on search query for the sidebar
  $: filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase()),
  );

  // Placeholder functions for action buttons under video
  function showInsights() { 
    // alert("Show insights for " + videoDetails.title);
    goto(`/video-library/video-insight/${currentVideoId}`);
  }
  function shareVideo() { alert("Share " + videoDetails.title); }
  function createNewCourseWithVideo() { alert("Create new course with " + videoDetails.title); }
  function addToExistingCourseWithVideo() { alert("Add " + videoDetails.title + " to existing course"); }
  function assignVideo() { 
    // alert("Assign " + videoDetails.title);
    showAssignModal = true; // Open the modal
  }
  function deleteVideo() { alert("Delete " + videoDetails.title); }

</script>

<!-- Overall page structure, p-6 for padding as seen in screenshots -->
<div class="min-h-screen text-light-text-primary dark:text-dark-text-primary">
  <div class="container mx-auto"> <!-- Container for max-width and centering -->

    <!-- Header Section (mimicking video-library/+page.svelte) -->
    <div class="mb-8">
      <h1 class="text-h2-mobile lg:text-h2 text-light-text-primary dark:text-dark-text-primary mb-4">
        Video Library
      </h1>
      <p class="text-light-text-tertiary dark:text-dark-text-tertiary text-semi-body lg:text-body">
        Access all your saved and uploaded videos. Organize, preview, and turn them into learning content with ease.
      </p>
    </div>

    <!-- Tabs and Upload Section (mimicking video-library/+page.svelte) -->
    <div class="mb-6">
      <div class="relative border-b border-light-border dark:border-dark-border">
        <!-- This container matches the one in +page.svelte's tabs section -->
        <div class="container lg:pl-4 max-w-auto">
          <!-- Tabs -->
          <div class="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto pb-1">
            <button
              class="pb-4 relative whitespace-nowrap {activeTabForDisplay === 'saved' ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
              on:click={() => activeTabForDisplay = 'saved'}
            >
              <span class="hidden lg:inline">Saved videos</span>
              <span class="lg:hidden">Saved</span>
              <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
                {videoCountForDisplay.saved}
              </span>
              {#if activeTabForDisplay === 'saved'}
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
              {/if}
            </button>
            <button
              class="pb-4 relative whitespace-nowrap {activeTabForDisplay === 'uploaded' ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
              on:click={() => activeTabForDisplay = 'uploaded'}
            >
              <span class="hidden lg:inline">Uploaded videos</span>
              <span class="lg:hidden">Uploaded</span>
              <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
                {videoCountForDisplay.uploaded}
              </span>
              {#if activeTabForDisplay === 'uploaded'}
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
              {/if}
            </button>
            <button
              class="pb-4 relative whitespace-nowrap {activeTabForDisplay === 'assigned' ? 'text-Green dark:text-TransparentGreen2 text-body-semibold' : 'text-light-text-tertiary dark:text-dark-text-tertiary text-body'}"
              on:click={() => activeTabForDisplay = 'assigned'}
            >
              <span class="hidden lg:inline">Assigned videos</span>
              <span class="lg:hidden">Assigned</span>
              <span class="ml-2 px-2 py-0.5 bg-Black/5 dark:bg-dark-bg-secondary rounded-full text-semibody-medium">
                {videoCountForDisplay.assigned}
              </span>
              {#if activeTabForDisplay === 'assigned'}
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-Green dark:bg-TransparentGreen2"></div>
              {/if}
            </button>
          </div>
          <!-- Add Video Button - Desktop -->
          <div class="hidden lg:flex items-center gap-4 absolute right-0 top-[-8px] h-full">
            <button
              class="flex items-center gap-2 px-2 pl-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
              on:click={handleUploadVideo}
            >
              <span class="text-body">Add video</span>
              <img src="/icons/BoxArrowUp.svg" alt="Add" class="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
      <!-- Add Video Button - Mobile -->
      <div class="flex lg:hidden items-center justify-end gap-4 mt-4">
         <button
            class="flex items-center gap-2 px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors"
            on:click={handleUploadVideo}
          >
            <span class="text-body text-nowrap">Add video</span>
            <img src="/icons/BoxArrowUp.svg" alt="Add" class="w-6 h-6" />
          </button>
      </div>
    </div>

    <!-- Main Content Area: Tags Sidebar + Single Video Details -->
    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Left Sidebar - Tags Section (mimicking video-library/+page.svelte sidebar) -->
      <div class="hidden lg:block w-[172px] flex-shrink-0 order-1">
        <div class="relative mb-2">
          <input
            type="text"
            placeholder="Tags"
            bind:value={tagSearchQuery}
            class="w-full h-[29px] pl-2 pr-8 bg-light-bg-primary dark:bg-dark-bg-primary border border-light-border dark:border-dark-border rounded-lg text-semi-body text-light-text-primary dark:text-dark-text-primary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:border-brand-red transition-colors"
          />
          <div class="absolute right-3 top-1/2 -translate-y-1/2">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-light-text-tertiary dark:text-dark-text-tertiary">
                <path d="M17.5 17.5L22 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
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

      <!-- Right Content: Video Player and Details -->
      <div class="flex-1 min-w-0 order-2 lg:order-2">
        <!-- Video Player -->
        <div class=" mb-8 h-[484px] rounded-3xl overflow-hidden shadow-lg bg-black">
          <iframe
            class="w-full h-full"
            src={videoDetails.videoUrl}
            title="YouTube video player for {videoDetails.title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>

        <!-- Video Title (actual title of the video) -->
        <h2 class="text-h3-mobile mb-8">{videoDetails.title}</h2>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center justify-between mb-6 gap-y-4"> <!-- Main row container -->
            <!-- Group 1: Insights & Share (Stays on the left) -->
            <div class="flex items-center gap-3">
                <button on:click={showInsights} class="px-3 py-2 bg-black/5 dark:bg-white/10 text-Green dark:text-Green2 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-semi-body">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-Green dark:text-Green2" viewBox="0 0 24 24" fill="none">
                        <path d="M21.75 19.5C21.75 19.6989 21.671 19.8897 21.5303 20.0303C21.3897 20.171 21.1989 20.25 21 20.25H3C2.80109 20.25 2.61032 20.171 2.46967 20.0303C2.32902 19.8897 2.25 19.6989 2.25 19.5V4.5C2.25 4.30109 2.32902 4.11032 2.46967 3.96967C2.61032 3.82902 2.80109 3.75 3 3.75C3.19891 3.75 3.38968 3.82902 3.53033 3.96967C3.67098 4.11032 3.75 4.30109 3.75 4.5V13.3472L8.50594 9.1875C8.63536 9.07421 8.79978 9.00885 8.97165 9.00236C9.14353 8.99587 9.31241 9.04866 9.45 9.15188L14.9634 13.2872L20.5059 8.4375C20.5786 8.36556 20.6652 8.30925 20.7605 8.27201C20.8557 8.23478 20.9575 8.21741 21.0597 8.22097C21.1619 8.22454 21.2623 8.24896 21.3547 8.29275C21.4471 8.33653 21.5296 8.39875 21.5971 8.47558C21.6645 8.5524 21.7156 8.64222 21.7471 8.7395C21.7786 8.83678 21.7899 8.93948 21.7802 9.04128C21.7706 9.14307 21.7402 9.24182 21.691 9.33146C21.6418 9.42109 21.5748 9.49972 21.4941 9.5625L15.4941 14.8125C15.3646 14.9258 15.2002 14.9912 15.0283 14.9976C14.8565 15.0041 14.6876 14.9513 14.55 14.8481L9.03656 10.7147L3.75 15.3403V18.75H21C21.1989 18.75 21.3897 18.829 21.5303 18.9697C21.671 19.1103 21.75 19.3011 21.75 19.5Z" fill="currentColor"/>
                        </svg>
                    Insights
                </button>
                <button on:click={shareVideo} class="px-3 py-2 bg-black/5 dark:bg-white/10 text-Green dark:text-Green2 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-semi-body">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-Green dark:text-Green2" viewBox="0 0 24 24" fill="none">
                        <path d="M21 6.5C21 8.15685 19.6569 9.5 18 9.5C16.3431 9.5 15 8.15685 15 6.5C15 4.84315 16.3431 3.5 18 3.5C19.6569 3.5 21 4.84315 21 6.5Z" stroke="currentcolor" stroke-width="1.5"/>
                        <path d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M21 17.5C21 19.1569 19.6569 20.5 18 20.5C16.3431 20.5 15 19.1569 15 17.5C15 15.8431 16.3431 14.5 18 14.5C19.6569 14.5 21 15.8431 21 17.5Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495" stroke="currentColor" stroke-width="1.5"/>
                      </svg>
                    Share
                </button>
            </div>

            <!-- Container for Right-Side Groups (Group 2 & Group 3) -->
            <div class="flex flex-wrap items-center gap-x-6 gap-y-3"> 
                <!-- Group 2: Course Actions -->
                <div class="flex items-center gap-3">
                    <button on:click={createNewCourseWithVideo} class="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-ButtonHover transition-colors flex items-center gap-2 text-semibody-medium">
                        Create New Course
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button on:click={addToExistingCourseWithVideo} class="px-4 py-2 bg-Green text-white rounded-lg hover:bg-GreenHover transition-colors flex items-center gap-2 text-semibody-medium">
                        Add to Existing Course
                        <img src="/icons/FolderPlus.svg" alt="Add to Existing Course" class="w-5 h-5" />
                    </button>
                </div>

                <!-- Group 3: Assign & Delete -->
                <div class="flex items-center gap-3">
                    <button on:click={assignVideo} class="px-3 py-2 bg-black/5 dark:bg-white/10 text-light-text-secondary dark:text-dark-text-secondary rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-semibody-medium">
                        Assign
                        <svg class="w-6 h-6 text-light-text-secondary  dark:text-dark-text-secondary"  viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="UserPlus"><path id="Vector" d="M24 13.2537C24 13.4527 23.921 13.6434 23.7803 13.7841C23.6397 13.9247 23.4489 14.0037 23.25 14.0037H21.75V15.5037C21.75 15.7027 21.671 15.8934 21.5303 16.0341C21.3897 16.1747 21.1989 16.2537 21 16.2537C20.8011 16.2537 20.6103 16.1747 20.4697 16.0341C20.329 15.8934 20.25 15.7027 20.25 15.5037V14.0037H18.75C18.5511 14.0037 18.3603 13.9247 18.2197 13.7841C18.079 13.6434 18 13.4527 18 13.2537C18 13.0548 18.079 12.8641 18.2197 12.7234C18.3603 12.5828 18.5511 12.5037 18.75 12.5037H20.25V11.0037C20.25 10.8048 20.329 10.6141 20.4697 10.4734C20.6103 10.3328 20.8011 10.2537 21 10.2537C21.1989 10.2537 21.3897 10.3328 21.5303 10.4734C21.671 10.6141 21.75 10.8048 21.75 11.0037V12.5037H23.25C23.4489 12.5037 23.6397 12.5828 23.7803 12.7234C23.921 12.8641 24 13.0548 24 13.2537ZM18.5747 18.7709C18.7027 18.9234 18.765 19.1204 18.7478 19.3187C18.7305 19.517 18.6352 19.7004 18.4828 19.8284C18.3304 19.9565 18.1334 20.0187 17.935 20.0015C17.7367 19.9843 17.5534 19.889 17.4253 19.7366C15.5391 17.4903 12.9459 16.2537 10.125 16.2537C7.30406 16.2537 4.71094 17.4903 2.82469 19.7366C2.69664 19.8889 2.51334 19.984 2.3151 20.0012C2.11687 20.0183 1.91995 19.956 1.76766 19.828C1.61536 19.6999 1.52018 19.5166 1.50304 19.3184C1.48589 19.1202 1.5482 18.9232 1.67625 18.7709C3.07688 17.1041 4.81875 15.92 6.75469 15.2862C5.57897 14.554 4.67374 13.4587 4.17594 12.1661C3.67814 10.8736 3.61486 9.45403 3.99567 8.1223C4.37649 6.79057 5.18067 5.61909 6.28657 4.7851C7.39246 3.95112 8.73989 3.5 10.125 3.5C11.5101 3.5 12.8575 3.95112 13.9634 4.7851C15.0693 5.61909 15.8735 6.79057 16.2543 8.1223C16.6351 9.45403 16.5719 10.8736 16.0741 12.1661C15.5763 13.4587 14.671 14.554 13.4953 15.2862C15.4312 15.92 17.1731 17.1041 18.5747 18.7709ZM10.125 14.7537C11.0892 14.7537 12.0317 14.4678 12.8334 13.9322C13.6351 13.3965 14.2599 12.6351 14.6289 11.7443C14.9979 10.8535 15.0944 9.87334 14.9063 8.92768C14.7182 7.98203 14.2539 7.11338 13.5721 6.4316C12.8904 5.74982 12.0217 5.28552 11.0761 5.09742C10.1304 4.90932 9.15021 5.00586 8.25942 5.37484C7.36863 5.74381 6.60726 6.36866 6.07159 7.17034C5.53591 7.97203 5.25 8.91457 5.25 9.87875C5.25149 11.1712 5.76558 12.4103 6.6795 13.3243C7.59342 14.2382 8.83253 14.7523 10.125 14.7537Z" fill="currentcolor"/></g></svg>
                    </button>
                    <button on:click={deleteVideo} class="p-2.5 bg-black/5 dark:bg-white/10 text-light-text-primary dark:text-dark-text-primary rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                        <img src="/icons/Trash.svg" alt="Delete" class="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Video Description -->
        <div class="text-body text-light-text-secondary dark:text-dark-text-secondary leading-relaxed prose dark:prose-invert max-w-none">
          {@html videoDetails.description}
        </div>
      </div>
    </div>

  </div>
</div> 

<AssignVideoModal bind:showModal={showAssignModal} on:close={() => showAssignModal = false} /> 