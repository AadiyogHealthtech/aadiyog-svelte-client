<script lang="ts">
	import BookmarkedCourses from './Components/BookmarkedCourses.svelte';
	import BuyCourse from './Components/BuyCourse.svelte';
	import Courses from './Components/Courses.svelte';
	import Explore from './Components/Explore.svelte';
	import PaymentMethod from './Components/PaymentMethod.svelte';
	import Playlist from './Components/Playlist.svelte';
	import RecommendedCourses from './Components/RecommendedCourses.svelte';
</script>

<div class="h-screen flex flex-col items-center justify-center">
	<!-- <Courses /> -->
	<!-- <BookmarkedCourses /> -->
	<!-- <RecommendedCourses /> -->
	<!-- <Explore /> -->
	<!-- <Playlist
		src={'/assets/images/yoga-pose.jpg'}
		title="Yoga for vitality: Beginner's guide for thyroid wellness"
		steps={[
			'Easy-to-follow videos with step-by-step breakdowns for a seamless practice.',
			'Gentle poses and warm-ups followed by empowering asanas.',
			'Seated asanas designed to balance and nurture thyroid energy.'
		]}
	/> -->
	<!-- <BuyCourse /> -->
	<PaymentMethod />
</div>
