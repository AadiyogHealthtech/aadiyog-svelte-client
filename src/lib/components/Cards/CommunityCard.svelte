<script lang="ts">
	import Like from '$lib/icons/LikeIcon.svelte';
	import Share from '$lib/icons/ShareIcon.svelte';
	import { createEventDispatcher } from 'svelte';

	export let communityPost = {
		id: 'one',
		srcPost: '/assets/images/yoga-pose-2.png',
		srcProfile: '/assets/images/Archana.png',
		name: 'Archana Pawar',
		time: '15 min',
		post: "Embarking on my wellness journey with 'Yoga for Vitality: Beginner's Guide to Thyroid Wellness' feels like a refreshing adventure. Each video is like a friendly guide, starting with easy poses like Sukshma Saans and moving to empowering ones like Sarvangasana. Excited to share my progress with the Aadiyog community!",
		likes: '20 Likes'
	};

	let activeTab = 1;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
</script>

<div class="h-full pt-8 flex flex-col items-start w-full overflow-x-hidden">
	<div class="w-full flex flex-row items-center">
		<img src={communityPost.srcProfile} alt="ProfileImage" class="w-10 h-10 rounded-full" />
		<div>
			<h3 class="ml-2 text-neutral-grey-2 font-bold">{communityPost.name}</h3>
			<h4 class="ml-2 text-neutral-grey-5">{communityPost.time}</h4>
		</div>
	</div>

	<div>
		<p class="mt-4 text-neutral-grey-2">{communityPost.post}</p>
		<img
			src={communityPost.srcPost}
			alt="PostImage"
			class="w-full h-64 mt-4 rounded-2xl object-cover"
		/>
		<h3 class="mt-4 text-neutral-grey-5">{communityPost.likes}</h3>
	</div>

	<div class="mt-2 w-full h-px bg-neutral-grey-7" />

	<div class="mt-4 w-full flex flex-row justify-between">
		<div class="flex flex-row items-center justify-center">
			<Like />
			<h3 class="ml-2 text-neutral-grey-5 font-bold">Like</h3>
		</div>
		<div class="flex flex-row items-center justify-center">
			<Share />
			<h3 class="ml-2 text-neutral-grey-5 font-bold">Share</h3>
		</div>
	</div>
</div>
