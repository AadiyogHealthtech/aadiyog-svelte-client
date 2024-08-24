<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Playlist from '../Components/Playlist.svelte';
	import { getCourse } from '$lib/utils/api/services';

	const fetchCourseDetails = async () => {
		course = (await getCourse(id))?.data?.attributes;
		console.log(course);
	};
	onMount(() => {
		fetchCourseDetails();
	});
	let id = 1;
	$: id = parseInt($page.params.id);
	$: id,
		function () {
			console.log('id', id);
		};
	let array = [];
	let course;
</script>

<div>
	<Playlist
		title={course?.title ?? 'Loading'}
		steps={[
			'Easy-to-follow videos with step-by-step breakdowns for a seamless practice.',
			'Gentle poses and warm-ups followed by empowering asanas.',
			'Seated asanas designed to balance and nurture thyroid energy.'
		]}
	/>
</div>
