<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import Back from '$lib/icons/Back.svelte';
	import { createEventDispatcher } from 'svelte';
	import Height from '../../personalization/Components/Height.svelte';
	import { goto } from '$app/navigation';

	let courses = [
		{
			id: 'one',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-7.png'
		},
		{
			id: 'two',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-8.png'
		},
		{
			id: 'three',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-9.png'
		}
	];

	let topics = ['Meditation', 'Sports', 'Yoga'];

	let activeTab = 0;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
	function handleBack() {
		goto('/courseDetails/1');
	}
</script>

<div class="h-screen pt-8 flex flex-col items-start">
	<div class="w-full px-8 flex flex-row items-center justify-start">
		<button on:click={handleBack}>
			<Back />
		</button>
		<h1 class="w-full flex flex-row items-center justify-center ml-2 text-neutral-grey-3">
			Explore
		</h1>
	</div>

	<div class="px-4 pt-8 w-full flex flex-row">
		{#each topics as name, i}
			<div class="ml-4">
				<IconButton id={name} width={20} height={16} removeTick={true} rounded={'full'}
					>{name}</IconButton
				>
			</div>
		{/each}
	</div>

	<div class="px-4 pt-8 w-full flex-col grid grid-cols-2">
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
					src={obj.src}
				/>
			</button>
		{/each}
	</div>
</div>
