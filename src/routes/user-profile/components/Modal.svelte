<script lang="ts">
  import { userSignupRequestStore } from '$lib/store/userSignupRequestStore';

  // Handle slider change (to dynamically update slider value and track color)
  function handleSliderChange(event: Event) {
    const slider = event.target as HTMLInputElement;
    const sliderValue = parseInt(slider.value);

    // Update the weight in the store whenever the slider value changes
    userSignupRequestStore.update(store => ({
      ...store,
      weight: sliderValue  // Store the weight in the store
    }));

    // Dynamically update the slider track color based on the value
    document.documentElement.style.setProperty('--slider-value', `${sliderValue}`);
  }

  export let isOpen = false;
  export let onClose;
  export let title = '';
  export let value = '';
  export let onSave;
</script>

{#if isOpen}
  <div class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
    <div class="bg-white p-6 rounded shadow-lg w-96">
      <h2 class="text-lg font-semibold mb-4">{title}</h2>

      <!-- Weight Slider -->
      {#if title === 'Edit Weight'}
        <div class="flex flex-col mb-4">
          <label for="weightSlider" class="text-sm font-semibold mb-2">Select Weight (kg)</label>
          <input 
            id="weightSlider"
            type="range" 
            min="30" 
            max="200" 
            step="1" 
            bind:value={$userSignupRequestStore.weight} 
            on:input={handleSliderChange} 
            class="w-full slider" 
          />
          <div class="flex justify-between text-sm mt-2">
            <span>30 kg</span>
            <span>200 kg</span>
          </div>
          <div class="mt-2 text-center">
            <span class="font-semibold">{$userSignupRequestStore.weight} kg</span> <!-- Display dynamic weight -->
          </div>
        </div>
      {:else}
        <input 
          type="text" 
          bind:value 
          class="w-full border border-gray-300 p-2 rounded mb-4" 
          placeholder="Edit here..." 
        />
      {/if}

      <div class="flex justify-end space-x-2">
        <button on:click={onClose} class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
        <button on:click={() => { 
          onSave($userSignupRequestStore.weight); 
          onClose(); // Close modal after saving
        }} class="px-4 py-2 bg-orange-500 text-white rounded">Save</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* CSS Variable for slider value */
  :global(:root) {
    --slider-value: 30;  /* Default value */
  }

  /* Base style for the slider */
  .slider {
    -webkit-appearance: none;
    width: 100%;
    height: 8px;
    background: linear-gradient(
      to right,
      #ff5722 0%,
      #ff5722 calc((var(--slider-value) - 30) / 170 * 100%), /* Orange up to thumb */
      #ccc calc((var(--slider-value) - 30) / 170 * 100%), /* Grey for remainder */
      #ccc 100%
    );
    border-radius: 5px;
    outline: none;
  }

  /* WebKit styling */
  .slider::-webkit-slider-runnable-track {
    width: 100%;
    height: 8px;
    border-radius: 5px;
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #ff5722;
    border-radius: 50%;
    cursor: pointer;
    margin-top: -6px; /* Center thumb */
  }

  /* Firefox styling */
  .slider::-moz-range-track {
    width: 100%;
    height: 8px;
    background: #ccc;
    border-radius: 5px;
  }
  .slider::-moz-range-progress {
    background-color: #ff5722;
    height: 8px;
    border-radius: 5px;
  }
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #ff5722;
    border-radius: 50%;
    cursor: pointer;
  }
</style>
