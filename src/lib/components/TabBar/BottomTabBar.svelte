<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type TabComponent = new (...args: any[]) => ATypedSvelteComponent;

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		id: string;
		tabs: Array<{ name: string; icon: TabComponent }>;
		activeTab?: number;
	}

	const BASE_STYLES = 'flex px-4 py-3 shadow-md';

	const dispatch = createEventDispatcher();
	export let activeTab = 0;

	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
</script>

<div {...$$restProps} data-testid={$$restProps.id} class={`customStyles ${BASE_STYLES}`}>
	{#each $$restProps.tabs as obj, i}
		<button class="flex flex-col justify-center items-center ml-16" on:click={() => handleClick(i)}>
			<svelte:component this={obj.icon} color={activeTab === i ? '#333333' : '#999999'} />
			<p
				class="font-normal text-xs"
				class:text-neutral-grey-7={!(activeTab === i)}
				class:text-neutral-grey-3={activeTab === i}
			>
				{obj.name}
			</p>
		</button>
	{/each}
</div>

<style>
	.customStyles {
		box-shadow:
			0.1px -1px 6px #00000059,
			-0.1px -1px 6px #00000059;
	}
</style>
