<!-- Modal.svelte -->
<script>
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
        <input 
          type="text" 
          bind:value 
          class="w-full border border-gray-300 p-2 rounded mb-4" 
          placeholder="Edit here..." 
        />
        <div class="flex justify-end space-x-2">
          <button on:click={onClose} class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button on:click={() => onSave(value)} class="px-4 py-2 bg-orange-500 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  {/if}
  