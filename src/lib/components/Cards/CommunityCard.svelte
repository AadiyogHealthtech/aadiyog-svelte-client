<script lang="ts">
  export let post: {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    likes: number;
  };

  let liked = 0;

  function toggleLike() {
    liked = liked === 0 ? 1 : 0;
    post.likes += liked === 1 ? 1 : -1;
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
      <h3 class="font-bold text-gray-800">User {post.id}</h3>
      <h4 class="text-sm text-gray-500">
        {new Date(post.createdAt).toLocaleString()}
      </h4>
    </div>
  </div>

  <!-- Post Content -->
  <div class="mt-4 w-full">
    <p class="text-gray-800">{post.description}</p>
    <div class="relative w-full h-64 mt-4 rounded-xl overflow-hidden">
      <img
        src="/assets/images/yoga-pose-5.png"
        alt="Post Image"
        class="absolute inset-0 w-full h-full object-cover"
      />
    </div>
    <h3 class="mt-2 text-gray-600">{liked} Like</h3>
  </div>

  <!-- Divider -->
  <div class="mt-4 w-full h-px bg-gray-300"></div>

  <!-- Actions -->
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
