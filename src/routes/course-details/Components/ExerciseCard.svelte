<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Dot from '$lib/icons/DotIcon.svelte';
    import Star from '$lib/icons/StarIcon.svelte';
    import Bookmark from '$lib/icons/BookmarkIcon.svelte';
  
    let showModal = false;
  
    export let exercise;
  
    const dispatch = createEventDispatcher();
  
    const {
      id,
      title,
      description,
      duration = '20 min',
      reps = '3',
      imgUrl = '/default.jpg',
      rating = '4.5',
      reviews = '132',
      bookmarked = false,
      url,
      steps = [],
      benefits = []
    } = exercise;
  
    function handleBookmarkClick(e: MouseEvent) {
      e.stopPropagation();
      dispatch('click', e);
    }
  
    function getYouTubeEmbedUrl(url: string): string | null {
      if (!url) return null;
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (!match || match.length < 2) return null;
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  </script>
  
  <!-- CARD -->
  <div data-testid={id} class="px-2 py-4 min-w-[15rem]" on:click={() => (showModal = true)}>
    <div class="relative">
      <img class="w-56 h-56 rounded-lg object-cover cursor-pointer" src={imgUrl} alt="Exercise Image" />
  
      <!-- Shadow overlay -->
      <div
        class="absolute top-0 right-0 w-20 h-24 bg-gradient-to-bl from-black/50 via-transparent to-transparent rounded-tr-lg pointer-events-none"
        style="clip-path: polygon(100% 0%, 0% 0%, 100% 100%);"
      ></div>
  
      <button class="absolute right-2 top-2" on:click={handleBookmarkClick}>
        <Bookmark
          stroke={bookmarked ? 'black' : 'white'}
          fill={bookmarked ? 'white' : '#868686'}
          stroke_width={bookmarked ? '0.2' : '1.75'}
        />
      </button>
    </div>
  
    <div class="mt-2">
      <p class="font-semibold text-neutral-grey-2 text-base leading-6 text-left truncate">{title}</p>
      <p class="font-normal text-neutral-grey-3 text-sm leading-4 mt-1 mb-2 text-left line-clamp-2">
        {description}
      </p>
  
      <div class="flex items-center mb-2">
        <p class="text-sm text-neutral-grey-3 mr-2">{reps} reps</p>
        <Dot />
        <p class="text-sm text-neutral-grey-3 ml-2">{duration}</p>
      </div>
  
      <div class="flex items-center mb-2">
        <p class="text-sm text-neutral-grey-3 mr-2">{rating}</p>
        <Star color="#F37003" width={12} height={12} />
        <p class="text-sm text-neutral-grey-3 ml-2">({reviews})</p>
      </div>
    </div>
  </div>
  
  <!-- MODAL -->
  {#if showModal}
    <div
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      on:click={() => (showModal = false)}
    >
      <div
        class="relative bg-white rounded-xl p-4 w-[95%] max-w-md max-h-[90%] overflow-y-auto"
        on:click|stopPropagation
      >
        <!-- Close Button -->
        <button
          class="absolute top-2 right-2 text-gray-500 hover:text-black text-xl font-bold"
          on:click={() => (showModal = false)}
          aria-label="Close"
        >
          ✖
        </button>
  
        <!-- Video -->
        {#if getYouTubeEmbedUrl(url)}
          <iframe
            class="w-full aspect-video rounded-md border-2 border-orange-500"
            src={getYouTubeEmbedUrl(url)}
            title="YouTube video"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        {:else}
          <p class="text-red-600 text-sm">Invalid or missing Video</p>
        {/if}
  
        <h2 class="text-xl font-bold mt-4">{title}</h2>
  
        <div class="flex justify-between text-sm text-gray-600 my-2">
          <span>{reps} reps</span>
        </div>
  
        {#if description}
          <div class="mt-3">
            <h3 class="font-semibold text-green-700">Description:</h3>
            <p>{description}</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  