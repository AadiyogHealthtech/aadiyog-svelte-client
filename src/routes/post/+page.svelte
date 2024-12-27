<!-- <script lang="ts">
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

	<div class="flex flex-row items-center justify-center">
		<h2 class="text-neutral-grey-3 font-bold">Post on community</h2>
		<button class="absolute top-9 right-8">
			<h3 class="text-neutral-grey-3">Discard</h3>
		</button>
	</div>

	{#if errorMessage}
		<div class="mt-4 text-red-500">{errorMessage}</div>
	{/if}


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

	<Button
		id="Post"
		variant="primary"
		class="mt-6"
		on:click={handlePost}
		disabled={isLoading}
	>
		{isLoading ? 'Posting...' : 'Post'}
	</Button>


	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} id="One" activeTab={1} />
	</div>
</div> 


 
   -->
<!-- 
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

	const uploadImage = async () => {
		if (!selectedImage) return;
		
		const token = getToken();
		
		
		if (!token) {
			errorMessage = 'User is not authenticated. Please log in again.';
			return;
		}

		const formData = new FormData();
		formData.append('files', selectedImage);

		try {
			const response = await fetch('https://v1.app.aadiyog.in/api/posts', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			const data = await response.json();
			if (response.ok && data && data[0].id) {
				uploadedImageId = data[0].id;
			} else {
				throw new Error('Image upload failed.');
			}
		} catch (error) {
			console.error('Image Upload Error:', error);
			errorMessage = 'Failed to upload image.';
		}
	};

	const handlePost = async () => {
	if (!postContent.trim()) {
		errorMessage = 'Post content cannot be empty.';
		return;
	}

	const token = getToken();
	
	// const user = localStorage.getItem('user') ;
	// console.log("user",user);
	const userString = localStorage.getItem('user');
	const user = userString ? JSON.parse(userString) : null;

	if (!token) {
		errorMessage = 'User is not authenticated. Please log in again.';
		return;
	}

	try {
		isLoading = true;
		errorMessage = '';

		const formData = new FormData();
		formData.append('data', JSON.stringify({
			title: postTitle,
			description: postContent,
			AadiyogUser: user.id,

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
		<button class="absolute top-9 right-8">
			<h3 class="text-neutral-grey-3">Discard</h3>
		</button>
	</div>

	{#if errorMessage}
		<div class="mt-4 text-red-500">{errorMessage}</div>
	{/if}

	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Upload Image</h2>
		<input type="file" accept="image/*" class="mt-4" on:change={handleFileChange} />
	</div>
	<div class="mt-8">
		<h3 class="text-neutral-grey-2 font-bold">Post Title</h3>
		<input type="text" class="mt-2 p-4 w-full border rounded-xl" placeholder="Enter post title..." on:input={handleTitleInput} />
	</div>

	<div class="mt-8">
		<h3 class="text-neutral-grey-2 font-bold">Post Content</h3>
		<textarea class="mt-2 p-4 w-full border rounded-xl" placeholder="Write post content..." on:input={handleInput} />
	</div>

	<Button variant="primary" class="mt-6" on:click={handlePost} disabled={isLoading}>
		{isLoading ? 'Posting...' : 'Post'}
	</Button>

	<div class="fixed bottom-0 left-0 w-full bg-white">
		<BottomTabBar {tabs} activeTab={1} />
	</div>
</div> -->


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
				AadiyogUser: user.id,
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
		<button class="absolute top-9 right-8">
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
		<h3 class="text-neutral-grey-2 font-bold">Post Title</h3>
		<input type="text" class="mt-2 p-4 w-full border rounded-xl" placeholder="Enter post title..." on:input={handleTitleInput} />
	</div>

	<div class="mt-8">
		<h2 class="text-neutral-grey-3 font-bold">Add Image</h2>
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

