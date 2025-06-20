<script lang="ts">
    export let exercise;
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();
  </script>
  
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    on:click={() => dispatch('close')}
  >
    <div
      class="bg-white rounded-xl p-4 w-[95%] max-w-md max-h-[90%] overflow-y-auto"
      on:click|stopPropagation
    >
      <video src={exercise.url} controls class="w-full rounded-md border-2 border-orange-500" />
  
      <h2 class="text-xl font-bold mt-4">{exercise.title}</h2>
  
      <div class="flex justify-between text-sm text-gray-600 my-2">
        <span>{exercise.reps || '3'} reps</span>
        <span>{exercise.duration || '20 min'}</span>
      </div>
  
      <div class="mt-3">
        <h3 class="font-semibold">Steps:</h3>
        <ul class="list-decimal pl-5 mt-1 text-sm">
          {#each exercise.steps ?? [] as step}
            <li>{step}</li>
          {/each}
        </ul>
      </div>
  
      <div class="mt-3">
        <h3 class="font-semibold text-green-700">Beneficial For:</h3>
        <ul class="list-decimal pl-5 mt-1 text-sm">
          {#each exercise.benefits ?? [] as benefit}
            <li>{benefit}</li>
          {/each}
        </ul>
      </div>
  
      <div class="mt-4 flex justify-around items-center">
        <button class="bg-gray-200 p-2 rounded-full">⏮️</button>
        <button class="bg-gray-200 p-4 rounded-full">⏯️</button>
        <button class="bg-gray-200 p-2 rounded-full">⏭️</button>
      </div>
    </div>
  </div>
  