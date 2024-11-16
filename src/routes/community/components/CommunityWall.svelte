<script lang="ts">
	import CommunityCard from '$lib/components/Cards/CommunityCard.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import Profile from '$lib/icons/ProfileIcon.svelte';
	import { createEventDispatcher } from 'svelte';

	let tabs = [
		{ name: 'Community', icon: Community },
		{ name: 'Workout', icon: Courses },
		{ name: 'Profile', icon: Profile }
	];

	let communityPost = [
		{
			id: 'one',
			srcPost: '/assets/images/yoga-pose-2.png',
			srcProfile: '/assets/images/Archana.png',
			name: 'Archana Pawar',
			time: '15 min',
			post: "Embarking on my wellness journey with 'Yoga for Vitality: Beginner's Guide to Thyroid Wellness' feels like a refreshing adventure. Each video is like a friendly guide, starting with easy poses like Sukshma Saans and moving to empowering ones like Sarvangasana. Excited to share my progress with the Aadiyog community!",
			likes: '20 Likes'
		},
		{
			id: 'one',
			srcPost: '/assets/images/yoga-pose-3.png',
			srcProfile: '/assets/images/Sanjay.png',
			name: 'Sanjay Gupta',
			time: '2 hr',
			post: "Embarking on my wellness journey with 'Yoga for Vitality: Beginner's Guide to Thyroid Wellness' feels like a refreshing adventure. Each video is like a friendly guide, starting with easy poses like Sukshma Saans and moving to empowering ones like Sarvangasana. Excited to share my progress with the Aadiyog community!",
			likes: '200 Likes'
		}
	];

	let activeTab = 1;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
</script>

<div class="h-full pt-8 pb-24 flex flex-col items-start w-full overflow-x-hidden">
	<div class="w-full px-8 flex flex-row items-center">
		<MainLogo width={32} height={32} />
		<h1 class="ml-2">Aadiyog</h1>
	</div>
	<div>
		{#each communityPost as post, index}
			<div class="w-full overflow-hidden h-4 mt-4 bg-neutral-grey-11" />
			<div class="px-8">
				<CommunityCard communityPost={post} />
			</div>
		{/each}
	</div>

	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={0} />
	</div>
</div>
