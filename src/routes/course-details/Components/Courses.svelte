<script lang="ts">
	import { goto } from '$app/navigation';
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Bookmark from '$lib/icons/BookmarkIcon.svelte';
	import Community from '$lib/icons/CommunityIcon.svelte';
	import Courses from '$lib/icons/CoursesIcon.svelte';
	import MainLogo from '$lib/icons/MainLogoIcon.svelte';
	import Profile from '$lib/icons/ProfileIcon.svelte';
	import { getAllCourses } from '$lib/utils/api/services';
	import {
		getAverageRatingFromFeedbacks,
		getImageFromObject,
		getVideosCountFromCourseWorkouts,
		joinWithCommas
	} from '$lib/utils/helpers/courses.helper';
	import { createEventDispatcher, onMount } from 'svelte';

	const fetchCourses = async () => {
		courses = (await getAllCourses())?.data?.map((course) => ({
			...course?.attributes,
			id: course?.id
		}));
		freeCourses = courses?.filter((course) => course?.accessType === 'free');
		explore = courses;
		console.log({ courses });
	};

	onMount(() => {
		fetchCourses();
	});

	let tabs = [
		{ name: 'Community', icon: Community },
		{ name: 'Workout', icon: Courses },
		{ name: 'Profile', icon: Profile }
	];

	let courses = [];
	let explore = [];
	let freeCourses = [];

	const dispatch = createEventDispatcher();
	function handleClick(index: number) {
		goto(`/course-details/${index}`);
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
</script>

<div class=" px-8 pt-8 pb-16 flex flex-col items-start w-full overflow-x-visible">
	<div class="w-full flex flex-row items-center justify-center">
		<MainLogo width={32} height={32} />
		<h1 class="ml-2">Aadiyog</h1>
		<button class="ml-auto" on:click={handleBookmarkClick}>
			<Bookmark stroke="#333333" fill="white" />
		</button>
	</div>

	<h2 class=" pt-8 text-neutral-grey-4">Good morning</h2>

	<div class="w-full py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Recommended for you</h1>
		<button on:click={handleSeeAllRecommended}>
			<h3 class="text-neutral-grey-2">See All</h3>
		</button>
	</div>

	<div class="flex w-full overflow-x-auto scroll -ml-4">
		{#each courses as course, i}
			<div class="" on:click={() => handleClick(course?.id)}>
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
			</div>
		{/each}
	</div>

	<div class="w-full py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Explore</h1>
		<button on:click={handleSeeAllExplore}>
			<h3 class="text-neutral-grey-2">See All</h3>
		</button>
	</div>

	<div class="flex w-full overflow-x-auto scroll -ml-4">
		{#each explore as course, i}
			<div class="flex-1 shrink-0 pr-4" on:click={() => handleClick(i)}>
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
			</div>
		{/each}
	</div>

	<div class="w-full py-4 flex flex-row items-center justify-between">
		<h1 class="text-neutral-grey-2">Free courses</h1>
		<h3 class="text-neutral-grey-2">See All</h3>
	</div>

	<div class="flex w-full overflow-x-auto scroll -ml-4">
		{#each freeCourses as course, i}
			<div class="flex-1 shrink-0 pr-4" on:click={() => handleClick(i)}>
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
			</div>
		{/each}
	</div>

	<div class="fixed bottom-0 left-0 w-full z-10 bg-white">
		<BottomTabBar {tabs} id="One" activeTab={1} />
	</div>
</div>
