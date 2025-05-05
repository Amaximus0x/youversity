<script lang="ts">
  import { tourStore } from '$lib/stores/tourStore';
  import type { TourStep } from '$lib/stores/tourStore';
  import { fade } from 'svelte/transition';
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { tick } from 'svelte';
  import { browser } from '$app/environment';

  // Props for dynamic progress
  export let currentModuleIndex: number = 0;
  export let totalModules: number = 1;

  let currentStep: TourStep | null = null;
  let isVisible = false;
  let stepElement: HTMLElement;
  let position = 'fixed'; // Default to fixed for center
  let top = '50%';
  let left = '50%';
  let transform = 'translate(-50%, -50%)';
  let renderedContent = ''; // Reactive variable for dynamic content

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
      console.log('[CustomTourGuide SUB] Store updated. Active:', state.isTourActive, 'Index:', state.currentStepIndex, 'Step ID:', currentStep?.id);
    } else {
      currentStep = null;
      console.log('[CustomTourGuide SUB] Store updated. Tour inactive.');
    }

    // If step/visibility changes, ensure initial positioning happens before scroll updates
    if (visibilityChanged || stepChanged) {
       positionAndSpotlightUpdate(); // Use a combined function
    }
  });

  // --- Reactive statement to update renderedContent ---
  $: {
    if (currentStep && currentStep.content) {
      let progressBarWidth = 0;
      // Calculate progress based on step ID and module index
      if (totalModules > 0) { // Avoid division by zero
         switch (currentStep.id) {
            case 'cc-video-grid-interactive':
            case 'cc-video-grid-interactive-mobile':
               // Progress increases linearly from 0% to 80% based on current module
               progressBarWidth = Math.min(80, Math.max(0, Math.round((currentModuleIndex / totalModules) * 80)));
               break;
            case 'cc-select-next-module-interactive':
            case 'cc-select-next-module-interactive-mobile':
               // Progress after completing a module step (up to 80%)
               progressBarWidth = Math.min(80, Math.max(0, Math.round(((currentModuleIndex + 1) / totalModules) * 80)));
               break;
            case 'cc-add-custom-video':
            case 'cc-add-custom-video-mobile':
               progressBarWidth = 90; // Fixed near-end percentage
               break;
            case 'cc-create-complete':
            case 'cc-create-complete-mobile':
               progressBarWidth = 100; // Fixed end percentage
               break;
            default:
               // For steps without module progress (like dashboard steps), maybe hide or set to 0?
               progressBarWidth = 0; // Default to 0 if step doesn't match
         }
      } else {
        progressBarWidth = 0; // Default to 0 if totalModules is 0
      }
      
      // Replace placeholder in the content string
      renderedContent = currentStep.content.replace('{{progressBarWidth}}', progressBarWidth.toString());
      // Replace module number placeholder if it exists
      if (renderedContent.includes('{{moduleNumber}}')) {
        let moduleNumberToShow = currentModuleIndex + 1;
        if (currentStep.id === 'cc-select-next-module-interactive') {
          // For the "Continue to..." step, show the *next* module number
          moduleNumberToShow = currentModuleIndex + 2;
        }
        renderedContent = renderedContent.replace('{{moduleNumber}}', moduleNumberToShow.toString());
      }
    } else {
      renderedContent = ''; // Clear content if no step
    }
  }

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
          // Custom back logic for interactive tour
          if (currentStep) {
            switch (currentStep.id) {
              case 'cc-select-next-module-interactive':
                tourStore.goToStepById('cc-video-grid-interactive');
                break;
              case 'cc-video-grid-interactive':
                // Need a way to go back to previous module step OR start
                // For simplicity, let's go back one step in the array if possible
                tourStore.prevStep(); 
                break;
              case 'cc-add-custom-video':
                 // Go back to video grid for the last module
                 tourStore.goToStepById('cc-video-grid-interactive');
                 break;
              case 'cc-create-complete':
                // Go back to the add custom video step
                tourStore.goToStepById('cc-add-custom-video');
                break;
              default:
                // Default behavior for non-interactive or dashboard steps
                tourStore.prevStep(); 
            }
          } else {
            tourStore.prevStep(); // Fallback if currentStep is null
          }
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
    if (!browser) return; // Don't run on server

    const overlayDiv = document.getElementById('spotlight-overlay');
    const cutoutRect = document.getElementById('spotlight-cutout') as SVGElement | null;

    if (!overlayDiv || !cutoutRect) {
      console.warn('Spotlight overlay or cutout element not found');
      return;
    }

    // Only show spotlight if target exists AND current step doesn't disable overlay
    if (targetRect && currentStep && !currentStep.disableOverlay) {
      overlayDiv.style.display = 'block';

      // Get target element to compute style
      const targetEl = currentStep.target ? document.querySelector<HTMLElement>(currentStep.target) : null;
      let borderRadius = '4'; // Default radius
      if (targetEl) {
          try {
            const styles = getComputedStyle(targetEl);
            const radiusValue = styles.borderRadius;
            // Simple parsing: assumes px, takes the first value if multiple are present
            const parsed = parseFloat(radiusValue.split(' ')[0]); 
            if (!isNaN(parsed) && parsed > 0) {
              borderRadius = parsed.toString();
            }
          } catch(e) {
            console.warn('Could not parse border radius, using default.', e);
          }
      }

      // Update SVG cutout attributes
      cutoutRect.setAttribute('x', targetRect.left.toString());
      cutoutRect.setAttribute('y', targetRect.top.toString());
      cutoutRect.setAttribute('width', targetRect.width.toString());
      cutoutRect.setAttribute('height', targetRect.height.toString());
      cutoutRect.setAttribute('rx', borderRadius);
      cutoutRect.setAttribute('ry', borderRadius);

    } else {
      // No target or overlay explicitly disabled for this step, hide the spotlight
      overlayDiv.style.display = 'none';
    }
  }

  // --- Combined function for positioning Step & Spotlight ---
  async function positionAndSpotlightUpdate() {
    await tick(); // Wait for DOM updates

    if (!browser) return; // Don't run on server

    console.log('[CustomTourGuide POS] Running for Step ID:', currentStep?.id, 'Visible:', isVisible);

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

        // ---> ADD SCROLLING LOGIC HERE <---
        if (browser && window.innerWidth >= 1024) { // Check for desktop
          if (currentStep.id === 'explore-courses' || currentStep.id === 'create-course-input') {
            console.log(`[CustomTourGuide] Scrolling target for step ${currentStep.id} into view.`);
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          }
        }
        // ---> END SCROLLING LOGIC <---

        // Calculate step position (using existing logic)
        const stepRect = stepElement.getBoundingClientRect();
        const arrowOffset = 30; 
        const horizontalOffset = 50;
        const verticalOffset = 38;
        const horizontalGap = -10;
        position = 'absolute'; // Use absolute for target-based positioning

        // Default transform
        transform = 'none';

        if (currentStep.placement === 'bottom') {
          top = `${rect.bottom + scrollY + arrowOffset}px`; // Use scrollY
          // --- Conditional Centering for Mobile vs Desktop --- 
          if (browser && window.innerWidth < 1024) { // Mobile breakpoint (lg)
            // Mobile: Use transform-based centering 
            left = `${rect.left + scrollX + (rect.width / 2)}px`; 
            // Default center, adjust per ID if needed
            transform = 'translateX(-50%)'; 
            // Example: Adjust for create-course-input-mobile if necessary
            if (currentStep.id === 'explore-courses-mobile') { 
              transform = 'translateX(-26%)'; // Default center
            } else if (currentStep.id === 'create-course-input-mobile') { 
              transform = 'translateX(-50%)'; // Slightly right
            } else if (currentStep.id === 'cc-add-custom-video-mobile') { 
              transform = 'translateX(-82%)'; // Slightly right
            }
          } else {
            // Desktop: Use offset-based calculation
            if(currentStep.id === 'explore-courses') {
              left = `${rect.left + scrollX + (rect.width / 2) - (stepElement.getBoundingClientRect().width / 2)}px`;
              transform = 'translateX(28%)'; // Center based on step width
            } else {
              left = `${rect.left + scrollX + (rect.width / 2) - (stepElement.getBoundingClientRect().width / 2)}px`; // Center based on step width
              transform = 'none'; // Ensure no transform on desktop
            }
          }
          // ----------------------------------------------------
        } else if (currentStep.placement === 'right') {
          const verticalOffset = 42; // Increased slightly
          const horizontalGap = 48; // Corrected to positive value
          top = `${rect.top + scrollY + (rect.height / 2) - (stepRect.height / 2) + verticalOffset}px`; // Adjust vertical alignment
          left = `${rect.right + scrollX + horizontalGap}px`; // Correct horizontal gap calculation
          transform = 'none';
        } else if (currentStep.placement === 'top') {
          const spaceNeeded = stepRect.height + arrowOffset; // Total space needed above target
          const availableSpace = rect.top + scrollY;
          // Calculate top, ensuring minimum margin from viewport top (e.g., 10px)
          top = `${Math.max(10, availableSpace - spaceNeeded)}px`;

          // --- Conditional Centering for Mobile vs Desktop --- 
          if (browser && window.innerWidth < 1024) { // Mobile breakpoint (lg)
            // Mobile: Use transform-based centering for bottom nav items
            left = `${rect.left + scrollX + (rect.width / 2)}px`;
            // Specific adjustment for trending courses mobile step
            if (currentStep.id === 'trending-courses-mobile') {
              transform = 'translateX(-35%)'; // Shift slightly right
            } else if (currentStep.id === 'bookmarks-mobile') {
              transform = 'translateX(-65%)'; // Shift further left
            } else if (currentStep.id === 'settings-mobile') {
              transform = 'translateX(-91%)'; // Shift even further left
            } else if (currentStep.id === 'cc-video-grid-interactive-mobile') {
              transform = 'translate(-50%, 40%)';
               // Default center for other top steps
            } else if (currentStep.id === 'cc-select-next-module-interactive-mobile') {
              transform = 'translate(-24%)';
            } else if (currentStep.id === 'cc-add-custom-video-mobile') {
              transform = 'translate(-47%, 32%)';
            } else if (currentStep.id === 'cc-create-complete-mobile') {
              transform = 'translate(-28%)';
               // Default center for other top steps
            } else {
              transform = 'translateX(-50%)'; // Default center for other top steps
            }
          } else {
            // Desktop: Use width-based calculation (revert)
            if(currentStep.id === 'cc-select-next-module-interactive') {
              left = `${rect.left + scrollX + (rect.width / 2) - (stepRect.width / 2)}px`;
              transform = 'translateX(210px)';
            } else if(currentStep.id === 'cc-add-custom-video') {
              left = `${rect.left + scrollX + (rect.width / 2) - (stepRect.width / 2)}px`;
              transform = 'translateX(-35%)';
            } else if(currentStep.id === 'cc-create-complete') {
              left = `${rect.left + scrollX + (rect.width / 2) - (stepRect.width / 2)}px`;
              transform = 'translateX(60%)';
            } else {
              left = `${rect.left + scrollX + (rect.width / 2) - (stepRect.width / 2)}px`;
              transform = 'none';
            }
          }
          // ----------------------------------------------------
        } else if (currentStep.placement === 'left') {
            let horizontalGap = 30; // Increased gap to the left
            const verticalOffset = 30; // Added offset to push down slightly
            
            // Step-specific vertical adjustment
            let adjustedTopOffset = verticalOffset;
            // if (currentStep.id === 'cc-add-custom-video') {
            //   adjustedTopOffset = 60;
            //  transform = 'translateY(32px)'; // Reduce the downward push for this specific step
            // }

            top = `${rect.top + scrollY + (rect.height / 2) - (stepRect.height / 2) + adjustedTopOffset}px`; // Use adjusted offset
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
  <!-- Simple Overlay for CENTRED steps (with blur) -->
  {#if !currentStep.target && !currentStep.disableOverlay}
    <div
      transition:fade={{ duration: 200 }}
      class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[9997]"
      on:click={tourStore.cancelTour} 
      aria-hidden="true"
    ></div>
  {/if}

  <!-- Overlay and SVG Mask -->
  <div 
    id="spotlight-overlay"
    class="fixed inset-0 z-[9998] pointer-events-none"
    style="display: none;" 
  >
    <svg width="100%" height="100%" class="fixed inset-0 pointer-events-none">
      <defs>
        <mask id="spotlight-mask">
          <!-- White background (visible area) -->
          <rect width="100%" height="100%" fill="white"/>
          <!-- Black cutout rectangle (masked area) -->
          <rect id="spotlight-cutout" x="0" y="0" width="0" height="0" rx="0" ry="0" fill="black"/>
        </mask>
      </defs>
      <!-- Apply the mask to a full overlay rectangle -->
      <rect 
        width="100%" 
        height="100%" 
        fill="rgba(0, 0, 0, 0.5)" 
        class="dark:fill-[rgba(0,0,0,0.7)]" 
        mask="url(#spotlight-mask)" 
      />
    </svg>
  </div>

  <!-- Tour Step Container -->
  <div
    bind:this={stepElement}
    class="z-[9999] p-0 border-none shadow-none bg-transparent tour-step-container {currentStep.placement === 'center' ? 'w-full max-w-md px-4' : ''}"
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
    {@html renderedContent}
  </div>

  <!-- TODO: Add Element Highlighting Logic Here -->
{/if}

<style>
  /* Ensure step container itself doesn't block underlying content unnecessarily */
 .tour-step-container {
    pointer-events: auto; /* Allow clicks inside the step */
 }
 :global(.tour-step-container > *) {
    pointer-events: auto; /* Allow clicks on content */
 }
</style>
