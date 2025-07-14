<script lang="ts">
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type TabComponent = new (...args: any[]) => ATypedSvelteComponent;

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		id: string;
		tabs: Array<{ name: string; icon: TabComponent }>;
		activeTab?: number;
	}

	const BASE_STYLES = 'flex px-8 py-3 w-full shadow-md items-center justify-between';

	const dispatch = createEventDispatcher();
	export let activeTab = 0;

	function handleClick(index: number) {
		activeTab = index;
		if (activeTab === 0) {
			goto('/community');
		} else if (activeTab === 1) {
			goto('/');
		} else if (activeTab === 2) {
			goto('/user-profile');
		}
		dispatch('click', activeTab);
	}
</script>

<div {...$$restProps} data-testid={$$restProps.id} class={`customStyles ${BASE_STYLES}`}>
    {#each $$restProps.tabs as obj, i}
        <button class="flex flex-col items-center justify-center w-full h-full" on:click={() => handleClick(i)}>
            <div class="flex items-center justify-center h-6">
                <svelte:component this={obj.icon} color={activeTab === i ? '#333333' : '#999999'} />
            </div>
            <p
                class="font-normal text-xs mt-1"
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
