<script lang="ts">
	import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import IconButton from '$lib/components/Button/IconButton.svelte';
	import Plan from '$lib/components/Subscription/Plan.svelte';
	import Rating from '$lib/components/Feedback/Rating.svelte';
	import TextFeild from '$lib/components/InputFeild/TextFeild.svelte';
	import Toggle from '$lib/components/Button/Toggle.svelte';
	import Inhaler from '$lib/icons/Inhaler.svelte';
	import Courses from '$lib/icons/Courses.svelte';
	import Community from '$lib/icons/Community.svelte';
	import Profile from '$lib/icons/Profile.svelte';
	import Duration from '$lib/components/SeekBar/Duration.svelte';
	import CourseCard from '$lib/components/Cards/CourseCard.svelte';
	import Onboarding1 from './onboarding/Components/Onboarding1.svelte';

	let selected = false;
	let checked = false;
	let name = '';
	let tabs = [
		{ name: 'Courses', icon: Courses },
		{ name: 'Community', icon: Community },
		{ name: 'Profile', icon: Profile }
	];
	$: console.log(name);
</script>

<div class="bg-white flex flex-col p-80">
	<!-- <Button variant="primary" id="One">BUTTON</Button> -->

	<!-- <IconButton bind:selected id="one">
		<Inhaler color={selected ? '#F37003' : '#333333'} />
		Asthma
	</IconButton> -->

	<!-- <Toggle checked id="One"></Toggle> -->

	<!-- <TextFeild
		bind:name
		type="email"
		inputName="Textfield/Active"
		placeholder="Textfield text"
		id="One"
	/> -->

	<!-- <Rating inputName="Textfield/Active" placeholder="Textfield text" id="One" /> -->

	<!-- <Plan id="One" /> -->

	<!-- <BottomTabBar {tabs} id="One" /> -->

	<!-- <Duration id="One" /> -->

	<CourseCard
		title="Lorem ipsum dolor sit fim amet, consectetur adipi tilt scing elit"
		topic="Meditation"
		duration="1 hr 10 min"
		videos="5"
		rating="4.8"
		reviews="16"
		id="one"
	/>
</div>
