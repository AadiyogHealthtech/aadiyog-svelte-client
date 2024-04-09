<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		variant?: 'selected' | 'notSelected';
		id: string;
	}

	const BASE_STYLES =
		'font-semibold px-4 py-3 rounded-lg flex flex-col justify-center items-center';

	const VARIANT_STYLES: {
		[key: string]: string;
	} = {
		notSelected: 'border border-neutral text-neutral',
		selected: 'border-2 border-primary text-primary'
	};

	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		dispatch('click', e);
	}
</script>

<div
	{...$$restProps}
	data-testid={$$restProps.id}
	class="{BASE_STYLES} {VARIANT_STYLES[$$restProps.variant] ||
		VARIANT_STYLES['notSelected']} {$$restProps.class || ''}"
>
	<slot />
</div>
