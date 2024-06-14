<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface $$Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'ghost' | 'secondary';
		fullWidth?: boolean;
		id: string;
	}

	const BASE_STYLES = 'h-auto font-semibold px-8 py-3 rounded-full';

	const VARIANT_STYLES: {
		[key: string]: string;
	} = {
		primary:
			'bg-neutral text-neutral-content border-base-100 disabled:border disabled:border-neutral-grey-8 disabled:cursor-not-allowed disabled:bg-neutral-grey-8',
		ghost:
			'border-2 text-neutral border-neutral disabled:cursor-not-allowed disabled:bg-transparent hover:bg-neutral-grey-3 hover:text-white',
		secondary:
			'underline underline-offset-1 text-neutral disabled:text-neutral-grey disabled:cursor-not-allowed disabled:bg-transparent hover:bg-primary'
	};

	const dispatch = createEventDispatcher();

	function handleClick(e: MouseEvent) {
		dispatch('click', e);
	}
</script>

<button
	{...$$restProps}
	data-testid={$$restProps.id}
	class="{BASE_STYLES} {VARIANT_STYLES[$$restProps.variant] ||
		VARIANT_STYLES['primary']} {$$restProps.class || ''}"
	class:w-full={$$restProps.fullWidth}
	on:click={handleClick}
>
	<span class="block body-s md:body-m !leading-[1.1]">
		<slot />
	</span>
</button>
