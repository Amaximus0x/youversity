<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import CourseReadyModal from './CourseReadyModal.svelte';
	import { finalLoadingState } from '$lib/stores/loadingState';
	import { get } from 'svelte/store';

	export let showModal: boolean;
	// Videos passed from video library
	export let videos: any[] = [];

	const dispatch = createEventDispatcher();

	interface Module {
		id: string;
		title: string;
		duration: string;
		thumbnail: string;
		videoUrl: string;
		originalVideoUrl: string;
		videoId: string;
	}

	let title = '';
	let description = '';
	let modules: Module[] = [];
	let courseQuiz = false;
	let visibility = 'Public';
	let showCourseReadyModal = false;
	let loading = false;
	let generatingContent = false;

	// Watch for course completion from the finalLoadingState
	$: if ($finalLoadingState.courseId && !$finalLoadingState.isLoading && !showCourseReadyModal) {
		// Course is complete, show the ready modal
		showCourseReadyModal = true;
		showModal = false; // Hide the create modal
	}

	// Watch for changes to videos prop and update modules
	$: if (videos && videos.length > 0 && modules.length === 0) {
		// Convert videos to modules
		modules = videos.map((video, index) => ({
			id: `module-${index}`,
			title: video.title || `Module ${index + 1}`,
			duration: '45 min', // We'll calculate this later
			thumbnail: video.thumbnailUrl || '/images/course-placeholder.png',
			videoUrl: video.videoUrl || video.originalVideoUrl || '',
			originalVideoUrl: video.originalVideoUrl || video.videoUrl || '',
			videoId: video.videoId || video.id || video.documentId || ''
		}));
		
		// Generate course title and description using AI
		generateCourseContent();
	}

	async function generateCourseContent() {
		if (!videos || videos.length === 0) return;
		
		generatingContent = true;
		
		try {
			// Create a prompt based on the video titles
			const videoTitles = videos.map(v => v.title).join(', ');
			const prompt = videos.length === 1 
				? `Based on this video: "${videoTitles}", generate a course title and description.`
				: `Based on these videos: "${videoTitles}", generate a comprehensive course title and description that covers all topics.`;

			const response = await fetch('/api/generate-course-metadata', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					prompt,
					videoTitles: videos.map(v => v.title),
					videoDescriptions: videos.map(v => v.description || v.summary || '')
				})
			});

			if (response.ok) {
				const data = await response.json();
				title = data.title || `Course: ${videos[0]?.title || 'Untitled'}`;
				description = data.description || 'A comprehensive course covering various topics.';
			} else {
				// Fallback if API fails
				title = videos.length === 1 
					? videos[0].title || 'Untitled Course'
					: `Multi-Topic Course: ${videos.length} Modules`;
				description = videos.length === 1
					? videos[0].description || videos[0].summary || 'Learn about this topic in detail.'
					: `A comprehensive course covering ${videos.length} different topics and modules.`;
			}
		} catch (error) {
			console.error('Error generating course content:', error);
			// Fallback content
			title = videos.length === 1 
				? videos[0].title || 'Untitled Course'
				: `Multi-Topic Course: ${videos.length} Modules`;
			description = 'A comprehensive course covering various topics.';
		} finally {
			generatingContent = false;
		}
	}

	function closeModal() {
		dispatch('close');
	}

	async function createCourse() {
		if (!title.trim() || !description.trim() || modules.length === 0) {
			alert('Please ensure all fields are filled and at least one module is present.');
			return;
		}

		const currentUser = get(user);
		if (!currentUser) {
			alert('Please sign in to create a course.');
			return;
		}

		// Start the loading state for CourseGenerationModal
		finalLoadingState.startLoading(title);
		finalLoadingState.setStep('Preparing course data...');
		
		// Hide the create course modal to show the generation modal
		showModal = false;

		try {
			// Prepare course data
			finalLoadingState.setStep('Setting up course structure...');
			finalLoadingState.setProgress(10);
			
			const courseData = {
				courseStructure: {
					OG_Course_Title: title,
					OG_Course_Objective: description,
					OG_Module_Title: modules.map(m => m.title),
					OG_Module_YouTube_Search_Prompt: modules.map(m => m.title) // Use titles as search prompts
				},
				selectedVideos: modules.map(m => ({
					videoId: m.videoId,
					videoUrl: m.originalVideoUrl,
					title: m.title,
					description: '',
					length: 0, // We'll get this from the video metadata
					thumbnailUrl: m.thumbnail
				})),
				moduleTranscripts: [], // We'll fetch these during course creation
				generateQuizzes: courseQuiz,
				isPublic: visibility === 'Public',
				createdBy: currentUser.uid,
				creatorUsername: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
				creatorDisplayName: currentUser.displayName || 'User'
			};

			console.log('Creating course with data:', courseData);

			finalLoadingState.setStep('Processing video modules...');
			finalLoadingState.setProgress(30);

			const response = await fetch('/api/create-final-course', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(courseData)
			});

			finalLoadingState.setStep('Generating course content...');
			finalLoadingState.setProgress(70);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || 'Failed to create course');
			}

			const result = await response.json();
			
			if (result.success) {
				console.log('Course created successfully:', result.course);
				
				// Complete the loading state
				finalLoadingState.setStep('Course created successfully!');
				finalLoadingState.setProgress(100);
				finalLoadingState.stopLoading(result.course.id);
				
				dispatch('courseCreated', { course: result.course });
			} else {
				throw new Error(result.error || 'Failed to create course');
			}

		} catch (error) {
			console.error('Error creating course:', error);
			finalLoadingState.setError(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	function addModule() {
		alert('Add module functionality - This would open a video selector modal.');
	}

	// Module reordering functions
	function moveModuleUp(index: number) {
		if (index > 0) {
			const temp = modules[index];
			modules[index] = modules[index - 1];
			modules[index - 1] = temp;
			modules = [...modules]; // Trigger reactivity
		}
	}

	function moveModuleDown(index: number) {
		if (index < modules.length - 1) {
			const temp = modules[index];
			modules[index] = modules[index + 1];
			modules[index + 1] = temp;
			modules = [...modules]; // Trigger reactivity
		}
	}

	function removeModule(index: number) {
		if (modules.length > 1) {
			modules = modules.filter((_, i) => i !== index);
		} else {
			alert('A course must have at least one module.');
		}
	}

	function handleViewCourse() {
		if ($finalLoadingState.courseId) {
			goto(`/course/${$finalLoadingState.courseId}`);
		} else {
			goto('/my-courses');
		}
		showCourseReadyModal = false;
		finalLoadingState.clearState();
	}

	function handleContinueToLibrary() {
		showCourseReadyModal = false;
		finalLoadingState.clearState();
		goto('/video-library');
	}

	function handleCourseReadyClose() {
		showCourseReadyModal = false;
		finalLoadingState.clearState();
	}
</script>

{#if showModal}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
		on:click|self={closeModal}
	>
		<div
			class="bg-gradient-light dark:bg-gradient-dark p-4 rounded-2xl shadow-2xl w-full max-w-[390px] max-h-[90vh] overflow-y-auto transform transition-all text-light-text-primary dark:text-dark-text-primary"
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

			<!-- Loading state for content generation -->
			{#if generatingContent}
				<div class="flex items-center justify-center py-8">
					<div class="flex items-center gap-3">
						<svg class="animate-spin h-5 w-5 text-brand-red" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span class="text-light-text-secondary dark:text-dark-text-secondary">Generating course content...</span>
					</div>
				</div>
			{:else}
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
							<button class="text-gray-400 hover:text-brand-red" on:click={generateCourseContent}>
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
							<button class="text-gray-400 hover:text-brand-red" on:click={generateCourseContent}>
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
					<div class="w-full max-h-[300px] p-2 pb-4 rounded-2xl border border-light-border dark:border-dark-border overflow-y-auto">
						<div class="flex justify-between items-center mb-2">
							<h3 class="text-xs font-semibold font-['Poppins'] text-light-text-tertiary dark:text-dark-text-tertiary">
								Modules ({modules.length})
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
							</div>
						</div>
						<div class="space-y-3">
							{#each modules as module, i (module.id)}
								<div
									class="flex p-2 items-center justify-between gap-4 rounded-2xl border border-light-border dark:border-dark-border"
								>
									<!-- Left side content -->
									<div class="flex-1 flex flex-col justify-between self-stretch">
										<p class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary">
											{@html `<span class="text-light-text-secondary dark:text-dark-text-secondary">0${i + 1}:</span> <span class="text-semibody-medium text-light-text-primary dark:text-dark-text-primary ">${module.title}</span>`}
										</p>
										<div class="flex items-center justify-between mt-auto pt-2">
											<p class="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
												{module.duration}
											</p>
											<!-- Module Controls -->
											<div class="flex items-center gap-2">
												<!-- Move Up -->
												<button 
													class="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-brand-red disabled:opacity-50"
													disabled={i === 0}
													on:click={() => moveModuleUp(i)}
												>
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M18 15l-6-6-6 6"/>
													</svg>
												</button>
												<!-- Move Down -->
												<button 
													class="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-brand-red disabled:opacity-50"
													disabled={i === modules.length - 1}
													on:click={() => moveModuleDown(i)}
												>
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M6 9l6 6 6-6"/>
													</svg>
												</button>
												<!-- Remove -->
												<button 
													class="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-red-500"
													on:click={() => removeModule(i)}
													disabled={modules.length <= 1}
												>
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<path d="M3 6h18"/>
														<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
														<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
													</svg>
												</button>
											</div>
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
						disabled={$finalLoadingState.isLoading || !title.trim() || !description.trim() || modules.length === 0}
						class="w-full h-10 bg-brand-red text-white text-semi-body py-2 rounded-lg hover:bg-ButtonHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if $finalLoadingState.isLoading}
							<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Creating course...
						{:else}
							Create course
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<CourseReadyModal
	bind:showModal={showCourseReadyModal}
	courseTitle={$finalLoadingState.courseTitle || title}
	courseDescription={description}
	courseThumbnail={'/images/course-placeholder.png'}
	on:viewCourse={handleViewCourse}
	on:continueToLibrary={handleContinueToLibrary}
	on:close={handleCourseReadyClose}
/> 