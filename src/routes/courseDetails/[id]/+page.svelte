<script lang="ts">
	import { page } from '$app/stores';
	import Courses from '../Components/Courses.svelte';
	import BookmarkedCourses from '../Components/BookmarkedCourses.svelte';
	import BuyCourse from '../Components/BuyCourse.svelte';
	import Explore from '../Components/Explore.svelte';
	import PaymentMethod from '../Components/PaymentMethod.svelte';
	import Playlist from '../Components/Playlist.svelte';
	import RecommendedCourses from '../Components/RecommendedCourses.svelte';

	let id = 1;
	$: id = parseInt($page.params.id);
</script>

<div class="h-screen flex flex-col items-center justify-center">
	{#if id === 1}
		<Courses />
	{:else if id === 2}
		<BookmarkedCourses />
	{:else if id === 3}
		<RecommendedCourses />
	{:else if id === 4}
		<Explore />
	{:else if id === 5}
		<Playlist
			title="Yoga for vitality: Beginner's guide for thyroid wellness"
			steps={[
				'Easy-to-follow videos with step-by-step breakdowns for a seamless practice.',
				'Gentle poses and warm-ups followed by empowering asanas.',
				'Seated asanas designed to balance and nurture thyroid energy.'
			]}
		/>
	{:else if id === 6}
		<BuyCourse />
	{:else if id === 7}
		<PaymentMethod />
	{/if}
</div>
