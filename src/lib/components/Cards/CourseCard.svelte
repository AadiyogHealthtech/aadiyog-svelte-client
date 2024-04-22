<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import CourseImage from '../../Images/Course.jpg';
	import Dot from '$lib/icons/Dot.svelte';
	import Star from '$lib/icons/Star.svelte';
	import Bookmark from '$lib/icons/Bookmark.svelte';

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		id: string;
		title: string;
		topic: string;
		duration: string;
		videos: string;
		rating: string;
		reviews: string;
		src?: string;
	}

	const BASE_STYLES = 'w-52 px-4 py-3';

	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		dispatch('click', e);
	}
</script>

<div {...$$restProps} data-testid={$$restProps.id} class={BASE_STYLES}>
	<div class="relative">
		<img class="w-52 h-52" alt="CourseImage" src={CourseImage} />
		<button class="absolute right-1 top-1" on:click={handleClick}>
			<Bookmark />
		</button>
	</div>

	<p class="font-semibold text-neutral-grey-2 text-base leading-6 mt-2 mb-2">
		{$$restProps.title}
	</p>

	<p class="font-normal text-neutral-grey-3 text-sm leading-4 mb-2">{$$restProps.topic}</p>

	<div class="flex flex-row items-center mb-2">
		<p class="font-normal text-neutral-grey-3 text-sm leading-4 mr-2">{$$restProps.duration}</p>
		<Dot />
		<p class="font-normal text-neutral-grey-3 text-sm leading-4 ml-2">
			{`${$$restProps.videos} videos`}
		</p>
	</div>

	<div class="flex flex-row items-center mb-2">
		<p class="font-normal text-neutral-grey-3 text-sm leading-4 mr-2">{$$restProps.rating}</p>
		<Star color="#F37003" width={12} height={12} />
		<p class="font-normal text-neutral-grey-3 text-sm leading-4 ml-2">
			{`(${$$restProps.reviews})`}
		</p>
	</div>
</div>
