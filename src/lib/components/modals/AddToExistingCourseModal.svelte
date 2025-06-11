<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	export let showModal: boolean;

	const dispatch = createEventDispatcher();

	function closeModal() {
		dispatch('close');
	}

	// Mock data for courses
	const courses = [
		{ id: 1, title: 'Principles of user experience and user interface design', duration: '2hrs', image: '/images/videoCardThumb.png' },
		{ id: 2, title: 'Music theory essentials for producers', duration: '4hrs', image: '/images/videoCardThumb.png' },
		{ id: 3, title: 'Basics of Unity or Unreal Engine', duration: '1hr', image: '/images/videoCardThumb.png' },
		{ id: 4, title: 'Plot structure and narrative arcs', duration: '1hr 45 min', image: '/images/videoCardThumb.png' },
		{ id: 5, title: 'Advanced cooking techniques', duration: '3hr 30 min', image: '/images/videoCardThumb.png' }
	];

	let selectedCourseId: number | null = null;
</script>

{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		on:click|self={closeModal}
	>
		<div
			class="w-96 h-[532px] p-4 bg-gradient-to-b from-light-bg-secondary to-light-bg-tertiary dark:from-dark-bg-secondary dark:to-dark-bg-primary rounded-2xl flex flex-col gap-6"
			on:click|stopPropagation
		>
			<div
				class="self-stretch pb-4 border-b border-light-border dark:border-dark-border inline-flex justify-between items-center flex-shrink-0"
			>
				<div class="w-6 h-6" />
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
								on:click={() => (selectedCourseId = course.id)}
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