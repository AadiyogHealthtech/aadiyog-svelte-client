<script lang="ts">
    import Button from '$lib/components/Button/Button.svelte';
    import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
    import Community from '$lib/icons/CommunityIcon.svelte';
    import Courses from '$lib/icons/CoursesIcon.svelte';
    import Profile from '$lib/icons/ProfileIcon.svelte';
    import { goto } from '$app/navigation';

    let postContent = '';
    let postTitle = '';
    let isLoading = false;
    let errorMessage = '';
    let selectedImages: File[] = [];
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
        if (target.files) {
            selectedImages = [...selectedImages, ...Array.from(target.files)];
        }
    };

    const deleteImage = (index: number) => {
        selectedImages.splice(index, 1);
        selectedImages = [...selectedImages];
    };

    const handlePost = async () => {
    if (!postTitle.trim() && selectedImages.length === 0) {
        errorMessage = 'Please add a title or at least one image.';
        return;
    }

    const token = getToken();
    const userId = localStorage.getItem("userId");
    console.log(userId);
    if (!userId) {
    errorMessage = 'User ID is missing. Please log in again.';
    return;
}

    if (!token) {
        errorMessage = 'User is not authenticated. Please log in again.';
        return;
    }

    try {
        isLoading = true;
        errorMessage = '';

        // Prepare the `data` payload
        const dataPayload = {
            title: postTitle || "Community Post",
            description: postContent || "",
            user:userId
        };

        // Create FormData object
        const formData = new FormData();
        formData.append('data', JSON.stringify(dataPayload)); // Correctly append the `data` payload as a JSON string

        // Append images
        selectedImages.forEach((image) => {
            formData.append('files.highlightImage', image);
        });

        // Make the POST request
        const response = await fetch('https://v2.app.aadiyog.in/api/posts', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`, // Add the authorization header
            },
            body: formData, // Pass the FormData object as the request body
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error?.message || 'Failed to post.');
        }

        // Navigate to the community page on success
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
        <h2 class="text-neutral-grey-3 font-bold">Post on Community</h2>
        <button class="absolute top-9 right-8" onclick="window.location.href='/community'">
            <h3 class="text-neutral-grey-3">Discard</h3>
        </button>
    </div>
    <h2 class="text-neutral-grey-3 font-bold mt-10">Well done!</h2>
    <h3 class="text-neutral-grey-3 text-lg mt-2">Post your progress on the community wall</h3>

    {#if errorMessage}
        <div class="mt-4 text-red-500">{errorMessage}</div>
    {/if}

    <div class="mt-8">
        <h2 class="text-neutral-grey-3 font-bold">Post Title</h2>
        <input
            type="text"
            class="mt-2 p-4 w-full border rounded-xl"
            placeholder="Enter post title..."
            on:input={handleTitleInput}
        />
    </div>

    <div class="mt-8">
        <h3 class="text-neutral-grey-3 font-bold">Add Images</h3>
        <div class="mt-4 flex flex-wrap gap-4">
            {#each selectedImages as image, index}
                <div class="relative w-20 h-20 border border-dashed border-2 rounded-xl">
                    <img src={URL.createObjectURL(image)} alt={`Image ${index + 1}`} class="w-full h-full object-cover rounded-xl" />
                    <button
                        type="button"
                        class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        on:click={() => deleteImage(index)}
                    >
                        ×
                    </button>
                </div>
            {/each}
            <div class="w-20 h-20 border-dashed border-2 flex items-center justify-center rounded-xl cursor-pointer relative">
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    class="absolute opacity-0 w-full h-full cursor-pointer"
                    on:change={handleFileChange}
                />
                <span class="text-neutral-grey-3 text-lg">+</span>
            </div>
        </div>
    </div>

    <div class="mt-8">
        <h3 class="text-neutral-grey-2 font-bold">Post Content (Optional)</h3>
        <textarea
            class="mt-2 p-6 w-full h-48 border rounded-xl"
            placeholder="Write post content..."
            on:input={handleInput}
        />
    </div>

    <div class="flex justify-end">
        <Button variant="primary" class="mt-6" on:click={handlePost} disabled={isLoading}>
            {isLoading ? 'Posting...' : 'Post'}
        </Button>
    </div>

    <div class="fixed bottom-0 left-0 w-full bg-white">
        <BottomTabBar {tabs} activeTab={1} />
    </div>
</div>

