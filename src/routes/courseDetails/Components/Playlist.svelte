<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import PlaylistCard from '$lib/components/Cards/PlaylistCard.svelte';
	import Back from '$lib/icons/Back.svelte';
	import Bookmark from '$lib/icons/Bookmark.svelte';
	import Tick1 from '$lib/icons/Tick1.svelte';
	import { createEventDispatcher } from 'svelte';

	export let src = '/assets/images/yoga-pose-3.png';
	export let title = 'Title';
	export let steps = ['One', 'Two', 'Three'];
	export let playlist = [
		{
			id: 'one',
			title: 'Lorem ipsum dolor sit tim amet orci proin netla',
			duration: '20 min',
			src: '/assets/images/yoga-pose-1.png'
		},
		{
			id: 'two',
			title: 'Lorem ipsum dolor sit tim amet orci proin netla',
			duration: '20 min',
			src: '/assets/images/yoga-pose-2.png'
		},
		{
			id: 'three',
			title: 'Lorem ipsum dolor sit tim amet orci proin netla',
			duration: '20 min',
			src: '/assets/images/yoga-pose-3.png'
		}
	];

	let activeTab = 0;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
</script>

<div class="h-full px-8 pt-12 flex flex-col items-start overflow-y-hidden">
	<div class="relative w-screen flex flex-row items-center">
		<div
			class="absolute top-0 left-8 flex items-center justify-center z-10 w-8 h-8 rounded-full bg-white shadow-lg"
		>
			<Back />
		</div>
		<div
			class="absolute top-0 right-8 flex items-center justify-center z-10 w-8 h-8 rounded-full bg-white shadow-lg"
		>
			<Bookmark />
		</div>
		<img class="absolute -top-12 left-0 w-screen z-0" {src} alt="Bookmark" />
	</div>

	<div
		class="absolute top-96 px-8 py-8 w-screen rounded-t-3xl z-20 bg-white overflow-y-auto scroll"
	>
		<div>
			<h2 class="text-neutral-grey-3">{title}</h2>
			<h3 class="text-neutral-grey-2 font-bold mt-2">What you’ll get</h3>

			{#each steps as step, index}
				<div class="flex flex-row items-start my-2">
					<Tick1 />
					<h3 class="ml-2 text-neutral-grey-3">{step}</h3>
				</div>
			{/each}
			<div class="w-screen h-px bg-neutral-grey-6 -ml-8" />
		</div>
		<div>
			<h1 class="text-neutral-grey-2 mt-4">Playlist</h1>
			{#each playlist as item, index}
				<PlaylistCard id={item.id} title={item.title} duration={item.duration} src={item.src} />
			{/each}
		</div>
	</div>

	<div class="absolute bottom-0 w-screen px-12 py-10 drop-shadow-xl z-30 bg-white">
		<Button variant="primary" fullWidth id="Next">Check Course Plan</Button>
	</div>
</div>
