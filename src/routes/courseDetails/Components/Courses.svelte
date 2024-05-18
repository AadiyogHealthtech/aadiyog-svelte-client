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
			reviews: '16',
			src: '/assets/images/yoga-pose.jpg'
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
			src: '/assets/images/yoga-pose-4.png'
		}
	];
	let explore = [
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
			src: '/assets/images/yoga-pose-3.png'
		},
		{
			id: 'three',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-5.png'
		}
	];
	let freeCourses = [
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
			src: '/assets/images/yoga-pose-6.png'
		},
		{
			id: 'three',
			title: 'Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit',
			topic: 'Meditation',
			duration: '1 hr 10 min',
			videos: '5',
			rating: '4.8',
			reviews: '16',
			src: '/assets/images/yoga-pose-8.png'
		}
	];

	let activeTab = 0;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
</script>

<div class="h-full px-8 pt-8 flex flex-col items-start w-full overflow-x-hidden">
	<div class="w-full flex flex-row items-center justify-center">
		<MainLogo width={32} height={32} />
		<h1 class="ml-2">Aadiyog</h1>
		<button class="ml-auto">
			<Bookmark stroke="#333333" fill="white" />
		</button>
	</div>

	<h2 class=" pt-8 text-neutral-grey-4">Good morning</h2>

	<div class="w-full py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Recommended for you</h1>
		<h3 class="text-neutral-grey-2">See All</h3>
	</div>

	<div class="flex w-full overflow-x-auto scroll -ml-4">
		{#each courses as course, i}
			<div class="" on:click={() => handleClick(i)}>
				<CourseCard
					id={course.id}
					title={course.title}
					topic={course.topic}
					duration={course.duration}
					videos={course.videos}
					rating={course.rating}
					reviews={course.reviews}
					src={course.src}
				/>
			</div>
		{/each}
	</div>

	<div class="w-full py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Explore</h1>
		<h3 class="text-neutral-grey-2">See All</h3>
	</div>

	<!-- <div class="flex w-full overflow-x-auto scroll">
		{#each explore as course, i}
			<div class="flex-1 shrink-0 pr-4" on:click={() => handleClick(i)}>
				<CourseCard
					id={course.id}
					title={course.title}
					topic={course.topic}
					duration={course.duration}
					videos={course.videos}
					rating={course.rating}
					reviews={course.reviews}
					src={course.src}
				/>
			</div>
		{/each}
	</div> -->

	<div class="w-full py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Free courses</h1>
		<h3 class="text-neutral-grey-2">See All</h3>
	</div>
	<!-- 
	<div class="flex w-full overflow-x-auto scroll">
		{#each freeCourses as course, i}
			<div class="flex-1 shrink-0 pr-4" on:click={() => handleClick(i)}>
				<CourseCard
					id={course.id}
					title={course.title}
					topic={course.topic}
					duration={course.duration}
					videos={course.videos}
					rating={course.rating}
					reviews={course.reviews}
					src={course.src}
				/>
			</div>
		{/each}
	</div> -->

	<div class="absolute bottom-0 left-0 w-full">
		<BottomTabBar {tabs} id="One" />
	</div>
</div>
