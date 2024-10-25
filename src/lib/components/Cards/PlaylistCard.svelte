<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Play from '$lib/icons/PlayIcon.svelte';
	import CrossIcon from '$lib/icons/CrossIcon.svelte';

	export let id: string;
	export let title: string;
	export let duration: string;
	export let youtubeUrl: string = '';
	export let src: string = '';

	let showModal = false;
	let videoId: string = '';

	const BASE_STYLES = 'py-4 flex flex-row';
	const MODAL_OVERLAY_STYLES =
		'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
	const MODAL_CONTENT_STYLES = 'bg-white rounded-lg p-4 relative max-w-4xl w-full mx-4';

	const dispatch = createEventDispatcher();

	$: {
		if (youtubeUrl) {
			console.log({ youtubeUrl });
			// Extract video ID from different YouTube URL formats
			const urlObj = new URL(youtubeUrl);
			if (urlObj.hostname.includes('youtube.com')) {
				videoId = urlObj.searchParams.get('v') || '';
			} else if (urlObj.hostname === 'youtu.be') {
				videoId = urlObj.pathname.slice(1);
			}
		}
	}

	function handleClick(e: MouseEvent) {
		if (youtubeUrl && videoId) {
			showModal = true;
		}
		dispatch('click', e);
	}

	function closeModal() {
		showModal = false;
	}

	// Close modal on escape key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div data-testid={id} class={BASE_STYLES}>
	<div class="flex items-center justify-center relative">
		<img class="w-[150px] h-[150px] object-cover rounded-lg" alt="CourseImage" {src} />
		<button
			class="absolute hover:scale-110 transition-transform duration-200"
			on:click={handleClick}
			aria-label="Play video"
		>
			<Play />
		</button>
	</div>
	<div class="mt-1 ml-4">
		<h2 class="text-neutral-grey-2 font-bold">
			{title}
		</h2>
		<h3 class="text-neutral-grey-4 mt-2">
			{duration}
		</h3>
	</div>
</div>

{#if showModal}
	<div
		class={MODAL_OVERLAY_STYLES}
		on:click|self={closeModal}
		role="dialog"
		aria-labelledby="video-modal-title"
	>
		<div class={MODAL_CONTENT_STYLES}>
			<button
				class="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
				on:click={closeModal}
				aria-label="Close modal"
			>
				<CrossIcon />
			</button>
			<h2 id="video-modal-title" class="sr-only">{title}</h2>
			<div class="relative pt-[56.25%]">
				<iframe
					{title}
					class="absolute top-0 left-0 w-full h-full"
					src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
					modestbranding
				></iframe>
			</div>
		</div>
	</div>
{/if}
