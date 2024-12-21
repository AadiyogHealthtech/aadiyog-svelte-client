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
	let isLoading = false;
	let errorMessage = '';

	let tabs = [
		
		{ name: 'Community', icon: Community },
		{ name: 'Workout', icon: Courses },
		{ name: 'Profile', icon: Profile }
	];

	// Fetch token from localStorage
	const getToken = () => localStorage.getItem('authToken');

	const handleInput = (e: any) => {
		postContent = e.target.value;
	};

	const handlePost = async () => {
    if (!postContent.trim()) {
        errorMessage = 'Post content cannot be empty.';
        return;
    }

    const token = getToken();
    if (!token) {
        errorMessage = 'User is not authenticated. Please log in again.';
        return;
    }

    try {
        isLoading = true;
        errorMessage = '';

        const payload = {
            data: {
                title: name || 'Community Post',
                description: postContent,
            },
        };

        console.log('Request Payload:', payload);

        const response = await fetch('https://v1.app.aadiyog.in/api/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        console.log('Full API Response:', response);

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error('Error Response:', errorResponse);
            throw new Error(errorResponse.error?.message || 'Failed to post.');
        }

        const responseData = await response.json();
        console.log('Parsed JSON Response:', responseData);

        if (responseData && responseData.data && responseData.data.attributes) {
            console.log('Post successful:', responseData.data);
            goto('/community'); // Navigate to the community page
        } else {
            throw new Error('Unexpected response format. No valid data returned.');
        }
    } catch (error: any) {
        console.error('Post Error:', error);
        errorMessage = error.message || 'An error occurred while posting.';
    } finally {
        isLoading = false;
    }
};
</script>

<div class="h-full px-8 py-8">
	<!-- Header -->
	<div class="flex flex-row items-center justify-center">
		<h2 class="text-neutral-grey-3 font-bold">Post on community</h2>
		<button class="absolute top-9 right-8">
			<h3 class="text-neutral-grey-3">Discard</h3>
		</button>
	</div>

	<!-- Error Message -->
	{#if errorMessage}
		<div class="mt-4 text-red-500">{errorMessage}</div>
	{/if}

	<!-- Post Details -->
	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Well done!</h2>
		<h3 class="text-neutral-grey-5">Post your progress on the community wall</h3>
	</div>

	<div class="mt-6">
		<h3 class="text-neutral-grey-2 font-bold">Image</h3>
		<img class="mt-2 w-32 h-32 rounded-xl" alt="PostImage" {src} />
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

	<!-- Post Button -->
	<Button
		id="Post"
		variant="primary"
		class="mt-6"
		on:click={handlePost}
		disabled={isLoading}
	>
		{isLoading ? 'Posting...' : 'Post'}
	</Button>

	<!-- Bottom Tab Bar -->
	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={1} />
	</div>
</div>
