<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { goto } from '$app/navigation';
	import CourseReadyModal from './CourseReadyModal.svelte';

	export let showModal: boolean;
	// Optional: Pass a video to pre-populate a module
	export let video: { title: string; videoUrl: string } | null = null;

	const dispatch = createEventDispatcher();

	interface Module {
		id: number;
		title: string;
		duration: string;
		thumbnail: string;
	}

	let title = '';
	let description = '';
	let modules: Module[] = [];
	let courseQuiz = false;
	let visibility = 'Public';
	let showCourseReadyModal = false;

	onMount(() => {
		if (video) {
			title = video.title;
			// A basic module structure
			modules = [
				{
					id: 1,
					title: video.title,
					duration: '45 min', // Placeholder
					thumbnail: '/images/videoCardThumb.png' // Placeholder
				}
			];
		}
	});

	function closeModal() {
		dispatch('close');
	}

	async function createCourse() {
		const courseData = {
			title,
			description,
			modules,
			courseQuiz,
			visibility
		};
		console.log('Creating course:', courseData);
		// TODO: Implement actual course creation logic here
		
		// For now, we'll just simulate a successful course creation
		showModal = false;
		showCourseReadyModal = true;
	}

	function addModule() {
		alert('Add module functionality to be implemented.');
	}

	function handleViewCourse() {
		// TODO: Navigate to the course view page
		showCourseReadyModal = false;
		goto('/courses/1'); // Replace with actual course ID
	}

	function handleContinueToLibrary() {
		showCourseReadyModal = false;
		goto('/video-library');
	}
</script>

{#if showModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
		on:click|self={closeModal}
        
	>
		<div
			class="bg-gradient-light dark:bg-gradient-dark p-4 rounded-2xl shadow-2xl w-full max-w-[390px] transform transition-all text-light-text-primary dark:text-dark-text-primary"
		>
			<!-- Header -->
			<div class="flex justify-between items-center border-b border-light-border dark:border-dark-border pl-28 pb-4 mb-6">
				<h2 class="text-body-semibold">Create new course</h2>
				<button on:click={closeModal} class="text-[#FF0000] hover:opacity-75 transition-opacity">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="25"
						viewBox="0 0 24 25"
						fill="none"
					>
						<path
							d="M14.9994 15.5L9 9.5M9.00064 15.5L15 9.5"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M22 12.5C22 6.97715 17.5228 2.5 12 2.5C6.47715 2.5 2 6.97715 2 12.5C2 18.0228 6.47715 22.5 12 22.5C17.5228 22.5 22 18.0228 22 12.5Z"
							stroke="currentColor"
							stroke-width="1.5"
						/>
					</svg>
				</button>
			</div>

			<!-- Form -->
			<div class="space-y-4">
				<!-- Title -->
				<div>
					<div class="flex justify-between items-center mb-1">
						<label
							for="course-title"
							class="block text-xs font-semibold font-['Poppins'] text-light-text-tertiary dark:text-dark-text-tertiary"
							>Title</label
						>
						<button class="text-gray-400 hover:text-brand-red">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                <path d="M10.9501 3.57006L11.6101 2.91007C12.1569 2.36331 13.0434 2.36331 13.5901 2.91007C14.1368 3.45683 14.1368 4.34329 13.5901 4.89005L12.9301 5.55004M10.9501 3.57006L6.51055 8.0096C6.17221 8.348 5.93219 8.77187 5.81614 9.23607L5.3335 11.1667L7.2641 10.684C7.7283 10.568 8.15216 10.3279 8.49056 9.9896L12.9301 5.55004M10.9501 3.57006L12.9301 5.55004" stroke="currentColor" stroke-linejoin="round"/>
                                <path d="M12.6666 9.5026C12.6666 11.6943 12.6666 12.7901 12.0613 13.5277C11.9505 13.6627 11.8267 13.7865 11.6917 13.8973C10.9541 14.5026 9.85827 14.5026 7.6666 14.5026H7.33333C4.81917 14.5026 3.56211 14.5026 2.78106 13.7215C2.00002 12.9405 2 11.6834 2 9.16927V8.83594C2 6.64428 2 5.54846 2.60529 4.8109C2.71611 4.67587 2.83993 4.55205 2.97496 4.44123C3.71253 3.83594 4.80835 3.83594 7 3.83594" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
							
						</button>
					</div>
					<input
						type="text"
						id="course-title"
						bind:value={title}
						placeholder="Write a title for your course"
						class="w-full px-2 py-[7px] text-mini-body text-light-text-tertiary dark:text-dark-text-tertiary bg-white dark:bg-black border border-light-border dark:border-dark-border rounded-lg focus:ring-brand-red focus:border-brand-red"
					/>
				</div>

				<!-- Description -->
				<div>
					<div class="flex justify-between items-center mb-1">
						<label
							for="course-description"
							class="block text-xs font-semibold font-['Poppins'] text-light-text-tertiary dark:text-dark-text-tertiary"
							>Description</label
						>
						<button class="text-gray-400 hover:text-brand-red">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" width="16" height="17" viewBox="0 0 16 17" fill="none">
                                <path d="M10.9501 3.57006L11.6101 2.91007C12.1569 2.36331 13.0434 2.36331 13.5901 2.91007C14.1368 3.45683 14.1368 4.34329 13.5901 4.89005L12.9301 5.55004M10.9501 3.57006L6.51055 8.0096C6.17221 8.348 5.93219 8.77187 5.81614 9.23607L5.3335 11.1667L7.2641 10.684C7.7283 10.568 8.15216 10.3279 8.49056 9.9896L12.9301 5.55004M10.9501 3.57006L12.9301 5.55004" stroke="currentColor" stroke-linejoin="round"/>
                                <path d="M12.6666 9.5026C12.6666 11.6943 12.6666 12.7901 12.0613 13.5277C11.9505 13.6627 11.8267 13.7865 11.6917 13.8973C10.9541 14.5026 9.85827 14.5026 7.6666 14.5026H7.33333C4.81917 14.5026 3.56211 14.5026 2.78106 13.7215C2.00002 12.9405 2 11.6834 2 9.16927V8.83594C2 6.64428 2 5.54846 2.60529 4.8109C2.71611 4.67587 2.83993 4.55205 2.97496 4.44123C3.71253 3.83594 4.80835 3.83594 7 3.83594" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
						</button>
					</div>
					<textarea
						id="course-description"
						bind:value={description}
						rows="3"
						placeholder="Step into the world of technology with this beginner-friendly guide that demystifies the core principles of web development and artificial intelligence."
						class="w-full px-2 py-[7px] text-mini-body text-light-text-tertiary dark:text-dark-text-tertiary bg-white dark:bg-black border border-light-border dark:border-dark-border rounded-lg focus:ring-brand-red focus:border-brand-red"
					></textarea>
				</div>

				<!-- Modules -->
				<div class="w-full h-[210px] p-2 pb-[74px] rounded-2xl border border-light-border dark:border-dark-border">
					<div class="flex justify-between items-center mb-2">
						<h3 class="text-xs font-semibold font-['Poppins'] text-light-text-tertiary dark:text-dark-text-tertiary">
							Modules
						</h3>
						<div class="flex items-center gap-2">
							<button
								on:click={addModule}
								class="flex items-center gap-1 text-sm text-light-text-primary dark:text-dark-text-primary font-medium bg-brand-red/10 dark:bg-brand-red/10 hover:bg-brand-red/20 dark:hover:bg-brand-red/30 rounded-full px-3 py-1"
							>
								Add module
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
									<path d="M14 8.5C14 8.63261 13.9473 8.75979 13.8536 8.85355C13.7598 8.94732 13.6326 9 13.5 9H8.5V14C8.5 14.1326 8.44732 14.2598 8.35355 14.3536C8.25979 14.4473 8.13261 14.5 8 14.5C7.86739 14.5 7.74021 14.4473 7.64645 14.3536C7.55268 14.2598 7.5 14.1326 7.5 14V9H2.5C2.36739 9 2.24021 8.94732 2.14645 8.85355C2.05268 8.75979 2 8.63261 2 8.5C2 8.36739 2.05268 8.24021 2.14645 8.14645C2.24021 8.05268 2.36739 8 2.5 8H7.5V3C7.5 2.86739 7.55268 2.74021 7.64645 2.64645C7.74021 2.55268 7.86739 2.5 8 2.5C8.13261 2.5 8.25979 2.55268 8.35355 2.64645C8.44732 2.74021 8.5 2.86739 8.5 3V8H13.5C13.6326 8 13.7598 8.05268 13.8536 8.14645C13.9473 8.24021 14 8.36739 14 8.5Z" fill="#EB434A"/>
								  </svg>
							</button>
							<button>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
									<path d="M7.64646 11.854L2.64646 6.85403C2.6 6.80757 2.56316 6.75242 2.53801 6.69173C2.51287 6.63103 2.49993 6.56598 2.49993 6.50028C2.49993 6.43458 2.51287 6.36953 2.53801 6.30883C2.56316 6.24813 2.6 6.19298 2.64646 6.14653C2.69291 6.10007 2.74806 6.06322 2.80876 6.03808C2.86946 6.01294 2.93451 6 3.00021 6C3.06591 6 3.13096 6.01294 3.19166 6.03808C3.25235 6.06322 3.3075 6.10007 3.35396 6.14653L8.00021 10.7934L12.6465 6.14653C12.7403 6.05271 12.8675 6 13.0002 6C13.1329 6 13.2601 6.05271 13.354 6.14653C13.4478 6.24035 13.5005 6.3676 13.5005 6.50028C13.5005 6.63296 13.4478 6.76021 13.354 6.85403L8.35396 11.854C8.30752 11.9005 8.25238 11.9374 8.19168 11.9626C8.13098 11.9877 8.06592 12.0007 8.00021 12.0007C7.9345 12.0007 7.86944 11.9877 7.80874 11.9626C7.74804 11.9374 7.6929 11.9005 7.64646 11.854Z" fill="#A3A3A3"/>
								  </svg>
							</button>
						</div>
					</div>
					<div class="space-y-3">
						{#each modules as module, i (module.id)}
							<div
								class="flex p-2 items-center justify-between gap-4 rounded-2xl border border-light-border dark:border-dark-border"
							>
								<!-- Left side content -->
								<div class="flex-1 flex flex-col justify-between self-stretch">
									<p
										class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary"
									>
										{@html `<span class="text-light-text-secondary dark:text-dark-text-secondary">0${i + 1}:</span> <span class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary">${module.title}</span>`}
									</p>
									<div class="flex items-center justify-between mt-auto pt-2">
										<p class="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
											{module.duration}
										</p>
										<button class="text-brand-red hover:opacity-80">
											<svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
												<path d="M21.3103 7.37915L17.1216 3.18946C16.9823 3.05014 16.8169 2.93962 16.6349 2.86421C16.4529 2.78881 16.2578 2.75 16.0608 2.75C15.8638 2.75 15.6687 2.78881 15.4867 2.86421C15.3047 2.93962 15.1393 3.05014 15 3.18946L3.43969 14.7507C3.2998 14.8895 3.18889 15.0547 3.11341 15.2367C3.03792 15.4188 2.99938 15.614 3.00001 15.811V20.0007C3.00001 20.3985 3.15804 20.7801 3.43935 21.0614C3.72065 21.3427 4.10218 21.5007 4.50001 21.5007H8.6897C8.88675 21.5013 9.08197 21.4628 9.26399 21.3873C9.44602 21.3118 9.61122 21.2009 9.75001 21.061L21.3103 9.50071C21.4496 9.36142 21.5602 9.19604 21.6356 9.01403C21.711 8.83202 21.7498 8.63694 21.7498 8.43993C21.7498 8.24292 21.711 8.04784 21.6356 7.86582C21.5602 7.68381 21.4496 7.51844 21.3103 7.37915ZM8.6897 20.0007H4.50001V15.811L12.75 7.56102L16.9397 11.7507L8.6897 20.0007ZM18 10.6895L13.8103 6.50071L16.0603 4.25071L20.25 8.43946L18 10.6895Z" fill="#EB434A"/>
											  </svg>
										</button>
									</div>
								</div>

								<!-- Right side thumbnail -->
								<div class="w-[117px] h-[78px] flex-shrink-0 relative">
									<img
										src={module.thumbnail}
										alt={module.title}
										class="w-full h-full rounded-md object-cover"
									/>
									<div
										class="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md"
									>
										
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
											<path d="M14.8871 5.02675C14.7217 4.40428 14.2346 3.914 13.6161 3.74759C12.4951 3.44531 7.99997 3.44531 7.99997 3.44531C7.99997 3.44531 3.50481 3.44531 2.38375 3.74763C1.76528 3.91403 1.27819 4.40428 1.11288 5.02678C0.8125 6.15506 0.8125 8.50922 0.8125 8.50922C0.8125 8.50922 0.8125 10.8634 1.11288 11.9917C1.27819 12.6142 1.76528 13.084 2.38375 13.2504C3.50481 13.5527 7.99997 13.5527 7.99997 13.5527C7.99997 13.5527 12.4951 13.5527 13.6161 13.2504C14.2346 13.084 14.7217 12.6141 14.8871 11.9916C15.1874 10.8634 15.1874 8.50919 15.1874 8.50919C15.1874 8.50919 15.1874 6.15506 14.8871 5.02675Z" fill="#FF0000"/>
											<path d="M6.52979 10.6498V6.375L10.2868 8.51244L6.52979 10.6498Z" fill="white"/>
										  </svg>
									
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>


				<!-- Footer controls -->
				<div class="flex justify-between items-center">
					<!-- Course Quiz -->
					<div class="flex items-center p-2 gap-3 rounded-2xl border border-light-border dark:border-dark-border">
						<span class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary">Course Quiz</span>
						<button
							on:click={() => (courseQuiz = !courseQuiz)}
							class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors {courseQuiz
								? 'bg-brand-red'
								: 'bg-gray-300 dark:bg-gray-600'}"
						>
							<span class="sr-only">Enable Course Quiz</span>
							<span
								class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform {courseQuiz
									? 'translate-x-6'
									: 'translate-x-1'}"
							></span>
						</button>
					</div>

					<!-- Public/Private -->
					<div class="relative inline-flex justify-center items-center p-2 rounded-2xl bg-brand-red/10 dark:bg-brand-red/10 gap-3">
						<div class="flex justify-start items-center gap-2">
							<div class="w-5 h-5 relative overflow-hidden flex items-center justify-center">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none" class="text-brand-red">
									<path d="M10 1.875C8.39303 1.875 6.82214 2.35152 5.486 3.24431C4.14985 4.1371 3.10844 5.40605 2.49348 6.8907C1.87852 8.37535 1.71762 10.009 2.03112 11.5851C2.34463 13.1612 3.11846 14.6089 4.25476 15.7452C5.39106 16.8815 6.8388 17.6554 8.4149 17.9689C9.99099 18.2824 11.6247 18.1215 13.1093 17.5065C14.594 16.8916 15.8629 15.8502 16.7557 14.514C17.6485 13.1779 18.125 11.607 18.125 10C18.1225 7.84588 17.2657 5.78069 15.7425 4.2575C14.2193 2.7343 12.1541 1.87748 10 1.875ZM16.875 10C16.8755 10.634 16.788 11.2651 16.6148 11.875H13.6063C13.7979 10.6323 13.7979 9.36765 13.6063 8.125H16.6148C16.788 8.73493 16.8755 9.36597 16.875 10ZM7.96875 13.125H12.0313C11.631 14.4364 10.9362 15.6389 10 16.6406C9.06413 15.6387 8.36939 14.4362 7.96875 13.125ZM7.66407 11.875C7.44949 10.6342 7.44949 9.36579 7.66407 8.125H12.3422C12.5568 9.36579 12.5568 10.6342 12.3422 11.875H7.66407ZM3.125 10C3.12446 9.36597 3.21202 8.73493 3.38516 8.125H6.39375C6.20208 9.36765 6.20208 10.6323 6.39375 11.875H3.38516C3.21202 11.2651 3.12446 10.634 3.125 10ZM12.0313 6.875H7.96875C8.36898 5.5636 9.06377 4.36108 10 3.35938C10.9359 4.36134 11.6306 5.56378 12.0313 6.875ZM16.1195 6.875H13.3367C12.986 5.58821 12.3948 4.37943 11.5945 3.3125C12.5615 3.54479 13.4668 3.98342 14.2484 4.59832C15.03 5.21323 15.6693 5.98987 16.1227 6.875H16.1195ZM8.40547 3.3125C7.60516 4.37943 7.01403 5.58821 6.66328 6.875H3.87735C4.33068 5.98987 4.97006 5.21323 5.75163 4.59832C6.53321 3.98342 7.43851 3.54479 8.40547 3.3125ZM3.87735 13.125H6.66328C7.01403 14.4118 7.60516 15.6206 8.40547 16.6875C7.43851 16.4552 6.53321 16.0166 5.75163 15.4017C4.97006 14.7868 4.33068 14.0101 3.87735 13.125ZM11.5945 16.6875C12.3948 15.6206 12.986 14.4118 13.3367 13.125H16.1227C15.6693 14.0101 15.03 14.7868 14.2484 15.4017C13.4668 16.0166 12.5615 16.4552 11.5945 16.6875Z" fill="currentColor"/>
								</svg>
							</div>
							<select
								bind:value={visibility}
								class="appearance-none bg-transparent text-light-text-primary dark:text-dark-text-primary text-sm font-normal font-['Poppins'] leading-snug focus:outline-none"
							>
								<option>Public</option>
								<option>Private</option>
							</select>
						</div>
						<div class="w-5 h-5 relative overflow-hidden flex items-center justify-center">
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
								<path d="M14.192 13.3083C14.2502 13.3663 14.2963 13.4353 14.3277 13.5112C14.3592 13.587 14.3753 13.6684 14.3753 13.7505C14.3753 13.8326 14.3592 13.914 14.3277 13.9898C14.2963 14.0657 14.2502 14.1346 14.192 14.1927L10.442 17.9427C10.384 18.0008 10.3151 18.0469 10.2392 18.0783C10.1633 18.1098 10.082 18.126 9.99986 18.126C9.91772 18.126 9.8364 18.1098 9.76052 18.0783C9.68465 18.0469 9.61572 18.0008 9.55767 17.9427L5.80767 14.1927C5.6904 14.0754 5.62451 13.9163 5.62451 13.7505C5.62451 13.5846 5.6904 13.4256 5.80767 13.3083C5.92495 13.191 6.08401 13.1251 6.24986 13.1251C6.41571 13.1251 6.57477 13.191 6.69205 13.3083L9.99986 16.6169L13.3077 13.3083C13.3657 13.2502 13.4346 13.2041 13.5105 13.1726C13.5864 13.1412 13.6677 13.125 13.7499 13.125C13.832 13.125 13.9133 13.1412 13.9892 13.1726C14.0651 13.2041 14.134 13.2502 14.192 13.3083ZM6.69205 6.69268L9.99986 3.38409L13.3077 6.69268C13.4249 6.80996 13.584 6.87584 13.7499 6.87584C13.9157 6.87584 14.0748 6.80996 14.192 6.69268C14.3093 6.5754 14.3752 6.41634 14.3752 6.25049C14.3752 6.08464 14.3093 5.92558 14.192 5.8083L10.442 2.0583C10.384 2.00019 10.3151 1.95409 10.2392 1.92264C10.1633 1.89119 10.082 1.875 9.99986 1.875C9.91772 1.875 9.8364 1.89119 9.76052 1.92264C9.68465 1.95409 9.61572 2.00019 9.55767 2.0583L5.80767 5.8083C5.6904 5.92558 5.62451 6.08464 5.62451 6.25049C5.62451 6.41634 5.6904 6.5754 5.80767 6.69268C5.92495 6.80995 6.08401 6.87584 6.24986 6.87584C6.41571 6.87584 6.57477 6.80996 6.69205 6.69268Z" fill="black"/>
							  </svg> 
						</div>
					</div>
				</div>

				<!-- Create Course Button -->
				<button
					on:click={createCourse}
					class="w-full h-10 bg-brand-red text-white text-semi-body py-2 rounded-lg hover:bg-ButtonHover transition-colors"
				>
					Create course
				</button>
			</div>
		</div>
	</div>
{/if}

<CourseReadyModal
	bind:showModal={showCourseReadyModal}
	courseTitle={title}
	courseDescription={description}
	courseThumbnail={video?.thumbnail || '/images/videoCardThumb.png'}
	on:viewCourse={handleViewCourse}
	on:continueToLibrary={handleContinueToLibrary}
	on:close={() => showCourseReadyModal = false}
/> 