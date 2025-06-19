<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Playlist from '../Components/Playlist.svelte';
	import { getCourse, getWorkout } from '$lib/utils/api/services';
	import { getImageFromObject } from '$lib/utils/helpers/courses.helper';
	import { workoutStore } from '$lib/store/workoutStore';
	import { workoutDetails } from '$lib/store/workoutDetailsStore';
	// const fetchCourseDetails = async () => {
	// 	course = (await getCourse(id))?.data?.attributes;
	// 	console.log(course);
	// };
	let exercises_: any;
	const fetchWorkoutsDetails = async () => {
		workout = (await getWorkout(id))?.data?.attributes;
		
		console.log(workout?.exercises)
		console.log("testing->   __", workout);
	};

	onMount(async() => {
		// fetchCourseDetails();
		fetchWorkoutsDetails();
		const response = await getWorkout(id);
		const workout = response?.data?.attributes;
		if (workout) {
			// ✅ set full workout details (not just exercises)
			workoutDetails.set({
				id,
				name: workout.name,
				duration: workout.duration,
				exercises: workout.exercises || [] // make sure it's not undefined
			});
		}
	});
	let id = 1;
	$: id = parseInt($page.params.id);
	$: id,
		function () {
			console.log('id', id);
		};
	let array = [];
	let course = null;
	let workout = null;
</script>

<div>
	{#if workout}
		<Playlist
			src={getImageFromObject(workout?.thumbnail)}
			title={workout?.title ?? 'Loading'}
			steps={workout?.steps?.map((step) => step.value)}
			workouts={workout?.exercises}
			description={workout?.description ?? 'Loading'}
		/>
	
	{/if}
</div>
