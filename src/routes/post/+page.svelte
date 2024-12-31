
<script lang="ts"> 
	import Button from '$lib/components/Button/Button.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import Profile from '$lib/icons/ProfileIcon.svelte';
	import { goto } from '$app/navigation';

	export let src = '/assets/images/yoga-pose-5.png';
	export let name = '';

	let postContent = '';
	let postTitle = '';
	let isLoading = false;
	let errorMessage = '';
	let selectedImage: File | null = null;
	let uploadedImageId = '';
	let toggleActive = false;

	let tabs = [
		{ name: 'Community', icon: Community },
		{ name: 'Workout', icon: Courses },
		{ name: 'Profile', icon: Profile }
	];

	const getToken = () => localStorage.getItem('authToken');

	const handleInput = (e: any) => {
		postContent = e.target.value;
	};
	const handleTitleInput = (e: any) => {
		postTitle = e.target.value;
	};
	const handleFileChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			selectedImage = target.files[0];
		}
	};

	const toggleButton = () => {
		toggleActive = !toggleActive;
	};

	const handlePost = async () => {
		if (!postContent.trim()) {
			errorMessage = 'Post content cannot be empty.';
			return;
		}

		const token = getToken();
		const userString = localStorage.getItem('user');
		const user = userString ? JSON.parse(userString) : null;
		const userId = localStorage.getItem("userId");
		console.log(user.id);
		if (!token) {
			errorMessage = 'User is not authenticated. Please log in again.';
			return;
		}

		try {
			isLoading = true;
			errorMessage = '';

			const formData = new FormData();
			formData.append('data', JSON.stringify({
				title: postTitle || "Communtity Post",
				description: postContent,
				user: userId ,
			}));

			if (selectedImage) {
				formData.append('files.highlightImage', selectedImage);
			}

			const response = await fetch('https://v1.app.aadiyog.in/api/posts', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			if (!response.ok) {
				const errorResponse = await response.json();
				throw new Error(errorResponse.error?.message || 'Failed to post.');
			}

			goto('/community');
		} catch (error: any) {
			console.error('Post Error:', error);
			errorMessage = error.message || 'An error occurred while posting.';
		} finally {
			isLoading = false;
		}
	};
</script>

<div class="h-full px-8 py-8">
	<div class="flex flex-row items-center justify-center">
		<h2 class="text-neutral-grey-3 font-bold">Post on community</h2>
		<button class="absolute top-9 right-8" onclick="window.location.href='/community'">
			<h3 class="text-neutral-grey-3">Discard</h3>
		</button>
		
	</div>

	{#if errorMessage}
		<div class="mt-4 text-red-500">{errorMessage}</div>
	{/if}

	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Post your progress on community wall</h2>
	</div>
	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Well done!</h2>
	</div>
	<div class="mt-0">
		<h3 class="text-neutral-grey-3">Post your progress on the community wall</h3>
	</div>

	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Post Title </h2>
		<input type="text" class="mt-2 p-4 w-full border rounded-xl" placeholder="Enter post title..." on:input={handleTitleInput} />
	</div>

	<div class="mt-8">
		<h3 class="text-neutral-grey-3 font-bold">Add Image</h3>
		<div class="mt-4 w-20 h-20 border-dashed border-2 flex items-center justify-center rounded-xl cursor-pointer relative">
			{#if selectedImage}
				<img src={URL.createObjectURL(selectedImage)} alt="Uploaded Image" class="w-full h-full object-cover rounded-xl" />
			{:else}
				<input type="file" accept="image/*" class="absolute opacity-0 w-full h-full cursor-pointer" on:change={handleFileChange} />
				<span class="text-neutral-grey-3 text-lg">+</span>
			{/if}
		</div>
	</div>
	

	<div class="mt-8">
		<h3 class="text-neutral-grey-2 font-bold">Post Content</h3>
		<textarea
			class="mt-2 p-6 w-full h-48 border rounded-xl"
			placeholder="Write post content..."
			on:input={handleInput}
		/>
	</div>
	

	<div class="flex justify-end ">
    <Button variant="primary" class="mt-6" on:click={handlePost} disabled={isLoading}>
        {isLoading ? 'Posting...' : 'Post'}
    </Button>
</div>

	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} activeTab={1} />
	</div>
</div>

