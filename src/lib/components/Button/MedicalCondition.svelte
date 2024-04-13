<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface $$Props extends HTMLButtonAttributes {
		selected?: boolean;
		id: string;
	}

	const BASE_STYLES =
		'font-semibold px-4 py-3 rounded-lg flex flex-col justify-center items-center';

	export let selected = false;
	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		selected = !selected;
		dispatch('click', e);
	}
</script>

<button
	{...$$restProps}
	data-testid={$$restProps.id}
	on:click={handleClick}
	class={BASE_STYLES}
	class:border-2={selected}
	class:border-primary={selected}
	class:text-primary={selected}
	class:border={!selected}
	class:border-neutral={!selected}
	class:text-neutral={!selected}
>
	<slot />
</button>
