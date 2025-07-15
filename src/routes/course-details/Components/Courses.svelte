	<script lang="ts">
		import { goto } from '$app/navigation';
		import CourseCard from '$lib/components/Cards/CourseCard.svelte';
		import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
		import Bookmark from '$lib/icons/BookmarkIcon.svelte';
		import Community from '$lib/icons/CommunityIcon.svelte';
		import Courses from '$lib/icons/CoursesIcon.svelte';
		import MainLogo from '$lib/icons/MainLogoIcon.svelte';
		import Profile from '$lib/icons/ProfileIcon.svelte';
		import img2 from '$lib/Images/yog.jpg'
		import { getAllCourses, getAllWorkouts } from '$lib/utils/api/services';
		import {
			getAverageRatingFromFeedbacks,
			getImageFromObject,
			getVideosCountFromCourseWorkouts,
			joinWithCommas
		} from '$lib/utils/helpers/courses.helper';
		import { createEventDispatcher, onMount } from 'svelte';
		import Logo from '$lib/Images/aadiyog-hindi.png';
		import { fetchAllExercises,  type Exercise } from '$lib/utils/api/videos';
	import VideoCard from './VideoCard.svelte';
	import ExerciseCard from './ExerciseCard.svelte';

		const fetchCourses = async () => {
			isLoading = true;
			courses = (await getAllCourses())?.data?.map((course) => ({
				...course?.attributes,
				id: course?.id
			}));
			freeCourses = courses?.filter((course) => course?.accessType === 'free');
			explore = courses;
			// console.log({ courses });
			isLoading = false;
		};

		const fetchWorkouts = async () => {
			isLoading = true;
			workouts = (await getAllWorkouts())?.data?.map((workout) => ({
				...workout?.attributes,
				id: workout?.id
			}));
			// freeWorkouts = workouts?.filter((workout) => workout?.accessType === 'free');
			exploreWorkouts = workouts;
			// console.log({ workouts });
			isLoading = false;
		};


		let tabs = [
			{ name: 'Community', icon: Community },
			{ name: 'Workout', icon: Courses },
			{ name: 'Profile', icon: Profile }
		];

		let courses = [];
		let workouts = [];
		let explore = [];
		let exploreWorkouts = [];
		let freeWorkouts = [];
		let freeCourses = [];
		let isLoading = true;
		let exercises: Exercise[] = [];
		const dispatch = createEventDispatcher();
		function handleClick(index: number) {
			goto(`/course-details/${index}`);
		}
		
		function handleClickWorkout(index: number) {
			goto(`/workouts-details/${index}`);
		}
		function handleBookmarkClick() {
			goto('/saved-courses');
		}
		function handleSeeAllRecommended() {
			goto('/recommended-courses');
		}
		function handleSeeAllExplore() {
			goto('/explore-courses');
		}
		function handleClickVideo(videoId: number) {
    // console.log('Clicked video:', videoId);
    // navigate or do something
  }
  function getImageUrl(url?: string) {
    return url || '/default-placeholder.jpg'; // fallback image
  }
		onMount(async() => {
			fetchCourses();
			fetchWorkouts();
			exercises = await fetchAllExercises();
			// console.log("all the exercises",exercises)
		});
	</script>


	{#if isLoading}
	<div class="absolute inset-0 flex justify-center items-center bg-white">
		<div class="w-50 h-50 rounded-full flex justify-center items-center animate-pulse">
			<img src={Logo} alt="centered image" class="w-100 h-100 rounded-full" />
		</div>
	</div>
	{:else}
	<div class=" pl-4 pt-8 pb-16 flex flex-col items-start w-full overflow-x-hidden">		<div class="w-full flex flex-row items-center justify-center">
			<MainLogo width={32} height={32} />
			<h1 class="ml-2">Aadiyog</h1>
			<button class="ml-auto mr-3" on:click={handleBookmarkClick}>
				<Bookmark stroke="#333333" fill="white" />
			</button>
		</div>

		<!-- <h2 class=" pt-8 text-neutral-grey-4">Good morning</h2> -->

		<div class="w-full py-4 flex flex-row items-center justify-between">
			<h1 class="text-neutral-grey-2">Recommended for you</h1>
			<button on:click={handleSeeAllRecommended}>
				<h3 class="text-neutral-grey-2 mr-3">See All</h3>
			</button>
		</div>

		

		<div class="flex w-full overflow-x-auto scroll -ml-2">
			{#each workouts as course, i}
				<div class="" on:click={() => handleClick(course?.id)}>
					<CourseCard
						id={course.id}
						title={course.title}
						topic={joinWithCommas(course?.healthTags, 'value')}
						duration={course.duration}
						videos={course?.exercises?.data?.length}
						rating={
	getAverageRatingFromFeedbacks(course?.feedback_and_supports) || 0
}
reviews={
	course?.feedback_and_supports?.data?.length ?? 0
}
src={getImageFromObject(course?.thumbnail)}					
					/>
				</div>
			{/each}
		</div>

		

		<!-- <div class="w-full py-4 flex flex-row items-center justify-between">
			<h1 class="text-neutral-grey-2">Explore</h1>
			<button on:click={handleSeeAllExplore}>
				<h3 class="text-neutral-grey-2 mr-4">See All</h3>
			</button>
		</div>

		<div class="flex w-full overflow-x-auto scroll -ml-2">
			{#each explore as course, i}
				<div class="" on:click={() => handleClick(course?.id)}>
					<CourseCard
						id={course.id}
						title={course.title}
						topic={joinWithCommas(course?.healthTags, 'value')}
						duration={course.duration}
						videos={getVideosCountFromCourseWorkouts(course?.workouts)}
						
						src={getImageFromObject(course?.thumbnailUrl)}
					/>
				</div>
			{/each}
		</div> -->

		<!-- <div class="w-full py-4 flex flex-row items-center justify-between">
			<h1 class="text-neutral-grey-2">Free courses</h1>
			<h3 class="text-neutral-grey-2 mr-4">See All</h3>
		</div>

		<div class="flex w-full overflow-x-auto scroll -ml-2">
			{#each freeCourses as course, i}
				<div class="" on:click={() => handleClick(course?.id)}>
					<CourseCard
						id={course.id}
						title={course.title}
						topic={joinWithCommas(course?.healthTags, 'value')}
						duration={course.duration}
						videos={getVideosCountFromCourseWorkouts(course?.workouts)}
						rating={
	getAverageRatingFromFeedbacks(course?.feedback_and_supports) || 0
}
reviews={
	course?.feedback_and_supports?.data?.length ?? 0
}
src={getImageFromObject(course?.thumbnailUrl)}
					/>
				</div>
			{/each}
		</div> -->

		<div class="w-full py-4 flex flex-row items-center justify-between">
			<h1 class="text-neutral-grey-2">See All Exercises</h1>
			<button on:click={handleSeeAllRecommended}>
				<h3 class="text-neutral-grey-2 mr-4">See All</h3>
			</button>
		</div>
		
		<div class="flex w-full overflow-x-auto scroll -ml-2 gap-4 p-2">
			{#each exercises as exercise}
    <ExerciseCard {exercise} />
  {/each}
		  </div>

		
	</div>
	{/if}
	<div class="fixed bottom-0 left-0 w-full z-10 bg-white">
		<BottomTabBar {tabs} id="One" activeTab={1} />
	</div>
	<style>
		/* Custom scrollbars for Webkit browsers (Chrome, Safari) */
		.scroll::-webkit-scrollbar {
		  width: 8px;
		}
	  
		.scroll::-webkit-scrollbar-track {
		  background: transparent;
		}
	  
		.scroll::-webkit-scrollbar-thumb {
		  background: transparent;
		  border-radius: 4px;
		}
	  
		/* Custom scrollbars for Firefox */
		.scroll {
		  scrollbar-width: thin;
		  scrollbar-color: transparent transparent;
		}
	  </style>
	  