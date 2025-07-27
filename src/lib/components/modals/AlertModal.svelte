<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { fade, scale } from 'svelte/transition';

    export let isOpen = false;
    export let title = '';
    export let message = '';
    export let type: 'info' | 'warning' | 'error' | 'success' | 'confirm' = 'info';
    export let confirmText = 'OK';
    export let cancelText = 'Cancel';
    export let showCancel = false;

    const dispatch = createEventDispatcher();

    function handleConfirm() {
        dispatch('confirm');
        isOpen = false;
    }

    function handleCancel() {
        dispatch('cancel');
        isOpen = false;
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handleCancel();
        }
    }

    // Get icon based on alert type
    function getIcon() {
        switch (type) {
            case 'success':
                return `<svg class="w-12 h-12 text-Green dark:text-TransparentGreen2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`;
            case 'warning':
                return `<svg class="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>`;
            case 'error':
                return `<svg class="w-12 h-12 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`;
            case 'confirm':
                return `<svg class="w-12 h-12 text-Blue dark:text-TransparentBlue2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`;
            default:
                return `<svg class="w-12 h-12 text-Blue dark:text-TransparentBlue2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`;
        }
    }

    // Get button colors based on type
    function getButtonClass(isPrimary: boolean) {
        if (isPrimary) {
            if (type === 'error' || type === 'confirm') {
                return 'bg-brand-red hover:bg-brand-red/90 text-white';
            }
            return 'bg-Green hover:bg-GreenHover text-white';
        } else {
            return 'bg-light-bg-secondary dark:bg-dark-bg-secondary hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary text-light-text-primary dark:text-dark-text-primary';
        }
    }
</script>

{#if isOpen}
    <!-- Backdrop -->
    <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        on:click={handleBackdropClick}
        transition:fade={{ duration: 200 }}
    >
        <!-- Modal -->
        <div
            class="bg-light-bg-primary dark:bg-dark-bg-primary rounded-2xl shadow-xl max-w-sm w-full mx-auto"
            transition:scale={{ duration: 200, start: 0.95 }}
            on:click|stopPropagation
        >
            <!-- Content -->
            <div class="p-6 text-center">
                <!-- Icon -->
                <div class="flex justify-center mb-4">
                    {@html getIcon()}
                </div>

                <!-- Title -->
                {#if title}
                    <h3 class="text-h3 text-light-text-primary dark:text-dark-text-primary mb-2">
                        {title}
                    </h3>
                {/if}

                <!-- Message -->
                <p class="text-body text-light-text-secondary dark:text-dark-text-secondary mb-6">
                    {message}
                </p>

                <!-- Buttons -->
                <div class="flex gap-3 {showCancel ? 'justify-center' : 'justify-center'}">
                    {#if showCancel}
                        <button
                            class="flex-1 px-4 py-2.5 rounded-lg text-body-semibold transition-colors {getButtonClass(false)}"
                            on:click={handleCancel}
                        >
                            {cancelText}
                        </button>
                    {/if}
                    <button
                        class="flex-1 px-4 py-2.5 rounded-lg text-body-semibold transition-colors {getButtonClass(true)}"
                        on:click={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}