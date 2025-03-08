<script lang="ts">
  import { goto } from "$app/navigation";
  import { getUserData, likePost } from "../../utils/api/services";

  export let post: {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    likes: {
      count: number;
      users: { id: number; name?: string; email?: string }[];
    };
    highlightImages: string[];
    user: any;
  };

  // Safely access user properties with fallbacks
  const name = post.user?.data?.attributes?.name || post.user?.name || "Unknown";
  const imageURL =
    post.user?.data?.attributes?.image?.data?.attributes?.url ||
    post.user?.image ||
    "/assets/images/Manu.webp";

  // Get the current user's ID from localStorage with proper error handling
  let currentUserId: number;
  
  // Using try-catch to handle localStorage errors (e.g., when in private browsing)
  try {
    const userId = localStorage.getItem("userId");
    currentUserId = userId ? parseInt(userId) : 0;
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    currentUserId = 0;
  }

  // Properly check if the post is liked by the current user
  function isLikedByMe() {
    if (!post.likes?.users) {
      return false;
    }
    
    const likeIds = post.likes.users.map(user => user.id);
    return likeIds.includes(currentUserId);
  }

  // Initialize like state
  let liked = isLikedByMe();
  let likesCount = post.likes?.count || 0;
  
  // Image slider variables
  let currentSlide = 0;
  let sliderContainer: HTMLDivElement;

  // Toggle like
  async function toggleLike() {
    if (currentUserId === 0) {
      alert("Please log in to like posts");
      return;
    }
    
    try {
      const result = await likePost(post.id, currentUserId);
      if (result) {
        liked = result.liked;
        likesCount = result.likesCount;
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      alert("Failed to update like status");
    }
  }

  // Update `currentSlide` based on scroll position
  function handleScroll() {
    if (!sliderContainer || !post.highlightImages.length) return;
    
    const slideWidth = sliderContainer.scrollWidth / post.highlightImages.length;
    const scrollLeft = sliderContainer.scrollLeft;
    currentSlide = Math.round(scrollLeft / slideWidth);
  }

  // Navigate to a specific slide
  function goToSlide(index: number) {
    if (!sliderContainer || !post.highlightImages.length) return;
    
    currentSlide = index;
    const slideWidth = sliderContainer.scrollWidth / post.highlightImages.length;
    sliderContainer.scrollTo({
      left: slideWidth * index,
      behavior: "smooth",
    });
  }

  // Copy post link to clipboard
  function copyPostLink() {
    const postLink = `https://v2.app.aadiyog.in/api/posts/${post.id}`;
    navigator.clipboard.writeText(postLink)
      .then(() => alert("Link copied to clipboard!"))
      .catch(err => console.error("Could not copy link:", err));
  }

  // Navigate to user profile
  function goToUserProfile() {
    const userId = post.user?.data?.id || post.user?.id;
    if (userId) {
      goto(`/profile/${userId}`);
    }
  }
</script>

<div class="h-full pt-8 flex flex-col items-start w-full overflow-x-hidden">
  <!-- User Information -->
  <div class="w-full flex flex-row items-center">
    <img src={imageURL} alt="Profile" class="w-10 h-10 rounded-full object-cover" />
    <div class="ml-2">
      <a href="#" on:click|preventDefault={goToUserProfile} class="text-black text-lg font-bold hover:text-gray-600">{name}</a>
      <h4 class="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</h4>
    </div>
  </div>

  <!-- Post Content -->
  <div class="mt-4 w-full">
    <p class="text-gray-800 pb-4">{post.description}</p>

    <!-- Highlight Images Scrollable Slider -->
    {#if post.highlightImages && post.highlightImages.length > 0}
      <div
        bind:this={sliderContainer}
        on:scroll={handleScroll}
        class="relative w-full overflow-x-auto flex items-center space-x-4 scrollbar-hide"
      >
        {#each post.highlightImages as image}
          <img src={image} alt="Post content" class="w-96 h-80 object-cover rounded-lg flex-shrink-0" />
        {/each}
      </div>

      <!-- Dots for Slide Navigation -->
      {#if post.highlightImages.length > 1}
        <div class="flex justify-center mt-7">
          {#each post.highlightImages as _, index}
            <button
              class={`rounded-full mx-1 ${
                index === currentSlide ? "w-3 h-3 bg-gray-800" : "w-2 h-2 bg-gray-300"
              }`}
              on:click={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Likes Count -->
    <h3 class="mt-4 text-gray-600">{likesCount} {likesCount === 1 ? "Like" : "Likes"}</h3>
  </div>

  <!-- Divider -->
  <div class="mt-4 w-full h-px bg-gray-300"></div>

  <!-- Like and Share Buttons -->
  <div class="mt-4 w-full flex justify-between items-center">
    <!-- Like Button -->
    <div class="flex items-center cursor-pointer" on:click={toggleLike}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={liked ? "orange" : "none"}
        stroke={liked ? "orange" : "gray"}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-6 h-6"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        ></path>
      </svg>
      <h3 class="ml-2 font-medium text-gray-800">{liked ? "Liked" : "Like"}</h3>
    </div>

    <!-- Share Button -->
    <div class="flex items-center cursor-pointer" on:click={copyPostLink}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-6 h-6 text-gray-700"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <h3 class="ml-2 font-medium text-gray-800">Share</h3>
    </div>
  </div>
</div>

<style>
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>