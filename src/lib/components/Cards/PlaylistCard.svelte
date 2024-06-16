<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Play from '$lib/icons/PlayIcon.svelte';

	export let id: string;
	export let title: string;
	export let duration: string;
	// export let videos: string;
	export let src: string = '';

	const BASE_STYLES = 'py-4 flex flex-row';

	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		dispatch('click', e);
	}
</script>

<div data-testid={id} class={BASE_STYLES}>
	<div class="flex items-center justify-center">
		<img class="w-48 h-32" alt="CourseImage" {src} />

		<button class="absolute" on:click={handleClick}>
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
