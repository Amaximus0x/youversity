<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let showModal: boolean;
  // Placeholder for the actual video link, would be passed as a prop or fetched
  export let videoLink: string = 'https://example.com/video/123'; 

  const dispatch = createEventDispatcher();

  let userInput = '';
  let selectedUsersToAssign: { id: string; name: string }[] = [];

  let linkCopiedMessageVisible = false;
  let copyLinkText = "Copy link";

  // Mock data for recently assigned users, including avatars
  const recentlyAssigned: {id: string, name: string, avatarUrl: string}[] = [
    { id: 'user1', name: 'Zeke432', avatarUrl: 'https://via.placeholder.com/24/FFA07A/000000?Text=Z' },
    { id: 'user2', name: 'Jane3324', avatarUrl: 'https://via.placeholder.com/24/98FB98/000000?Text=J' },
    { id: 'user3', name: 'Annie003', avatarUrl: 'https://via.placeholder.com/24/ADD8E6/000000?Text=A' },
    { id: 'user4', name: 'Blue105', avatarUrl: 'https://via.placeholder.com/24/FFFFE0/000000?Text=B' },
    { id: 'user5', name: 'Chris678', avatarUrl: 'https://via.placeholder.com/24/E0FFFF/000000?Text=C' }, // Added for scroll demo
  ];
  let showRecentlyAssigned = true;

  function closeModal() {
    dispatch('close');
  }

  async function copyLinkHandler() {
    if (!navigator.clipboard) {
      alert('Clipboard API not available');
      return;
    }
    try {
      await navigator.clipboard.writeText(videoLink);
      linkCopiedMessageVisible = true;
      setTimeout(() => {
        linkCopiedMessageVisible = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy link');
    }
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && userInput.trim() !== '') {
      event.preventDefault(); // Prevent form submission if inside one
      const newUser = { id: Date.now().toString(), name: userInput.trim() };
      // Check if user already selected by name (simple check, could be by ID if IDs are available for typed users)
      if (!selectedUsersToAssign.find(u => u.name.toLowerCase() === newUser.name.toLowerCase())) {
        selectedUsersToAssign = [...selectedUsersToAssign, newUser];
      }
      userInput = '';
    }
    if (event.key === 'Backspace' && userInput === '' && selectedUsersToAssign.length > 0) {
      selectedUsersToAssign = selectedUsersToAssign.slice(0, -1);
    }
  }

  function removeSelectedUser(userId: string) {
    selectedUsersToAssign = selectedUsersToAssign.filter(u => u.id !== userId);
  }

  function addRecentUserToSelection(userToAdd: { id: string; name: string; avatarUrl: string }) {
    const isAlreadySelected = selectedUsersToAssign.some(user => user.id === userToAdd.id);
    if (!isAlreadySelected) {
      selectedUsersToAssign = [...selectedUsersToAssign, { id: userToAdd.id, name: userToAdd.name }];
    }
  }

  function assignAction() {
    if (selectedUsersToAssign.length === 0) return;
    const userNames = selectedUsersToAssign.map(u => u.name).join(', ');
    alert(`Assigning video to: ${userNames}`);
    // TODO: Implement actual assignment logic
    // selectedUsersToAssign = []; // Optionally clear after assignment
  }

  function removeRecentAssignee(id: string) {
    alert(`Remove recent assignee ${id} - functionality to be implemented`);
  }

</script>

{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" on:click|self={closeModal}>
    <div class="bg-gradient-light dark:bg-gradient-dark p-4 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
      <!-- Header -->
      <div class="self-stretch pb-4 border-b border-light-border dark:border-dark-border flex justify-between items-center w-full mb-4">
        <div class="w-6 h-6"></div>
        <h2 class="flex-1 text-center text-light-text-primary dark:text-dark-text-primary text-base font-semibold leading-normal">Assign Video</h2>
        <button on:click={closeModal} class="text-brand-red hover:opacity-75 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
            <path d="M14.9994 15.5L9 9.5M9.00064 15.5L15 9.5" stroke="#FF0000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5C17.5228 22.5 22 18.0228 22 12.5Z" stroke="#FF0000" stroke-width="1.5"/>
          </svg>
        </button>
      </div>

      <!-- Copy Link / Link Copied! -->
      <div class="flex justify-center items-center w-full mb-4 h-8 min-h-[32px]"> 
        {#if linkCopiedMessageVisible}
          <div class="flex items-center justify-center px-3 py-1 border border-brand-red rounded-md bg-brand-red/5">
            <span class="text-brand-red text-xs font-medium">Link Copied!</span>
          </div>
        {:else}
          <button 
            on:click={copyLinkHandler}
            class="flex items-center gap-2 text-brand-red hover:underline text-xs font-normal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 21 21" fill="none">
              <path d="M19.25 7.394C19.2186 8.48201 18.7712 9.51658 18 10.2846L15.2851 13.001C14.8897 13.3986 14.4194 13.7138 13.9013 13.9283C13.3833 14.1429 12.8279 14.2526 12.2671 14.251H12.2632C11.693 14.2506 11.1285 14.1359 10.6033 13.9137C10.0781 13.6915 9.60274 13.3663 9.20532 12.9573C8.8079 12.5483 8.49648 12.0638 8.28945 11.5325C8.08242 11.0011 7.98398 10.4336 7.99996 9.86353C8.00462 9.69777 8.07494 9.54065 8.19544 9.42674C8.31595 9.31283 8.47677 9.25145 8.64253 9.25611C8.8083 9.26077 8.96541 9.33109 9.07933 9.4516C9.19324 9.57211 9.25462 9.73293 9.24996 9.89869C9.23858 10.3018 9.3081 10.703 9.45443 11.0788C9.60076 11.4545 9.82092 11.7971 10.1019 12.0863C10.3829 12.3755 10.719 12.6055 11.0903 12.7626C11.4617 12.9197 11.8608 13.0008 12.264 13.001C12.6604 13.002 13.053 12.9245 13.4193 12.7728C13.7855 12.6212 14.118 12.3984 14.3976 12.1174L17.1125 9.4026C17.6726 8.83541 17.9856 8.06966 17.9831 7.27252C17.9806 6.47538 17.6628 5.71161 17.0991 5.14794C16.5355 4.58428 15.7717 4.26651 14.9746 4.26401C14.1774 4.26152 13.4117 4.5745 12.8445 5.13463L11.9851 5.994C11.8669 6.10626 11.7096 6.16793 11.5466 6.16584C11.3837 6.16375 11.2279 6.09808 11.1127 5.98283C10.9974 5.86758 10.9318 5.71187 10.9297 5.54889C10.9276 5.38592 10.9893 5.22857 11.1015 5.11041L11.9609 4.25103C12.3574 3.85442 12.8281 3.53979 13.3462 3.32514C13.8643 3.11048 14.4196 3 14.9804 3C15.5412 3 16.0965 3.11048 16.6146 3.32514C17.1327 3.53979 17.6035 3.85442 18 4.25103C18.4106 4.66272 18.7332 5.15367 18.9481 5.69399C19.163 6.23432 19.2657 6.81272 19.25 7.394ZM9.01558 15.0057L8.15621 15.8651C7.87591 16.1473 7.54233 16.3709 7.17484 16.523C6.80735 16.6751 6.4133 16.7526 6.01558 16.751C5.41894 16.7506 4.83583 16.5732 4.33993 16.2415C3.84402 15.9097 3.45758 15.4384 3.22942 14.8872C3.00126 14.3359 2.94163 13.7293 3.05806 13.1441C3.17449 12.559 3.46175 12.0214 3.88355 11.5995L6.59371 8.88463C7.02057 8.45551 7.5666 8.16466 8.16089 8.04985C8.75517 7.93504 9.37025 8.00158 9.92623 8.24082C10.4822 8.48006 10.9534 8.88095 11.2786 9.39143C11.6039 9.9019 11.7681 10.4984 11.75 11.1034C11.7453 11.2691 11.8067 11.43 11.9206 11.5505C12.0345 11.671 12.1916 11.7413 12.3574 11.746C12.5231 11.7506 12.684 11.6892 12.8045 11.5753C12.925 11.4614 12.9953 11.3043 13 11.1385C13.015 10.5582 12.9119 9.9808 12.697 9.44147C12.4822 8.90213 12.1599 8.41208 11.75 8.00103C10.9493 7.20074 9.86363 6.75117 8.7316 6.75117C7.59957 6.75117 6.51388 7.20074 5.71324 8.00103L2.99996 10.7159C2.40326 11.3123 1.99677 12.0723 1.83184 12.8997C1.66691 13.7271 1.75096 14.5848 2.07336 15.3645C2.39575 16.1441 2.94203 16.8107 3.64315 17.28C4.34428 17.7493 5.16878 18.0002 6.01246 18.001C6.57329 18.0027 7.12888 17.893 7.64705 17.6784C8.16522 17.4639 8.63569 17.1487 9.03121 16.751L9.89058 15.8917C9.99173 15.7725 10.0446 15.6198 10.0387 15.4636C10.0328 15.3075 9.96863 15.1592 9.85881 15.048C9.74899 14.9368 9.60149 14.8708 9.44541 14.8629C9.28932 14.8551 9.13597 14.9061 9.01558 15.0057Z" fill="#EB434A"/>
            </svg>
            {copyLinkText}
          </button>
        {/if}
      </div>

      <!-- Input and Assign Button Row -->
      <div class="self-stretch flex items-start gap-2 mb-4">
        <div class="flex-1 min-h-[40px] flex flex-wrap items-center gap-2 p-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg-primary dark:bg-dark-bg-primary focus-within:border-brand-red focus-within:ring-1 focus-within:ring-brand-red">
          {#each selectedUsersToAssign as user (user.id)}
            <div class="flex items-center gap-1 bg-gray-200 dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary text-xs font-normal px-2 py-0.5 rounded-md">
              <span>{user.name}</span>
              <button on:click={() => removeSelectedUser(user.id)} class="text-gray-500 hover:text-brand-red text-sm leading-none -mr-1">
                &times;
              </button>
            </div>
          {/each}
          <input 
            type="text" 
            bind:value={userInput}
            on:keydown={handleInputKeydown}
            placeholder={selectedUsersToAssign.length === 0 ? 'Emails, Username' : ''} 
            class="flex-grow h-auto py-1 outline-none bg-transparent text-light-text-secondary dark:text-dark-text-secondary placeholder:text-light-text-tertiary dark:placeholder:text-dark-text-tertiary text-xs font-normal"
          />
        </div>
        <button 
          on:click={assignAction}
          disabled={selectedUsersToAssign.length === 0} 
          class="h-10 px-4 py-2 rounded-lg text-xs font-normal transition-colors whitespace-nowrap {selectedUsersToAssign.length > 0 ? 'bg-brand-red text-white hover:bg-brand-red/90' : 'bg-black/5 text-light-text-tertiary dark:bg-white/10 dark:text-dark-text-tertiary cursor-not-allowed'}"
        >
          Assign
        </button>
      </div>

      <!-- Recently Assigned Section -->
      <div class="self-stretch flex flex-col justify-start items-start gap-2 w-full">
        <div class="self-stretch flex justify-between items-center w-full mb-1">
          <button class="flex-1 text-left text-light-text-tertiary dark:text-dark-text-tertiary text-sm font-medium" on:click={() => showRecentlyAssigned = !showRecentlyAssigned}>
            Recently assigned
          </button>
          <button class="text-light-text-tertiary dark:text-dark-text-tertiary" on:click={() => showRecentlyAssigned = !showRecentlyAssigned}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform {showRecentlyAssigned ? '' : '-rotate-180'}">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          </button>
        </div>
        {#if showRecentlyAssigned}
          <div class="w-full pl-1 max-h-[116px] overflow-y-auto custom-scrollbar">
            {#if recentlyAssigned.length > 0}
              <ul class="space-y-2 pr-2">
                {#each recentlyAssigned as user (user.id)}
                  <li class="flex items-center justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary font-normal">
                    <button 
                      on:click={() => addRecentUserToSelection(user)} 
                      class="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 p-1 rounded-md w-full text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={selectedUsersToAssign.some(su => su.id === user.id)}
                    >
                      <img src={user.avatarUrl} alt={user.name} class="w-6 h-6 rounded-full object-cover">
                      <span>{user.name}</span>
                    </button>
                    <button 
                      on:click={() => removeRecentAssignee(user.id)} 
                      class="text-light-text-tertiary hover:text-brand-red dark:text-dark-text-tertiary dark:hover:text-brand-red transition-colors p-0.5 ml-2 flex-shrink-0 {selectedUsersToAssign.some(su => su.id === user.id) ? 'invisible' : ''}"
                      aria-label="Remove from recently assigned"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-xs text-light-text-tertiary dark:text-dark-text-tertiary font-normal">No recent assignments.</p>
            {/if}
          </div>
        {/if}
      </div>

    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent; 
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #FF0000; /* Red thumb */
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #cc0000; /* Darker red on hover */
  }
  /* For Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #FF0000 transparent; /* thumb and track */
  }
</style> 