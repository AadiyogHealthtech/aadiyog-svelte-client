<script lang="ts">
	import { page } from '$app/stores';
	import BeforeLogin from '../components/BeforeLogin.svelte';
	import LoginOrSignup from '../components/LoginOrSignup.svelte';
	import Profile from '../components/Profile.svelte';
	import ProfileSettings from '../components/ProfileSettings.svelte';
	import EditProfile from '../components/EditProfile.svelte';
	import DeleteAccount from '../components/DeleteAccount.svelte';

	let id = 1;
	$: id = parseInt($page.params.id);
</script>

<div class="h-screen flex flex-col items-center justify-center">
	{#if id === 1}
		<Profile />
	{:else if id === 2}
		<LoginOrSignup />
	{:else if id === 3}
		<BeforeLogin />
	{:else if id === 4}
		<ProfileSettings />
	{:else if id === 5}
		<EditProfile />
	{:else if id === 6}
		<DeleteAccount />
	{/if}
</div>
