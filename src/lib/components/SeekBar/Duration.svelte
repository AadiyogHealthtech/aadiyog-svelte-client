<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface $$Props extends HTMLInputAttributes {
		id: string;
		type?: string;
		name?: string;
	}

	const BASE_STYLES =
		'bg-neutral-grey-11 rounded-lg font-semibold px-8 py-3 shadow-inner border border-transparent outline-0 ';

	let seekValue = 0; // Initial value

	const dispatch = createEventDispatcher();
	function handleSeekChange(event: any) {
		seekValue = event.target.value;
		dispatch('value');
	}
</script>

<input
	type="range"
	min="0"
	max="100"
	step="20"
	bind:value={seekValue}
	on:input={handleSeekChange}
/>

<style>
	input[type='range'] {
		-webkit-appearance: none;
		width: 100%;
		height: 18px;
		border-radius: 20px;
		background: #f5f5f5;
		outline: none;
		opacity: 0.7;
		-webkit-transition: 0.2s;
		transition: opacity 0.2s;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #f37003;
		cursor: pointer;
	}

	input[type='range']::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: red;
		cursor: pointer;
	}
</style>
