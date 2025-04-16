<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import ExploreCard from '$lib/components/Cards/ExploreCard.svelte';
	import Back from '$lib/icons/BackIcon.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import Height from '../../personalization/Components/Height.svelte';
	import { goto } from '$app/navigation';
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

	let topics = ['Meditation', 'Sports', 'Yoga'];

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


	<div class="h-screen pt-6 flex flex-col items-start bg-white">
		<div class="w-full px-8 flex flex-row items-center justify-start">
			<button on:click={handleBack}>
				<Back />
			</button>
			
			<h1 class="w-full flex flex-row items-center justify-center  text-neutral-grey-3">
				Recommended for you
			</h1>
			
		</div>

		
		<div class="h-screen pt-8 flex flex-col items-start ml-8">

		<div class="flex w-full overflow-x-auto scroll -ml-4">
			{#each courses as course, i}
				<button on:click={() => handleClick(i)}>
					<ExploreCard
						id={course.id}
						title={course.title}
					
						topic="",
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
	</div>

