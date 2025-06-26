<script lang="ts">
  import { onMount } from 'svelte';
  import CommunityCard from '$lib/components/Cards/CommunityCard.svelte';
  import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
  import Community from '$lib/icons/CommunityIcon.svelte';
  import Courses from '$lib/icons/CoursesIcon.svelte';
  import MainLogo from '$lib/icons/MainLogoIcon.svelte';
  import Logo from '$lib/Images/aadiyog-hindi.png';
  import Profile from '$lib/icons/ProfileIcon.svelte';
  import startyoga from '$lib/Images/start_yoga.png';
  import manualactivity from '$lib/Images/manual_activity.png';
  import bell from '$lib/Images/bell.png';
  import search from '$lib/Images/search.png';
  import { goto } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';
  import { getAllCommunityPosts } from '$lib/utils/api/services';
  import featureFlag from '$lib/featureFlag.json';
  import { getUserData } from '$lib/utils/api/services';

  const enableFloatingButton = featureFlag.PUBLIC_ENABLE_FLOATING_BUTTON;

  // Define proper interfaces
  interface User {
    id: number;
    name: string;
    image: string | null;
  }

  interface CommunityPost {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    likes: {
      count: number;
      users: { id: number; name: string }[];
    };
    user: User; // Corrected to be an object, not a string
    highlightImages: string[];
  }

  let tabs = [
    { name: 'Community', icon: Community },
    { name: 'Workout', icon: Courses },
    { name: 'Profile', icon: Profile }
  ];

  let communityPosts: CommunityPost[] = [];
  let isLoading = true;
  let error = '';
  let userData: any = null;
  let usersFollowing: any[] = [];

  let isFloatingButtonVisible = true;
  let areActionButtonsVisible = false;
  let isBlurred = false;
  let lastActiveButton: 'floating' | 'actions' | null = 'floating';
  let previousScrollY = 0;

  const dispatch = createEventDispatcher();

  function handleClick(event: CustomEvent<number>) {
    dispatch('tabClick', event.detail);
  }

  function handlePostClick() {
    // goto("/workout-details");
    // console.log("")
  }

  function handleFloatingButtonClick() {
    isFloatingButtonVisible = false;
    areActionButtonsVisible = true;
    isBlurred = true;
    document.body.style.overflow = 'hidden';
  }

  function handleCloseBlur() {
    isFloatingButtonVisible = true;
    areActionButtonsVisible = false;
    isBlurred = false;
    document.body.style.overflow = 'auto';
  }

  function startYoga() {
    goto('/yoga');
  }

  function manualActivity() {
    goto('/post');
  }

  function handleScroll() {
    let currentScrollY = window.scrollY;

    if (currentScrollY > previousScrollY) {
      isFloatingButtonVisible = false;
      areActionButtonsVisible = false;
    } else {
      if (lastActiveButton === 'floating') {
        isFloatingButtonVisible = true;
      } else if (lastActiveButton === 'actions') {
        isFloatingButtonVisible = true;
      }
    }

    previousScrollY = currentScrollY;
  }

  function getArrangePost(posts: CommunityPost[], following: any[]): CommunityPost[] {
    const followedUserIds = Array.isArray(following) ? following.map((user: any) => user.id) : [];

    const followedPosts: CommunityPost[] = [];
    const otherPosts: CommunityPost[] = [];

    posts.forEach((post) => {
      if (followedUserIds.includes(post.user.id)) {
        followedPosts.push(post);
      } else {
        otherPosts.push(post);
      }
    });

    const sortByDate = (a: CommunityPost, b: CommunityPost) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    };

    followedPosts.sort(sortByDate);
    otherPosts.sort(sortByDate);

    return [...followedPosts, ...otherPosts];
  }

   onMount(() => {
    // 1) attach listener now
    window.addEventListener('scroll', handleScroll);

    // 2) do your async setup
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          // do NOT `return goto(...)` here; just redirect then bail
          goto('/login');
          return;
        }

        const postsResponse = await getAllCommunityPosts();
        if (!Array.isArray(postsResponse)) {
          throw new Error('Failed to load community posts');
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('User ID not found');
        }
        userData = await getUserData(userId);

        usersFollowing = userData?.data?.attributes?.following?.data ?? [];
        communityPosts = getArrangePost(postsResponse, usersFollowing);
      } catch (err) {
        error = err.message ?? 'An unknown error occurred';
        console.error('Error in onMount:', err);
      } finally {
        isLoading = false;
      }
    })();

    // 3) return the cleanup **synchronously**:
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
</script>

<div class="h-full pt-4 pb-24 flex flex-col items-start w-full overflow-x-hidden bg-white">
  <!-- Blur Overlay -->
  {#if isBlurred}
    <div class="fixed inset-0 backdrop-blur-md z-40" on:click={handleCloseBlur}></div>
  {/if}

  <!-- Header -->
  <div class="w-full px-8 flex flex-row items-center justify-between">
    <!-- Logo and Title -->
    <div class="flex items-center">
      <MainLogo width={32} height={32} />
      <h1 class="ml-2">Aadiyog</h1>
    </div>
  
    <!-- Search and Notification Icons (right side) -->
    <div class="flex space-x-4 items-center">
      <!-- Search Icon -->
      <button class="bg-transparent p-0 rounded-full">
        <img src={search} alt="Search Icon" />
      </button>
      <!-- Notification Icon -->
      <a href="/notification">
        <button class="bg-transparent p-2 rounded-full">
          <img src={bell} alt="Notification Bell" />
        </button>
      </a>
    </div>
  </div>

  <!-- Content Section -->
  {#if isLoading}
    <div class="absolute inset-0 flex justify-center items-center bg-white">
      <div class="w-50 h-50 rounded-full flex justify-center items-center animate-pulse">
        <img src={Logo} alt="centered image" class="w-100 h-100 rounded-full" />
      </div>
    </div>
  {:else if error}
    <p class="text-center mt-4 text-red-500">{error}</p>
  {:else}
    <div class="w-full flex flex-col items-center">
      {#each communityPosts as post}
        <div class="w-full overflow-hidden h-1 mt-4 bg-neutral-grey-11" />
        <div class="w-full  px-8">
          <CommunityCard {post} on:click={handlePostClick} />
        </div>
      {/each}
    </div>

    <!-- Floating Button -->
    {#if isFloatingButtonVisible && enableFloatingButton}
      <button
        class="fixed bottom-24 right-5 bg-[#F37003] text-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center text-5xl transition-opacity duration-300 z-50"
        on:click={handleFloatingButtonClick}
      >
        +
      </button>
    {/if}

    <!-- Action Buttons -->
    {#if areActionButtonsVisible}
      <div
        class="fixed bottom-24 right-5 space-y-3 transition-opacity duration-300 flex flex-col items-end z-50"
      >
        <!-- Start Yoga -->
        <div class="flex items-center space-x-2">
          <div class="bg-white text-black px-3 py-2 rounded-lg shadow-md text-sm">Start Yoga</div>
          <button
            class="bg-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center"
            on:click={startYoga}
          >
            <img src={startyoga} alt="Start Yoga" />
          </button>
        </div>

        <!-- Manual Activity -->
        <div class="flex items-center space-x-2">
          <div class="bg-white text-black px-3 py-2 rounded-lg shadow-md text-sm">
            Manual Activity
          </div>
          <button
            class="bg-white rounded-full w-16 h-16 shadow-lg flex items-center justify-center"
            on:click={manualActivity}
          >
            <img src={manualactivity} alt="Manual Activity" />
          </button>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Bottom Tab Bar -->
  <div
    class="fixed bottom-0 left-0 w-full bg-white z-50 transition duration-300"
    class:is-blurred={isBlurred}
  >
    <BottomTabBar {tabs} id="One" on:click={handleClick} />
  </div>
</div>

<style>
  .backdrop-blur-md {
    backdrop-filter: blur(5px);
  }

  button {
    transition: opacity 0.3s ease-in-out;
  }

  .is-blurred {
    backdrop-filter: blur(10px);
    z-index: 40;
  }

  .h-full {
    height: 100%;
  }

  .pt-4 {
    padding-top: 1rem;
  }

  .pb-24 {
    padding-bottom: 6rem;
  }

  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .items-start {
    align-items: flex-start;
  }

  .items-center {
    align-items: center;
  }

  .w-full {
    width: 100%;
  }

  .overflow-x-hidden {
    overflow-x: hidden;
  }

  .bg-white {
    background-color: #fff;
  }

  .fixed {
    position: fixed;
  }

  .inset-0 {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }

  .z-40 {
    z-index: 40;
  }

  .px-8 {
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .flex-row {
    flex-direction: row;
  }

  .justify-between {
    justify-content: space-between;
  }

  .space-x-4 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 1rem;
  }

  .bg-transparent {
    background-color: transparent;
  }

  .p-0 {
    padding: 0;
  }

  .p-2 {
    padding: 0.5rem;
  }

  .rounded-full {
    border-radius: 9999px;
  }

  .absolute {
    position: absolute;
  }

  .justify-center {
    justify-content: center;
  }

  .bg-neutral-grey-11 {
    background-color: #e5e7eb; /* Approximation, adjust based on your theme */
  }

  .h-2 {
    height: 0.5rem;
  }

  .mt-4 {
    margin-top: 1rem;
  }

  .text-center {
    text-align: center;
  }

  .text-red-500 {
    color: #ef4444;
  }

  .bottom-24 {
    bottom: 6rem;
  }

  .right-5 {
    right: 1.25rem;
  }

  .bg-\[\#F37003\] {
    background-color: #F37003;
  }

  .text-white {
    color: #fff;
  }

  .w-16 {
    width: 4rem;
  }

  .h-16 {
    height: 4rem;
  }

  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .text-5xl {
    font-size: 3rem;
    line-height: 1;
  }

  .transition-opacity {
    transition-property: opacity;
  }

  .duration-300 {
    transition-duration: 300ms;
  }

  .z-50 {
    z-index: 50;
  }

  .space-y-3 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.75rem;
  }

  .items-end {
    align-items: flex-end;
  }

  .space-x-2 > :not([hidden]) ~ :not([hidden]) {
    margin-left: 0.5rem;
  }

  .text-black {
    color: #000;
  }

  .px-3 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .py-2 {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .rounded-lg {
    border-radius: 0.5rem;
  }

  .shadow-md {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  .text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .transition {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }

  .max-w-md {
    max-width: 28rem; /* Tailwind's max-w-md */
  }
</style>