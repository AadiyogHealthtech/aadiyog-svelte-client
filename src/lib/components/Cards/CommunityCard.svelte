
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
	let liked = false; // Track if the like button is toggled
	const dispatch = createEventDispatcher();

	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}

	function toggleLike() {
		liked = !liked; // Toggle the liked state
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
		<div class="flex flex-row items-center justify-center cursor-pointer" on:click={toggleLike}>
			<Like style="fill: {liked ? 'orange' : 'none'}; stroke: {liked ? 'orange' : 'grey'}" />
			<h3 class="ml-2 font-bold text-neutral-grey-5">Like</h3>
		</div>
		<div class="flex flex-row items-center justify-center">
			<Share />
			<h3 class="ml-2 text-neutral-grey-5 font-bold">Share</h3>
		</div>
	</div>
</div>

<!-- <script lang="ts">
    import Like from '$lib/icons/LikeIcon.svelte';
    import Share from '$lib/icons/ShareIcon.svelte';
    import { onMount } from 'svelte';
    import { getPosts } from '$lib/utils/api/services';

    interface Post {
        id: string;
        title: string;
        description: string;
        highlightImage: string;
        AadiyogUser: {
            name: string;
            profileImage: string;
        };
        likes: number;
    }

    let posts: Post[] = [];
    let likedPosts: Set<string> = new Set();
    let loading = true;
    let errorMessage = '';

    // Fetch posts on component mount
    // onMount(async () => {
    //     try {
    //         const fetchedPosts = await getPosts();  // Fetch posts from API
    //         if (fetchedPosts) {
    //             posts = fetchedPosts.map((post: any) => ({
    //                 id: post.id,
    //                 title: post.title,
    //                 description: post.description,
    //                 highlightImage: post.highlightImage,
    //                 AadiyogUser: {
    //                     name: post.AadiyogUser?.name || 'Unknown User',
    //                     profileImage: post.AadiyogUser?.profileImage || '/assets/images/default-profile.png',
    //                 },
    //                 likes: post.likes || 0,
    //             }));
    //         }
    //     } catch (error: any) {
    //         errorMessage = error.message || 'Failed to fetch posts.';
    //     } finally {
    //         loading = false;
    //     }
    // });

    onMount(async () => {
    try {
        // Fetch all posts to get their IDs
        const fetchedPosts = await getPosts();  // Fetch posts from API
        if (fetchedPosts) {
            // Dynamically fetch details for each post using the post IDs
            const postsDetails = await Promise.all(fetchedPosts.map(async (post) => {
                const postDetails = await getPosts(post.id); // Fetch each post by ID
                return {
                    id: postDetails.id,
                    title: postDetails.title,
                    description: postDetails.description,
                    highlightImage: postDetails.highlightImage,
                    AadiyogUser: {
                        name: postDetails.AadiyogUser?.name || 'Unknown User',
                        profileImage: postDetails.AadiyogUser?.profileImage || '/assets/images/default-profile.png',
                    },
                    likes: postDetails.likes || 0,
                };
            }));

            posts = postsDetails; // Store the details in the posts array
        }
    } catch (error) {
        errorMessage = error.message || 'Failed to fetch posts.';
    } finally {
        loading = false;
    }
});

    // Toggle like functionality
    function toggleLike(postId: string) {
        if (likedPosts.has(postId)) {
            likedPosts.delete(postId);
        } else {
            likedPosts.add(postId);
        }
    }
</script>

{#if loading}
    <p>Loading posts...</p>
{:else if errorMessage}
    <p class="text-red-500">{errorMessage}</p>
{:else}
    <div class="posts-container">
        {#each posts as post (post.id)}
            <div class="post-card">
                <div class="post-header flex items-center">
                    <img
                        src={post.AadiyogUser.profileImage}
                        alt="User Profile"
                        class="profile-img w-10 h-10 rounded-full"
                    />
                    <div>
                        <h3 class="user-name font-bold">{post.AadiyogUser.name}</h3>
                        <h4 class="post-title text-neutral-grey-5">{post.title}</h4>
                    </div>
                </div>
                <p class="post-description mt-4 text-neutral-grey-2">{post.description}</p>
                <img
                    src={post.highlightImage}
                    alt="Post Highlight"
                    class="post-image w-full h-64 mt-4 rounded-2xl object-cover"
                />
                <div class="post-actions flex justify-between mt-4">
                    <div
                        class="like-section flex items-center cursor-pointer"
                        on:click={() => toggleLike(post.id)}
                    >
                        <Like
                            style="fill: {likedPosts.has(post.id) ? 'orange' : 'none'}; stroke: {likedPosts.has(post.id) ? 'orange' : 'grey'}"
                        />
                        <h3 class="ml-2 font-bold text-neutral-grey-5">
                            {likedPosts.has(post.id) ? post.likes + 1 : post.likes} Likes
                        </h3>
                    </div>
                    <div class="share-section flex items-center cursor-pointer">
                        <Share />
                        <h3 class="ml-2 text-neutral-grey-5 font-bold">Share</h3>
                    </div>
                </div>
            </div>
        {/each}
    </div>
{/if}

<style>
    .posts-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .post-card {
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .profile-img {
        margin-right: 1rem;
    }

    .user-name {
        margin: 0;
    }

    .post-title {
        margin: 0;
        color: gray;
    }

    .post-description {
        margin: 1rem 0;
    }

    .post-image {
        margin: 1rem 0;
        width: 100%;
        border-radius: 1rem;
    }

    .post-actions {
        display: flex;
        justify-content: space-between;
    }

    .like-section {
        display: flex;
        align-items: center;
        cursor: pointer;
    }

    .share-section {
        display: flex;
        align-items: center;
        cursor: pointer;
    }
</style> -->


