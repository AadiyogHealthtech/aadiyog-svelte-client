<script lang="ts">
	import { goto } from '$app/navigation';
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { createEventDispatcher } from 'svelte';

	let courses = [
		{
			id: 'one',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-2.png'
		},
		{
			id: 'two',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-1.png'
		},
		{
			id: 'three',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
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
</script>

<div class="h-screen pt-8 flex flex-col items-start">
	<div class="w-full px-8 flex flex-row items-center justify-start">
		<button on:click={handleBack}>
			<Back />
		</button>
		<h1 class="w-full flex flex-row items-center justify-center ml-2 text-neutral-grey-3">
			Saved courses
		</h1>
	</div>

	<div class="px-4 pt-8 w-full flex-col grid grid-cols-2">
		{#each courses as obj, i}
			<button class="flex-1 shrink-0" on:click={() => handleClick(i)}>
				<CourseCard
					id={obj.id}
					title={obj.title}
					topic={obj.topic}
					duration={obj.duration}
					videos={obj.videos}
					rating={obj.rating}
					reviews={obj.reviews}
					bookmarked={true}
					src={obj.src}
				/>
			</button>
		{/each}
	</div>
</div>
