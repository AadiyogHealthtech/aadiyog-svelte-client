<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import Dot from '$lib/icons/DotIcon.svelte';
    import Star from '$lib/icons/StarIcon.svelte';
    import Bookmark from '$lib/icons/BookmarkIcon.svelte';
  import defImg from '../../../lib/Images/yog.jpg'
    let showModal = false;
  
    export let exercise;
  
    const dispatch = createEventDispatcher();
  
    let {
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
      benefits = [],
      extraData
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
    onMount(() => {
    
    if(imgUrl=='/default.jpg'){
      imgUrl= defImg
    }
    // Optional: return a cleanup function
    return () => {
      // console.log('Component unmounted');
    };
  });
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

      <!-- Title & Basic Info -->
      <h2 class="text-xl font-bold mt-4">{title}</h2>
      <div class="flex justify-between text-sm text-gray-600 my-1">
        <span>{reps} reps</span>
        <span>{duration}</span>
      </div>

      <!-- Dynamic Rendering Based on extraData -->
      {#if extraData && extraData.sections}
        <!-- Render structured sections like in screenshot -->
        <div class="mt-4 space-y-4">
          {#each extraData.sections as section}
            <div>
              <h3 class="font-semibold text-black mb-1">{section.section_title}:</h3>
              <ol class="list-decimal list-inside text-gray-800 text-sm space-y-1">
                {#each section.items as item}
                  <li>{item}</li>
                {/each}
              </ol>
            </div>
          {/each}
        </div>
      {:else}
        <!-- Fallback if extraData is null -->
        {#if description}
          <div class="mt-3">
            <h3 class="font-semibold text-green-700">Description:</h3>
            <p>{description}</p>
          </div>
        {/if}

        {#if steps.length > 0}
          <div class="mt-3">
            <h3 class="font-semibold text-blue-600">Steps:</h3>
            <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
              {#each steps as step}
                <li>{step}</li>
              {/each}
            </ul>
          </div>
        {/if}

        {#if benefits.length > 0}
          <div class="mt-3">
            <h3 class="font-semibold text-purple-600">Benefits:</h3>
            <ul class="list-disc list-inside text-sm text-gray-700 space-y-1">
              {#each benefits as benefit}
                <li>{benefit}</li>
              {/each}
            </ul>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
