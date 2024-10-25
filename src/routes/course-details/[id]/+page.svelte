<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Playlist from '../Components/Playlist.svelte';
	import { getCourse } from '$lib/utils/api/services';
	import { getImageFromObject } from '$lib/utils/helpers/courses.helper';

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
	let course = null;
</script>

<div>
	{#if course}
		<Playlist
			src={getImageFromObject(course?.thumbnailUrl)}
			title={course?.title ?? 'Loading'}
			steps={course?.steps?.map((step) => step.value)}
		/>
	{/if}
</div>
