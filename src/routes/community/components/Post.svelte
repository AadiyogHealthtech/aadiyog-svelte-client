<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import Profile from '$lib/icons/ProfileIcon.svelte';

	export let src = '/assets/images/yoga-pose-5.png';
	export let name = '';

	let tabs = [
		{ name: 'Courses', icon: Courses },
		{ name: 'Community', icon: Community },
		{ name: 'Profile', icon: Profile }
	];

	const handleInput = (e: any) => {
		name = e.target.value;
	};
</script>

<div class="h-full px-8 py-8">
	<div class="flex flex-row items-center justify-center">
		<h2 class="text-neutral-grey-3 font-bold">Post on community</h2>
		<button class="absolute top-9 right-8"><h3 class="text-neutral-grey-3">Discard</h3></button>
	</div>

	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Well done!</h2>
		<h3 class="text-neutral-grey-5">Post your progress on the community wall </h3>
	</div>

	<div class="mt-6">
		<h3 class="text-neutral-grey-2 font-bold">Image</h3>
		
	</div>

	<div class="mt-8">
		<h3 class="text-neutral-grey-2 font-bold">Post Content</h3>
		<textarea
			class="mt-2 p-4 w-full border border-neutral-grey-8 rounded-xl"
			name="PostContent"
			rows="7"
			placeholder="Write post content here..."
			on:input={handleInput}
		/>
	</div>

	<div class="w-full mt-8 flex justify-end">
		<Button id="Post" variant="primary">Post</Button>
	</div>

	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={1} />
	</div>
</div>
