<script lang="ts">
	import CommunityWall from './components/CommunityWall.svelte';
	import Post from './components/Post.svelte';

	let postContent = '';
</script>

<div class="h-full">
	<!-- <Post bind:name={postContent} src="/assets/images/yoga-pose-3.png" /> -->
	<CommunityWall />
</div>
