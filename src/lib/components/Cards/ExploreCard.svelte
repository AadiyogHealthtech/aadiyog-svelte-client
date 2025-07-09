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

	const BASE_STYLES = 'px-2 py-2 w-60'; 
	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		dispatch('click', e);
	}
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 overflow-x-hidden">
	<div data-testid={id} class={BASE_STYLES}>
		<div class="relative">
			<img class="w-44 h-44 rounded-lg object-cover" alt="CourseImage" {src} />

			<button class="absolute right-1 top-1" on:click={handleClick}>
				<!-- <Bookmark
					stroke={bookmarked ? 'black' : 'white'}
					fill={bookmarked ? 'white' : '#868686'}
					stroke_width={bookmarked ? '0.2' : '1.75'}
				/> -->
			</button>
		</div>
		<div class="mt-4 px-2">
			<p class="font-semibold text-neutral-grey-2 text-base leading-6 text-left w-44 block min-h-[2rem]">
                {title}
            </p>
              
            <p class="font-normal text-neutral-grey-3 text-sm leading-4 mb-2  text-left block w-44">
                {topic}
            </p>
              
              
              
              

			<div class="flex items-center mb-2">
				<p class="font-normal text-neutral-grey-3 text-sm leading-4 mr-2">{duration}</p>
				<Dot />
				<p class="font-normal text-neutral-grey-3 text-sm leading-4 ml-2">
					{`${videos} videos`}
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
</div>
