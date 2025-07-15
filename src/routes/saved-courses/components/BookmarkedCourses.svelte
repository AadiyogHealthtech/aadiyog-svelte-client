<script lang="ts">
	import { goto } from '$app/navigation';
	import ExploreCard from '$lib/components/Cards/ExploreCard.svelte';
	import Back from '$lib/icons/BackIcon.svelte';

	let courses = [
		{
			id: 'one',
			title: 'Yoga Wellness',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-2.png'
		},
		{
			id: 'two',
			title: 'Stretching',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-1.png'
		},
		{
			id: 'three',
			title: 'Asthma Wellness',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-3.png'
		},
	
	];

	function handleBack() {
		goto('/');
	}
</script>

<div class="h-screen pt-8 flex flex-col items-start">
	<!-- Header -->
	<div class="w-full px-8 flex flex-row items-center justify-start">
		<button on:click={handleBack}>
			<Back />
		</button>
		<h1 class="w-full flex flex-row items-center justify-center text-neutral-grey-3">
			Saved Courses
		</h1>
	</div>

	<!-- Grid Layout -->
	<div class="w-full grid grid-cols-2 gap-4 px-2 mt-6">
		{#each courses as obj}
			<div>
				<ExploreCard
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
			</div>
		{/each}
	</div>
</div>

<style>
	/* Ensures cards are responsive */
	.grid {
		width: 100%;
	}
	.grid-cols-2 {
		display: grid;
		grid-template-columns: repeat(2, 1fr); /* Creates two equal-width columns */
	}
	.gap-4 {
		gap: 1rem; /* Adds spacing between grid items */
	}
</style>
