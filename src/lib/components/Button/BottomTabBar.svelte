<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Profile from '$lib/icons/Profile.svelte';
	import Courses from '$lib/icons/Courses.svelte';
	import Community from '$lib/icons/Community.svelte';

	interface $$Props extends HTMLAttributes<HTMLDivElement> {
		id: string;
	}

	const BASE_STYLES = 'flex px-4 py-3 shadow-md';

	let courses = true;
	let community = false;
	let profile = false;

	const dispatch = createEventDispatcher();

	function handleCourses(e: MouseEvent) {
		courses = true;
		community = false;
		profile = false;
		dispatch('click', e);
	}
	function handleCommunity(e: MouseEvent) {
		community = true;
		courses = false;
		profile = false;
		dispatch('click', e);
	}
	function handleProfile(e: MouseEvent) {
		profile = true;
		courses = false;
		community = false;
		dispatch('click', e);
	}
</script>

<div {...$$restProps} data-testid={$$restProps.id} class={`customStyles ${BASE_STYLES}`}>
	<button class="flex flex-col justify-center items-center" on:click={handleCourses}>
		<Courses color={courses ? '#333333' : '#999999'} />
		<p
			class="font-normal text-xs"
			class:text-neutral-grey-7={!courses}
			class:text-neutral-grey-3={courses}
		>
			Courses
		</p>
	</button>
	<button class="flex flex-col justify-center items-center ml-16" on:click={handleCommunity}>
		<Community color={community ? '#333333' : '#999999'} />
		<p
			class="font-normal text-xs"
			class:text-neutral-grey-7={!community}
			class:text-neutral-grey-3={community}
		>
			Courses
		</p>
	</button>
	<button class="flex flex-col justify-center items-center ml-16" on:click={handleProfile}>
		<Profile color={profile ? '#333333' : '#999999'} />
		<p
			class="font-normal text-xs"
			class:text-neutral-grey-7={!profile}
			class:text-neutral-grey-3={profile}
		>
			Courses
		</p>
	</button>
</div>

<style>
	.customStyles {
		box-shadow:
			0.1px -1px 6px #00000059,
			-0.1px -1px 6px #00000059;
	}
</style>
