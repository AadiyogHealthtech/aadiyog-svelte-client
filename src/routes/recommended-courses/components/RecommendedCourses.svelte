<script lang="ts">
	import { goto } from '$app/navigation';
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { getAllCourses } from '$lib/utils/api/services';
	import {
		getAverageRatingFromFeedbacks,
		getImageFromObject,
		getVideosCountFromCourseWorkouts,
		joinWithCommas
	} from '$lib/utils/helpers/courses.helper';
	const fetchCourses = async () => {
		courses = (await getAllCourses())?.data?.map((course) => ({
			...course?.attributes,
			id: course?.id
		}));
	};

	onMount(() => {
		fetchCourses();
	});

	let courses = [];

	let activeTab = 0;
	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		activeTab = index;
		dispatch('click', activeTab);
	}
	function handleBack() {
		goto('/');
	}
</script>

<div class="h-screen pt-8 flex flex-col items-start">
	<div class="w-full px-8 flex flex-row items-center justify-start">
		<button on:click={handleBack}>
			<Back />
		</button>
		<h1 class="w-full flex flex-row items-center justify-center ml-2 text-neutral-grey-3">
			Recommended for you
		</h1>
	</div>

	<div class="px-4 pt-8 w-full flex-col grid grid-cols-2">
		{#each courses as course, i}
			<button on:click={() => handleClick(i)}>
				<CourseCard
					id={course.id}
					title={course.title}
					topic={joinWithCommas(course?.healthTags, 'value')}
					duration={course.duration}
					videos={getVideosCountFromCourseWorkouts(course?.workouts)}
					rating={getAverageRatingFromFeedbacks(course?.feedback_and_supports)}
					reviews={course?.feedback_and_supports?.data?.length ?? 0}
					src={getImageFromObject(course?.thumbnailUrl)}
				/>
			</button>
		{/each}
	</div>
</div>
