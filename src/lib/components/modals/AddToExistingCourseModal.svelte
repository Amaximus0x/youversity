<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let showModal: boolean;

	const dispatch = createEventDispatcher();

	function closeModal() {
		dispatch('close');
	}

	// Mock data for courses
	const courses = [
		{ 
			id: 1, 
			title: 'Principles of user experience and user interface design', 
			duration: '2hrs', 
			image: '/images/videoCardThumb.png',
			description: 'This introductory course explores how Artificial Intelligence (AI) is transforming the landscape of modern software development. You\'ll gain a foundational understanding of AI concepts, tools, and their integration into real-world development workflows.'
		},
		{ 
			id: 2, 
			title: 'Music theory essentials for producers', 
			duration: '4hrs', 
			image: '/images/videoCardThumb.png',
			description: 'Learn the fundamentals of music theory specifically tailored for music producers and electronic music creators.'
		},
		{ 
			id: 3, 
			title: 'Basics of Unity or Unreal Engine', 
			duration: '1hr', 
			image: '/images/videoCardThumb.png',
			description: 'Get started with game development using Unity or Unreal Engine with this comprehensive beginner course.'
		},
		{ 
			id: 4, 
			title: 'Plot structure and narrative arcs', 
			duration: '1hr 45 min', 
			image: '/images/videoCardThumb.png',
			description: 'Master the art of storytelling by understanding plot structures and how to create compelling narrative arcs.'
		},
		{ 
			id: 5, 
			title: 'Advanced cooking techniques', 
			duration: '3hr 30 min', 
			image: '/images/videoCardThumb.png',
			description: 'Elevate your culinary skills with advanced cooking techniques used by professional chefs.'
		}
	];

	// Mock data for modules
	const modules = [
		{ id: 1, name: 'Module 1', title: 'Understanding AI and science development', videoCount: 7, image: '/images/videoCardThumb.png' },
		{ id: 2, name: 'Module 2', title: 'Understanding AI and science development', videoCount: 10, image: '/images/videoCardThumb.png' },
		{ id: 3, name: 'Module 3', title: 'Understanding AI and science development', videoCount: 4, image: '/images/videoCardThumb.png' },
		{ id: 4, name: 'Module 4', title: 'Understanding AI and science development', videoCount: 5, image: '/images/videoCardThumb.png' },
		{ id: 5, name: 'Module 5', title: 'Understanding AI and science development', videoCount: 10, image: '/images/videoCardThumb.png' },
		{ id: 6, name: 'Module 6', title: 'Understanding AI and science development', videoCount: 10, image: '/images/videoCardThumb.png' }
	];

	// Mock data for videos in modules
	const moduleVideos = [
		{ id: 1, title: 'Developing compelling characters and settings', duration: '45 min', image: '/images/videoCardThumb.png' },
		{ id: 2, title: 'Plot structure and narrative arcs', duration: '45 min', image: '/images/videoCardThumb.png' },
		{ id: 3, title: 'Writing styles and voice', duration: '45 min', image: '/images/videoCardThumb.png' },
		{ id: 4, title: 'Drawing fundamentals for digital artists', duration: '45 min', image: '/images/videoCardThumb.png' },
		{ id: 5, title: 'Writing styles and voice', duration: '45 min', image: '/images/videoCardThumb.png' }
	];

	let selectedCourseId: number | null = null;
	let selectedCourse: any = null;
	let selectedModule: any = null;
	let currentView: 'courseList' | 'moduleSelection' | 'videoList' = 'courseList';

	function selectCourse(course: any) {
		selectedCourseId = course.id;
		selectedCourse = course;
		currentView = 'moduleSelection';
	}

	function goBack() {
		if (currentView === 'videoList') {
			currentView = 'moduleSelection';
			selectedModule = null;
		} else if (currentView === 'moduleSelection') {
			currentView = 'courseList';
			selectedCourseId = null;
			selectedCourse = null;
		}
	}

	function addAsNewModule() {
		// Handle adding video as new module
		console.log('Adding video as new module to course:', selectedCourse);
		closeModal();
	}

	function selectModule(module: any) {
		selectedModule = module;
		currentView = 'videoList';
	}

	function addVideoToModule() {
		// Handle adding video to selected module
		console.log('Adding video to module:', selectedModule, 'in course:', selectedCourse);
		closeModal();
	}
</script>

{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		on:click|self={closeModal}
	>
		<div
			class="w-96 h-[586px] p-4 bg-gradient-to-b from-light-bg-secondary to-light-bg-tertiary dark:from-dark-bg-secondary dark:to-dark-bg-primary rounded-2xl flex flex-col gap-6"
			on:click|stopPropagation
		>
			<div
				class="self-stretch pb-4 border-b border-light-border dark:border-dark-border inline-flex justify-between items-center flex-shrink-0"
			>
				{#if currentView === 'moduleSelection' || currentView === 'videoList'}
					<button on:click={goBack} class="w-6 h-6 relative overflow-hidden">
						<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-light-text-primary dark:text-dark-text-primary" viewBox="0 0 24 24" fill="none">
							<path d="M21.0001 12.0004C21.0001 12.1993 20.9211 12.3901 20.7804 12.5307C20.6398 12.6714 20.449 12.7504 20.2501 12.7504H5.56041L11.0307 18.2198C11.1004 18.2895 11.1557 18.3722 11.1934 18.4632C11.2311 18.5543 11.2505 18.6519 11.2505 18.7504C11.2505 18.849 11.2311 18.9465 11.1934 19.0376C11.1557 19.1286 11.1004 19.2114 11.0307 19.281C10.961 19.3507 10.8783 19.406 10.7873 19.4437C10.6962 19.4814 10.5986 19.5008 10.5001 19.5008C10.4016 19.5008 10.304 19.4814 10.2129 19.4437C10.1219 19.406 10.0392 19.3507 9.96948 19.281L3.21948 12.531C3.14974 12.4614 3.09443 12.3787 3.05668 12.2876C3.01894 12.1966 2.99951 12.099 2.99951 12.0004C2.99951 11.9019 3.01894 11.8043 3.05668 11.7132C3.09443 11.6222 3.14974 11.5394 3.21948 11.4698L9.96948 4.71979C10.1102 4.57906 10.3011 4.5 10.5001 4.5C10.6991 4.5 10.89 4.57906 11.0307 4.71979C11.1715 4.86052 11.2505 5.05139 11.2505 5.25042C11.2505 5.44944 11.1715 5.64031 11.0307 5.78104L5.56041 11.2504H20.2501C20.449 11.2504 20.6398 11.3294 20.7804 11.4701C20.9211 11.6107 21.0001 11.8015 21.0001 12.0004Z" fill="currentColor"/>
						  </svg>
					</button>
				{:else}
					<div class="w-6 h-6" />
				{/if}
				<div
					class="flex-1 text-center justify-center text-light-text-primary dark:text-dark-text-primary text-body-semibold"
				>
					Add to existing course
				</div>
				<button on:click={closeModal} class="w-6 h-6 relative text-brand-red">
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

			{#if currentView === 'courseList'}
				<div class="self-stretch flex-1 flex flex-col gap-4 overflow-hidden">
					<div class="self-stretch inline-flex justify-between items-center">
						<div class="text-light-text-tertiary dark:text-dark-text-tertiary text-semibody-medium">
							Please select course
						</div>
						<div class="flex justify-start items-center gap-2">
							<button
								class="pl-3 pr-2 py-1 bg-brand-red/5 rounded-full flex justify-start items-center gap-2"
							>
								<div
									class="text-light-text-secondary dark:text-dark-text-secondary text-sm-button"
								>
									Sort
								</div>
								<div class="w-6 h-6 relative overflow-hidden text-light-text-secondary">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
										<path d="M17.0306 15.97C17.1003 16.0396 17.1556 16.1223 17.1933 16.2134C17.2311 16.3044 17.2505 16.402 17.2505 16.5006C17.2505 16.5992 17.2311 16.6967 17.1933 16.7878C17.1556 16.8788 17.1003 16.9616 17.0306 17.0312L12.5306 21.5312C12.4609 21.6009 12.3782 21.6563 12.2871 21.694C12.1961 21.7318 12.0985 21.7512 11.9999 21.7512C11.9014 21.7512 11.8038 21.7318 11.7127 21.694C11.6217 21.6563 11.539 21.6009 11.4693 21.5312L6.9693 17.0312C6.82857 16.8905 6.74951 16.6996 6.74951 16.5006C6.74951 16.3016 6.82857 16.1107 6.9693 15.97C7.11003 15.8292 7.30091 15.7502 7.49993 15.7502C7.69895 15.7502 7.88982 15.8292 8.03055 15.97L11.9999 19.9403L15.9693 15.97C16.039 15.9002 16.1217 15.8449 16.2127 15.8072C16.3038 15.7694 16.4014 15.75 16.4999 15.75C16.5985 15.75 16.6961 15.7694 16.7871 15.8072C16.8782 15.8449 16.9609 15.9002 17.0306 15.97ZM8.03055 8.03122L11.9999 4.0609L15.9693 8.03122C16.11 8.17195 16.3009 8.25101 16.4999 8.25101C16.699 8.25101 16.8898 8.17195 17.0306 8.03122C17.1713 7.89048 17.2503 7.69961 17.2503 7.50059C17.2503 7.30157 17.1713 7.1107 17.0306 6.96996L12.5306 2.46996C12.4609 2.40023 12.3782 2.34491 12.2871 2.30717C12.1961 2.26943 12.0985 2.25 11.9999 2.25C11.9014 2.25 11.8038 2.26943 11.7127 2.30717C11.6217 2.34491 11.539 2.40023 11.4693 2.46996L6.9693 6.96996C6.82857 7.1107 6.74951 7.30157 6.74951 7.50059C6.74951 7.69961 6.82857 7.89048 6.9693 8.03121C7.11003 8.17195 7.30091 8.25101 7.49993 8.25101C7.69895 8.25101 7.88982 8.17195 8.03055 8.03122Z" fill="#494848"/>
									</svg>
								</div>
							</button>
							<button class="p-1 bg-brand-red/5 rounded-full flex justify-start items-center gap-2">
								<div class="w-6 h-6 relative overflow-hidden text-light-text-secondary dark:text-dark-text-secondary">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
										<path d="M17.5 17.5L22 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
									</svg>
								</div>
							</button>
						</div>
					</div>
					<div class="self-stretch flex-1 overflow-y-auto pr-2 custom-scrollbar">
						<div class="inline-flex flex-col justify-start items-start gap-2 w-full">
							{#each courses as course (course.id)}
								<button
									on:click={() => selectCourse(course)}
									class="self-stretch h-20 p-2 rounded-2xl border {selectedCourseId === course.id
										? 'border-brand-red'
										: 'border-light-border dark:border-dark-border'} inline-flex justify-start items-center gap-4 transition-colors w-full"
								>
									<div class="flex-1 self-stretch flex flex-col justify-center items-start">
										<div
											class="self-stretch justify-start text-light-text-primary dark:text-dark-text-primary text-semibody-medium text-left"
										>
											{course.title}
										</div>
										<div class="self-stretch inline-flex justify-start items-center">
											<div
												class="text-light-text-tertiary dark:text-dark-text-tertiary text-mini-body leading-tight"
											>
												{course.duration}
											</div>
										</div>
									</div>
									<div class="w-24 h-full relative rounded-lg overflow-hidden flex-shrink-0">
										<img
											src={course.image}
											alt={course.title}
											class="w-full h-full object-cover"
										/>
										<div
											class="absolute inset-0 flex items-center justify-center bg-black/20"
										>
											<svg
												class="w-6 h-6 text-white"
												viewBox="0 0 24 24"
												fill="none"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M16.542 11.232C17.167 11.603 17.167 12.507 16.542 12.878L10.39 16.57C9.765 16.94 9 16.488 9 15.738V8.372C9 7.622 9.765 7.17 10.39 7.54L16.542 11.232Z"
													fill="currentColor"
												/>
											</svg>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>
			{:else if currentView === 'moduleSelection'}
				<div class="self-stretch flex-1 flex gap-3 overflow-hidden">
					<div class="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
						<div class="flex flex-col gap-4 flex-shrink-0">
							<div class="flex flex-col gap-3">
								<div class="text-light-text-tertiary dark:text-dark-text-tertiary text-mini-body font-semibold">
									Selected Course
								</div>
								<div class="p-2 rounded-2xl border border-light-border dark:border-dark-border flex flex-col gap-4">
									<div class="p-1 rounded-lg border border-brand-red flex gap-2">
										<img
											src={selectedCourse.image}
											alt={selectedCourse.title}
											class="w-20 h-16 rounded object-cover flex-shrink-0"
										/>
										<div class="flex-1 flex flex-col justify-center gap-0.5">
											<div class="text-light-text-secondary dark:text-dark-text-secondary text-mini-body font-medium leading-tight">
												{selectedCourse.title}
											</div>
											<div class="text-light-text-tertiary dark:text-dark-text-tertiary text-[10px] leading-none line-clamp-2">
												{selectedCourse.description}
											</div>
										</div>
									</div>
									<button
										on:click={addAsNewModule}
										class="pl-4 pr-3 py-3 bg-brand-red/5 rounded-full flex items-center gap-2 self-center"
									>
										<div class="text-light-text-primary dark:text-dark-text-primary text-mini-body font-medium">
											Add video as new module
										</div>
										<svg class="w-4 h-4 text-brand-red" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M8 1V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M1 8H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</button>
								</div>
							</div>
						</div>
						<div class="flex-1 flex flex-col overflow-hidden min-h-0">
							<div class="text-light-text-tertiary dark:text-dark-text-tertiary text-mini-body font-semibold mb-3 flex-shrink-0">
								Pick a module to add the video
							</div>
							<div class="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0" style="max-height: 300px;">
								<div class="grid grid-cols-2 gap-2 pb-2">
									{#each modules as module (module.id)}
										<button
											on:click={() => selectModule(module)}
											class="h-32 p-1 bg-black/5 dark:bg-white/10 rounded-lg flex flex-col gap-1.5 transition-colors hover:bg-light-border/30 dark:hover:bg-dark-border/30"
										>
											<div class="flex-1 relative rounded overflow-hidden">
												<img
													src={module.image}
													alt={module.title}
													class="w-full h-full object-cover"
												/>
												<div class="px-2 py-0.5 absolute top-1 left-1 bg-black/50 rounded-full backdrop-blur-sm">
													<div class="text-white text-[10px] font-medium leading-none">
														{module.name}
													</div>
												</div>
												<div class="px-1 absolute bottom-1 right-1 bg-black/20 rounded-3xl backdrop-blur-sm flex items-center gap-1">
													<div class="text-white text-[10px] font-medium leading-none">
														{module.videoCount}
													</div>
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
														<path d="M13 2.5H3C2.60218 2.5 2.22064 2.65804 1.93934 2.93934C1.65804 3.22064 1.5 3.60218 1.5 4V11C1.5 11.3978 1.65804 11.7794 1.93934 12.0607C2.22064 12.342 2.60218 12.5 3 12.5H13C13.3978 12.5 13.7794 12.342 14.0607 12.0607C14.342 11.7794 14.5 11.3978 14.5 11V4C14.5 3.60218 14.342 3.22064 14.0607 2.93934C13.7794 2.65804 13.3978 2.5 13 2.5ZM13.5 11C13.5 11.1326 13.4473 11.2598 13.3536 11.3536C13.2598 11.4473 13.1326 11.5 13 11.5H3C2.86739 11.5 2.74021 11.4473 2.64645 11.3536C2.55268 11.2598 2.5 11.1326 2.5 11V4C2.5 3.86739 2.55268 3.74021 2.64645 3.64645C2.74021 3.55268 2.86739 3.5 3 3.5H13C13.1326 3.5 13.2598 3.55268 13.3536 3.64645C13.4473 3.74021 13.5 3.86739 13.5 4V11ZM10.5 14C10.5 14.1326 10.4473 14.2598 10.3536 14.3536C10.2598 14.4473 10.1326 14.5 10 14.5H6C5.86739 14.5 5.74021 14.4473 5.64645 14.3536C5.55268 14.2598 5.5 14.1326 5.5 14C5.5 13.8674 5.55268 13.7402 5.64645 13.6464C5.74021 13.5527 5.86739 13.5 6 13.5H10C10.1326 13.5 10.2598 13.5527 10.3536 13.6464C10.4473 13.7402 10.5 13.8674 10.5 14ZM10.2775 7.08375L7.2775 5.08375C7.20218 5.0335 7.11463 5.00464 7.0242 5.00026C6.93376 4.99588 6.84383 5.01614 6.76401 5.05887C6.68418 5.10161 6.61746 5.16521 6.57097 5.24291C6.52447 5.3206 6.49994 5.40946 6.5 5.5V9.5C6.49994 9.59054 6.52447 9.6794 6.57097 9.75709C6.61746 9.83478 6.68418 9.89839 6.76401 9.94113C6.84383 9.98386 6.93376 10.0041 7.0242 9.99974C7.11463 9.99536 7.20218 9.9665 7.2775 9.91625L10.2775 7.91625C10.3461 7.87061 10.4023 7.80873 10.4412 7.73611C10.4801 7.66349 10.5005 7.58238 10.5005 7.5C10.5005 7.41762 10.4801 7.33651 10.4412 7.26389C10.4023 7.19127 10.3461 7.12939 10.2775 7.08375ZM7.5 8.56563V6.4375L9.09875 7.5L7.5 8.56563Z" fill="white"/>
													  </svg>
												</div>
											</div>
											<div class="text-light-text-secondary dark:text-dark-text-secondary text-[10px] font-medium leading-none text-left">
												{module.title}
											</div>
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>
					<div class="w-3 h-full bg-light-border/20 dark:bg-dark-border/20 rounded-full overflow-hidden relative">
						<div class="w-3 h-16 bg-brand-red rounded-full absolute top-1"></div>
					</div>
				</div>
			{:else if currentView === 'videoList'}
				<div class="self-stretch flex-1 flex gap-3 overflow-hidden">
					<div class="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
						<div class="flex flex-col gap-4 flex-shrink-0">
							<div class="flex items-center justify-between">
								<div class="text-light-text-tertiary dark:text-dark-text-tertiary text-semibody-medium">
									{selectedModule.name}
								</div>
								<button
									on:click={addVideoToModule}
									class="pl-4 pr-3 py-3 bg-brand-red/5 rounded-full inline-flex justify-start items-center gap-2"
								>
									<div class="text-light-text-primary dark:text-dark-text-primary text-mini-body font-medium">
										Add video to module
									</div>
									<div class="w-4 h-4 relative overflow-hidden">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
											<path d="M14 8C14 8.13261 13.9473 8.25979 13.8536 8.35355C13.7598 8.44732 13.6326 8.5 13.5 8.5H8.5V13.5C8.5 13.6326 8.44732 13.7598 8.35355 13.8536C8.25979 13.9473 8.13261 14 8 14C7.86739 14 7.74021 13.9473 7.64645 13.8536C7.55268 13.7598 7.5 13.6326 7.5 13.5V8.5H2.5C2.36739 8.5 2.24021 8.44732 2.14645 8.35355C2.05268 8.25979 2 8.13261 2 8C2 7.86739 2.05268 7.74021 2.14645 7.64645C2.24021 7.55268 2.36739 7.5 2.5 7.5H7.5V2.5C7.5 2.36739 7.55268 2.24021 7.64645 2.14645C7.74021 2.05268 7.86739 2 8 2C8.13261 2 8.25979 2.05268 8.35355 2.14645C8.44732 2.24021 8.5 2.36739 8.5 2.5V7.5H13.5C13.6326 7.5 13.7598 7.55268 13.8536 7.64645C13.9473 7.74021 14 7.86739 14 8Z" fill="#EB434A"/>
										  </svg>
									</div>
								</button>
							</div>
						</div>
						<div class="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
							<div class="flex flex-col gap-4">
								{#each moduleVideos as video (video.id)}
									<div class="flex items-center gap-4 p-2">
										
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
												<path d="M9.75 8C9.75 8.34612 9.64736 8.68446 9.45507 8.97225C9.26278 9.26004 8.98947 9.48434 8.6697 9.61679C8.34993 9.74924 7.99806 9.7839 7.65859 9.71638C7.31913 9.64885 7.00731 9.48218 6.76256 9.23744C6.51782 8.9927 6.35115 8.68088 6.28363 8.34141C6.2161 8.00194 6.25076 7.65008 6.38321 7.33031C6.51566 7.01054 6.73997 6.73722 7.02775 6.54493C7.31554 6.35264 7.65388 6.25 8 6.25C8.46413 6.25 8.90925 6.43438 9.23744 6.76256C9.56563 7.09075 9.75 7.53587 9.75 8ZM8 4.75C8.34612 4.75 8.68446 4.64737 8.97225 4.45507C9.26003 4.26278 9.48434 3.98947 9.61679 3.6697C9.74924 3.34993 9.7839 2.99806 9.71638 2.65859C9.64885 2.31913 9.48218 2.00731 9.23744 1.76256C8.9927 1.51782 8.68088 1.35115 8.34141 1.28363C8.00194 1.2161 7.65008 1.25076 7.3303 1.38321C7.01053 1.51566 6.73722 1.73997 6.54493 2.02775C6.35264 2.31554 6.25 2.65388 6.25 3C6.25 3.46413 6.43438 3.90925 6.76256 4.23744C7.09075 4.56563 7.53587 4.75 8 4.75ZM8 11.25C7.65388 11.25 7.31554 11.3526 7.02775 11.5449C6.73997 11.7372 6.51566 12.0105 6.38321 12.3303C6.25076 12.6501 6.2161 13.0019 6.28363 13.3414C6.35115 13.6809 6.51782 13.9927 6.76256 14.2374C7.00731 14.4822 7.31913 14.6489 7.65859 14.7164C7.99806 14.7839 8.34993 14.7492 8.6697 14.6168C8.98947 14.4843 9.26278 14.26 9.45507 13.9723C9.64736 13.6845 9.75 13.3461 9.75 13C9.75 12.5359 9.56563 12.0908 9.23744 11.7626C8.90925 11.4344 8.46413 11.25 8 11.25Z" fill="#2A4D61"/>
											  </svg>
										
										<div class="flex-1 flex flex-col gap-1">
											<div class="text-light-text-primary dark:text-dark-text-primary text-semibody-medium">
												{video.title}
											</div>
											<div class="text-light-text-tertiary dark:text-dark-text-tertiary text-mini-body">
												{video.duration}
											</div>
										</div>
										<div class="w-20 h-14 relative rounded-lg overflow-hidden flex-shrink-0">
											<img
												src={video.image}
												alt={video.title}
												class="w-full h-full object-cover"
											/>
											<div class="absolute inset-0 flex items-center justify-center bg-black/20">
												<svg
													class="w-4 h-4 text-white"
													viewBox="0 0 24 24"
													fill="none"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														d="M16.542 11.232C17.167 11.603 17.167 12.507 16.542 12.878L10.39 16.57C9.765 16.94 9 16.488 9 15.738V8.372C9 7.622 9.765 7.17 10.39 7.54L16.542 11.232Z"
														fill="currentColor"
													/>
												</svg>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
					<div class="w-3 h-full bg-light-border/20 dark:bg-dark-border/20 rounded-full overflow-hidden relative">
						<div class="w-3 h-16 bg-brand-red rounded-full absolute top-1"></div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 12px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.05);
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #eb434a;
		border-radius: 10px;
	}
	.custom-scrollbar {
		scrollbar-width: thick;
		scrollbar-color: #eb434a rgba(0, 0, 0, 0.05);
	}
	.dark .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
    }
    .dark .custom-scrollbar {
        scrollbar-color: #eb434a rgba(255, 255, 255, 0.1);
    }
</style> 