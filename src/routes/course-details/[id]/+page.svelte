<script lang="ts">
	import { page } from '$app/stores';
	import Playlist from '../Components/Playlist.svelte';

	let id = 1;
	$: id = parseInt($page.params.id);
	$: id,
		function () {
			console.log('id', id);
		};
	let array = [];
</script>

<div>
	<Playlist
		title="Yoga for vitality: Beginner's guide for thyroid wellness"
		steps={[
			'Easy-to-follow videos with step-by-step breakdowns for a seamless practice.',
			'Gentle poses and warm-ups followed by empowering asanas.',
			'Seated asanas designed to balance and nurture thyroid energy.'
		]}
	/>
</div>
