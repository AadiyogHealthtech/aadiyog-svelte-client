<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import PlaylistCard from '$lib/components/Cards/PlaylistCard.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import Bookmark from '$lib/icons/BookmarkIcon.svelte';
	import Tick1 from '$lib/icons/Tick1Icon.svelte';
	import { createEventDispatcher } from 'svelte';

	export let src = '/assets/images/yoga-pose-1.png';
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
	function handleBack() {
		goto('/');
	}
	function handleCourseBuy() {
		goto('/buy-subscription');
	}
</script>

<div class="h-full pt-12 flex flex-col items-start">
	<div class="relative w-screen flex flex-row items-center">
		<div
			class="absolute top-0 left-8 flex items-center justify-center z-10 w-8 h-8 rounded-full bg-white shadow-lg"
			on:click={handleBack}
		>
			<Back />
		</div>
		<div
			class="absolute top-0 right-8 flex items-center justify-center z-10 w-8 h-8 rounded-full bg-white shadow-lg"
		>
			<Bookmark />
		</div>
		<img class="absolute -top-12 left-0 w-full z-0" {src} alt="Bookmark" />
	</div>

	<div
		class="absolute pb-32 top-96 px-8 py-8 w-full rounded-t-3xl z-20 bg-white overflow-y-auto scroll"
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
			<div class="w-full h-px bg-neutral-grey-6 -ml-8" />
		</div>
		<div>
			<h1 class="text-neutral-grey-2 mt-4">Playlist</h1>
			{#each playlist as item, index}
				<PlaylistCard id={item.id} title={item.title} duration={item.duration} src={item.src} />
			{/each}
		</div>
	</div>

	<div class="fixed bottom-0 w-full px-12 py-10 drop-shadow-xl z-30 bg-white">
		<Button variant="primary" fullWidth id="Next" on:click={handleCourseBuy}
			>Check Course Plan</Button
		>
	</div>
</div>
