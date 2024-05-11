<script lang="ts">
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Bookmark from '$lib/icons/Bookmark.svelte';
	import Community from '$lib/icons/Community.svelte';
	import Courses from '$lib/icons/Courses.svelte';
	import MainLogo from '$lib/icons/MainLogo.svelte';
	import Profile from '$lib/icons/Profile.svelte';
	import { createEventDispatcher } from 'svelte';

	let tabs = [
		{ name: 'Courses', icon: Courses },
		{ name: 'Community', icon: Community },
		{ name: 'Profile', icon: Profile }
	];

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
	<div class="w-screen px-8 flex flex-row items-center justify-center">
		<MainLogo width={32} height={32} />
		<h1 class="ml-2">Aadiyog</h1>
		<button class="ml-auto">
			<Bookmark stroke="#333333" fill="white" />
		</button>
	</div>

	<h2 class="px-8 pt-8 text-neutral-grey-4">Good morning</h2>

	<div class="w-screen px-8 py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Recommended for you</h1>
		<h3 class="text-neutral-grey-2">See All</h3>
	</div>

	<div class="flex w-full max-w-full overflow-x-auto">
		{#each courses as obj, i}
			<button class="flex-1" on:click={() => handleClick(i)}>
				<CourseCard
					id={obj.id}
					title={obj.title}
					topic={obj.topic}
					duration={obj.duration}
					videos={obj.videos}
					rating={obj.rating}
					reviews={obj.reviews}
				/>
			</button>
		{/each}
	</div>

	<div class="w-screen px-8 py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Explore</h1>
		<h3 class="text-neutral-grey-2">See All</h3>
	</div>

	<div class="w-screen px-8 py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Free courses</h1>
		<h3 class="text-neutral-grey-2">See All</h3>
	</div>

	<div class="flex h-screen flex-col justify-end">
		<BottomTabBar {tabs} id="One" />
	</div>
</div>
