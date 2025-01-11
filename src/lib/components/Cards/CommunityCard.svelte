<script lang="ts">
  export let post: {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    likes: number;
    highlightImages: string[];
    user: string;
  };

  let liked = 0;
  let currentSlide = 0; // Track the current slide
  let sliderContainer: HTMLDivElement;

  function toggleLike() {
    liked = liked === 0 ? 1 : 0;
    post.likes += liked === 1 ? 1 : -1;
  }

  // Update `currentSlide` based on scroll position
  function handleScroll() {
    const slideWidth = sliderContainer.scrollWidth / post.highlightImages.length;
    const scrollLeft = sliderContainer.scrollLeft;
    currentSlide = Math.round(scrollLeft / slideWidth);
  }

  // Navigate to a specific slide
  function goToSlide(index: number) {
    currentSlide = index;
    const slideWidth = sliderContainer.scrollWidth / post.highlightImages.length;
    sliderContainer.scrollTo({
      left: slideWidth * index,
      behavior: 'smooth',
    });
  }

  // Copy post link to clipboard
  function copyPostLink() {
    const postLink = `https://v1.app.aadiyog.in/api/posts/${post.id}`; // Replace with your post URL structure
    navigator.clipboard.writeText(postLink).then(
      () => {
        alert('Link copied to clipboard!');
      },
      (err) => {
        console.error('Could not copy link:', err);
      }
    );
  }
</script>

<div class="h-full pt-8 flex flex-col items-start w-full overflow-x-hidden">
  <!-- User Information -->
  <div class="w-full flex flex-row items-center">
    <img
      src="/assets/images/Manu.webp"
      alt="Profile Image"
      class="w-10 h-10 rounded-full"
    />
    <div class="ml-2">
      <h3 class="font-bold text-gray-800">{post.user}</h3>
      <h4 class="text-sm text-gray-500">
        {new Date(post.createdAt).toLocaleString()}
      </h4>
    </div>
  </div>

  <!-- Post Content -->
  <div class="mt-4 w-full">
    <p class="text-gray-800 pb-4">{post.description}</p>

    <!-- Highlight Images Scrollable Slider -->
    <div
      bind:this={sliderContainer}
      on:scroll={handleScroll}
      class="relative w-full overflow-x-auto flex items-center space-x-4 scrollbar-hide"
    >
      {#each post.highlightImages as image, index}
        <img
          src={image}
          alt="Post Image"
          class="w-96 h-80 object-cover rounded-lg flex-shrink-0"
        />
      {/each}
    </div>

    <!-- Dots for Slide Navigation -->
    {#if post.highlightImages && post.highlightImages.length > 1}
  <div class="flex justify-center mt-7">
    {#each post.highlightImages as _, index}
      <button
        class={`w-3 h-3 rounded-full mx-1 ${
          index === currentSlide ? 'w-1rem h-1rem  bg-gray-800' : 'w-0.2rem h-0.2rem bg-gray-300'
        }`}
        on:click={() => goToSlide(index)}
        aria-label={`Go to slide ${index + 1}`}
      />
    {/each}
  </div>
{/if}


    <h3 class="mt-2 text-gray-600">{liked} {post.likes === 1 ? 'Like' : 'Likes'}</h3>
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
        fill={liked === 1 ? 'orange' : 'none'}
        stroke={liked === 1 ? 'orange' : 'gray'}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-6 h-6"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <h3 class="ml-2 font-medium text-gray-800">{liked === 1 ? 'Unlike' : 'Like'}</h3>
    </div>

    <!-- Share Button -->
    <!-- <div class="flex items-center cursor-pointer" on:click={copyPostLink}> -->
      <div class="flex items-center cursor-pointer">
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
  /* Hide scrollbar for smooth horizontal scrolling */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
