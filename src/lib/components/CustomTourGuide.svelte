<script lang="ts">
  import { tourStore } from '$lib/stores/tourStore';
  import type { TourStep } from '$lib/stores/tourStore';
  import { fade } from 'svelte/transition';
  import { onMount, onDestroy } from 'svelte';
  import { tick } from 'svelte';
  import { browser } from '$app/environment';

  let currentStep: TourStep | null = null;
  let isVisible = false;
  let stepElement: HTMLElement;
  let position = 'fixed'; // Default to fixed for center
  let top = '50%';
  let left = '50%';
  let transform = 'translate(-50%, -50%)';

  // Variables for spotlight overlay
  let spotlightTop: HTMLElement, spotlightBottom: HTMLElement, spotlightLeft: HTMLElement, spotlightRight: HTMLElement;

  // Variables to track scroll position
  let scrollY = 0;
  let scrollX = 0;

  // --- Subscription to tour store ---
  const unsubscribe = tourStore.subscribe((state) => {
    const visibilityChanged = isVisible !== state.isTourActive;
    const stepChanged = currentStep?.id !== (state.isTourActive ? state.steps[state.currentStepIndex]?.id : null);
    
    isVisible = state.isTourActive;
    if (state.isTourActive && state.currentStepIndex >= 0) {
      currentStep = state.steps[state.currentStepIndex];
      console.log('[CustomTourGuide] Displaying step:', currentStep?.id);
    } else {
      currentStep = null;
    }

    // If step/visibility changes, ensure initial positioning happens before scroll updates
    if (visibilityChanged || stepChanged) {
       positionAndSpotlightUpdate(); // Use a combined function
    }
  });

  // Handle clicks on buttons within the step content
  function handleStepAction(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest('button[data-tour-action]');

    if (button) {
      const action = button.getAttribute('data-tour-action');
      console.log('[CustomTourGuide] Action button clicked:', action);
      switch (action) {
        case 'next':
          tourStore.nextStep();
          break;
        case 'prev':
          tourStore.prevStep();
          break;
        case 'cancel':
          tourStore.cancelTour();
          break;
        case 'complete':
          tourStore.completeTour();
          // Optional: specific logic for the interactive step on complete
          if (currentStep?.isInteractive) {
             // e.g., trigger form submission or focus next element
          }
          break;
      }
    }
  }

  // --- Function to update the spotlight overlay ---
  function updateSpotlightOverlay(targetRect: DOMRect | null) {
    const segments = [spotlightTop, spotlightBottom, spotlightLeft, spotlightRight];
    if (!segments.every(el => el)) return; // Ensure elements are bound

    // Only show spotlight if target exists AND current step doesn't disable overlay
    if (targetRect && currentStep && !currentStep.disableOverlay) {
      // Target exists and overlay is enabled for this step
      // Make segments visible (assuming they default to hidden or zero size)
      segments.forEach(el => el.style.display = 'block'); 

      // Calculate positions (adjust if needed for borders/exactness)
      spotlightTop.style.height = `${Math.max(0, targetRect.top)}px`;

      spotlightBottom.style.top = `${Math.max(0, targetRect.bottom)}px`;
      spotlightBottom.style.height = `calc(100vh - ${Math.max(0, targetRect.bottom)}px)`;

      spotlightLeft.style.top = `${Math.max(0, targetRect.top)}px`;
      spotlightLeft.style.height = `${Math.max(0, targetRect.height)}px`;
      spotlightLeft.style.width = `${Math.max(0, targetRect.left)}px`;

      spotlightRight.style.top = `${Math.max(0, targetRect.top)}px`;
      spotlightRight.style.height = `${Math.max(0, targetRect.height)}px`;
      spotlightRight.style.left = `${Math.max(0, targetRect.right)}px`;
      spotlightRight.style.width = `calc(100vw - ${Math.max(0, targetRect.right)}px)`;

    } else {
      // No target or overlay explicitly disabled for this step, hide the spotlight
      segments.forEach(el => el.style.display = 'none');
    }
  }

  // --- Combined function for positioning Step & Spotlight ---
  async function positionAndSpotlightUpdate() {
    await tick(); // Wait for DOM updates

    if (!isVisible || !currentStep || !stepElement) {
      updateSpotlightOverlay(null); // Hide spotlight if not visible/no step
      return;
    }

    let targetRect: DOMRect | null = null;
    if (currentStep.target) {
      const targetEl = document.querySelector<HTMLElement>(currentStep.target);
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        targetRect = rect;

        // Calculate step position (using existing logic)
        const stepRect = stepElement.getBoundingClientRect();
        const arrowOffset = 30; 
        const horizontalOffset = 50;
        const verticalOffset = 38;
        const horizontalGap = -10;
        position = 'absolute'; // Use absolute for target-based positioning

        if (currentStep.placement === 'bottom') {
          top = `${rect.bottom + scrollY + arrowOffset}px`; // Use scrollY
          left = `${rect.left + scrollX + (rect.width / 2) - horizontalOffset}px`; // Use scrollX
          transform = 'none';
        } else if (currentStep.placement === 'right') {
          const verticalOffset = 42; // Increased slightly
          const horizontalGap = 48; // Corrected to positive value
          top = `${rect.top + scrollY + (rect.height / 2) - (stepRect.height / 2) + verticalOffset}px`; // Adjust vertical alignment
          left = `${rect.right + scrollX + horizontalGap}px`; // Correct horizontal gap calculation
          transform = 'none';
        } else if (currentStep.placement === 'top') {
          const horizontalOffsetTop = 20; // Pixels to shift right from target center
          top = `${rect.top + scrollY - stepRect.height - arrowOffset}px`; // Position above target
          left = `${rect.left + scrollX + (rect.width / 2) + horizontalOffsetTop}px`; // Adjust horizontal position
          transform = 'none';
        } else if (currentStep.placement === 'left') {
            const horizontalGap = 30; // Increased gap to the left
            const verticalOffset = 30; // Added offset to push down slightly
            top = `${rect.top + scrollY + (rect.height / 2) - (stepRect.height / 2) + verticalOffset}px`; // Adjust vertical alignment
            left = `${rect.left + scrollX - stepRect.width - horizontalGap}px`; // Position further left
            transform = 'none';
        } else {
           console.warn(`Placement "${currentStep.placement}" not fully implemented. Defaulting position.`);
           top = `${rect.bottom + scrollY + arrowOffset}px`; // Use scrollY
           left = `${rect.left + scrollX + (rect.width / 2) - (stepRect.width / 2)}px`; // Use scrollX
           transform = 'none';
        }

      } else {
        // Target not found
        console.warn(`[CustomTourGuide] Target element "${currentStep.target}" not found. Placing centrally.`);
        position = 'fixed'; top = '50%'; left = '50%'; transform = 'translate(-50%, -50%)';
      }
    } else {
      // Centered step
      position = 'fixed'; top = '50%'; left = '50%'; transform = 'translate(-50%, -50%)';
    }

    // Update spotlight (uses viewport-relative rect, so doesn't need scrollX/Y)
    updateSpotlightOverlay(targetRect);
  }

  // --- Reactive updates for scroll changes ---
  $: if (browser && isVisible && currentStep?.target) {
    // Re-run positioning whenever scroll changes while a targeted step is active
    positionAndSpotlightUpdate();
    // Need to explicitly list dependencies for reactivity
    scrollY, scrollX;
  }

  onDestroy(() => {
    unsubscribe();
  });
</script>

<!-- Bind window scroll -->
<svelte:window bind:scrollY bind:scrollX />

{#if isVisible && currentStep}
  <!-- Simple Overlay (for centered steps without disabled overlay) -->
  {#if currentStep.placement === 'center' && !currentStep.disableOverlay}
    <div
      transition:fade={{ duration: 200 }}
      class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[9997]"
      on:click={tourStore.cancelTour}
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Spotlight Overlay (for targeted steps) -->
  <div class="fixed inset-0 z-[9998] pointer-events-none"> 
    <div bind:this={spotlightTop} class="spotlight-segment absolute top-0 left-0 w-full" style="display: none;"></div>
    <div bind:this={spotlightBottom} class="spotlight-segment absolute bottom-0 left-0 w-full" style="display: none;"></div>
    <div bind:this={spotlightLeft} class="spotlight-segment absolute left-0" style="display: none;"></div>
    <div bind:this={spotlightRight} class="spotlight-segment absolute right-0" style="display: none;"></div>
  </div>

  <!-- Tour Step Container -->
  <div
    bind:this={stepElement}
    class="z-[9999] p-0 border-none shadow-none bg-transparent tour-step-container" 
    style:position={position}
    style:top={top}
    style:left={left}
    style:transform={transform}
    role="dialog"
    aria-modal="true"
    aria-labelledby="tour-step-title-{currentStep.id}"
    aria-describedby="tour-step-desc-{currentStep.id}"
    transition:fade={{ duration: 300 }}
    on:click={handleStepAction}
  >
    <!-- Render Step Content (potentially unsafe, consider sanitizing or using components) -->
    {@html currentStep.content}
  </div>

  <!-- TODO: Add Element Highlighting Logic Here -->
{/if}

<style>
  .spotlight-segment {
    @apply bg-black/50 dark:bg-black/70 pointer-events-auto;
 }
  /* Ensure step container itself doesn't block underlying content unnecessarily */
 .tour-step-container {
    pointer-events: auto; /* Allow clicks inside the step */
 }
 :global(.tour-step-container > *) {
    pointer-events: auto; /* Allow clicks on content */
 }
</style>
