<script lang="ts">
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import Back from '$lib/icons/Back.svelte';
	import { createEventDispatcher } from 'svelte';

	let courses = [
		{
			id: 'one',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16'
		},
		{
			id: 'two',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16'
		},
		{
			id: 'three',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16'
		}
	];

	let activeTab = 0;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
</script>

<div class="h-screen px-8 pt-8 flex flex-col items-start">
	<div class="w-screen px-8 flex flex-row items-center justify-start">
		<Back />
		<h1 class="w-screen flex flex-row items-center justify-center ml-2 text-neutral-grey-3">
			Recommended for you
		</h1>
	</div>

	<div class="px-4 pt-8 w-screen flex-col grid grid-cols-2">
		{#each courses as obj, i}
			<button on:click={() => handleClick(i)}>
				<CourseCard
					id={obj.id}
					title={obj.title}
					topic={obj.topic}
					duration={obj.duration}
					videos={obj.videos}
					rating={obj.rating}
					reviews={obj.reviews}
					bookmarked={false}
				/>
			</button>
		{/each}
	</div>
</div>
