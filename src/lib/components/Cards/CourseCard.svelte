<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Dot from '$lib/icons/DotIcon.svelte';
	import Star from '$lib/icons/StarIcon.svelte';
	import Bookmark from '$lib/icons/BookmarkIcon.svelte';

	export let id: string;
	export let title: string;
	export let topic: string;
	export let duration: string;
	export let videos: string;
	export let rating: string;
	export let reviews: string;
	export let src: string = '';
	
	export let bookmarked: boolean = false;

	const BASE_STYLES = 'px-2 py-4 min-w-[15rem]'; 
	const dispatch = createEventDispatcher();
function formatDuration(totalMinutes: number | string): string {
	const minutes = Number(totalMinutes) || 0;
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (hours >= 1) {
		return `${hours} h ${remainingMinutes} m`;
	} else {
		return `${remainingMinutes} m`;
	}
}

	function handleClick(e: MouseEvent) {
		dispatch('click', e);
	}
</script>

<div data-testid={id} class={BASE_STYLES}>
	<div class="relative">
		<img class="w-56 h-56 rounded-lg" alt="CourseImage" {src} />


		<!-- Triangular gradient shadow overlay -->
		<div class="absolute top-0 right-0 w-20 h-24 bg-gradient-to-bl from-black/50 via-transparent to-transparent rounded-tr-lg pointer-events-none" style="clip-path: polygon(100% 0%, 0% 0%, 100% 100%);"></div>
		
		<button class="absolute right-2 top-2 " on:click={handleClick}>
			<Bookmark
				stroke={bookmarked ? 'black' : 'white'}
				fill={bookmarked ? 'white' : '#868686'}
				stroke_width={bookmarked ? '0.2' : '1.75'}
			/>
		</button>
	</div>
	<div class="mt-2">
		<p class="flex font-semibold text-neutral-grey-2 text-base leading-6 text-left">
			{title}
		</p>

		<p class="flex font-normal text-neutral-grey-3 text-sm leading-4 mb-2 mt-2 text-left">
			{topic}
		</p>

		<div class="flex items-center mb-2">
			<!-- <p class="font-normal text-neutral-grey-3 text-sm leading-4 mr-2">{duration}</p> -->
			<p class="font-normal text-neutral-grey-3 text-sm leading-4 mr-2">
				{formatDuration(duration)}
			</p>

			<Dot />
			<p class="font-normal text-neutral-grey-3 text-sm leading-4 ml-2">
				{`${videos} Exercise(s)`}
			</p>
		</div>

		<div class="flex items-center mb-2">
			<p class="font-normal text-neutral-grey-3 text-sm leading-4 mr-2">{rating}</p>
			<Star color="#F37003" width={12} height={12} />
			<p class="font-normal text-neutral-grey-3 text-sm leading-4 ml-2">
				{`(${reviews})`}
			</p>
		</div>
	</div>
</div>
