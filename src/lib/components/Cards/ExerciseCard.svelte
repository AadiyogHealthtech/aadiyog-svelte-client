<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Dot from '$lib/icons/DotIcon.svelte';
    import Star from '$lib/icons/StarIcon.svelte';
    import Bookmark from '$lib/icons/BookmarkIcon.svelte';
  
    export let id: number;
    export let title: string;
    export let reps: number;
    export let videoUrl: string;
    export let bookmarked: boolean = false;
  
    const BASE_STYLES = 'px-2 py-4 min-w-[15rem]';
    const dispatch = createEventDispatcher();
  
    function handleClick(e: MouseEvent) {
      dispatch('click', e);
    }
  </script>
  
  <div data-testid={id} class={BASE_STYLES}>
    <div class="relative">
      <video
        class="w-56 h-56 rounded-lg object-cover"
        src={videoUrl}
        autoplay
        muted
        loop
        playsinline
      ></video>
  
      <!-- Shadow Overlay -->
      <div
        class="absolute top-0 right-0 w-20 h-24 bg-gradient-to-bl from-black/50 via-transparent to-transparent rounded-tr-lg pointer-events-none"
        style="clip-path: polygon(100% 0%, 0% 0%, 100% 100%);"
      ></div>
  
      <button class="absolute right-2 top-2" on:click={handleClick}>
        <Bookmark
          stroke={bookmarked ? 'black' : 'white'}
          fill={bookmarked ? 'white' : '#868686'}
          stroke_width={bookmarked ? '0.2' : '1.75'}
        />
      </button>
    </div>
  
    <div class="mt-2">
      <p class="font-semibold text-neutral-grey-2 text-base leading-6 text-left">
        {title}
      </p>
  
      <p class="text-neutral-grey-3 text-sm mt-1">Reps: {reps}</p>
  
      <!-- Optional Dummy Rating UI -->
      <div class="flex items-center mt-2">
        <p class="text-sm text-neutral-grey-3 mr-2">4.5</p>
        <Star color="#F37003" width={12} height={12} />
        <p class="text-sm text-neutral-grey-3 ml-2">(10)</p>
      </div>
    </div>
  </div>
  