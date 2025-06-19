<script lang="ts">
    import { goto } from '$app/navigation';
    import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
    import Community from '$lib/icons/CommunityIcon.svelte';
    import Courses from '$lib/icons/CoursesIcon.svelte';
    import Profile from '$lib/icons/ProfileIcon.svelte';

    function handleDelete() {
        // Add your delete logic here
        alert('Account deletion requested.');
    }

    const tabs = [
        { name: 'Community', icon: Community },
        { name: 'Courses', icon: Courses },
        { name: 'Profile', icon: Profile }
    ];
</script>

<div class="w-full min-h-screen flex flex-col bg-white">
    <!-- Header -->
    <div class="w-full px-4 pt-6 pb-4 flex flex-row items-center justify-center bg-white border-b border-neutral-200">
        <h1 class="text-neutral-700 font-semibold text-lg">Delete Account</h1>
    </div><div class="w-full h-[5px] bg-neutral-200"></div>
    <!-- Content -->
    <div class="flex-1 flex flex-col items-center bg-white px-6 pt-8 pb-28 text-center">
        <p class="text-lg font-semibold text-neutral-800 mb-2">We are sad to see you go..</p>
        <p class="text-neutral-grey-3 text-sm mb-8 leading-snug">
            Account deletions are processed in 30 days.<br>
            To stop the deletion process, just log back in.
        </p>
          <img src="/assets/images/YogaIllustration.png" alt="Yoga Pose" class="w-64 max-w-full h-auto object-contain mb-12" />
        <div class="w-full flex flex-row items-center justify-center">
            <button
                class="w-full flex flex-col bg-white mt-2 px-8 py-3 text-white rounded-full font-semibold text-base "
                style="background-color: #852221;"
                on:click={handleDelete}
            >
                Delete Account
            </button>
        </div>
    </div>

		<hr class="border-t-8 border-[#D5D5D5]-300 w-full" />
		<!-- Profile Section -->
		<div class="flex flex-row bg-white w-full mt-2 px-8 py-4">
			{#if isLoading}
				<div class="w-24 h-24 rounded-full bg-gray-300 animate-pulse"></div>
			{:else}
				<img 
					src={profileImage} 
					alt="ProfileImage" 
					class="w-24 h-24 rounded-full object-cover" 
				/>
			{/if}
			<div class="ml-4">
				<h1 class="text-neutral-grey-4 text-center font-normal mb-2">
					{$userDataStore?.name || 'Loading...'}
				</h1>
				<Button id="EditProfile" variant="ghost" on:click={handelEditProfile}>
					Edit Profile
				</Button>
			</div>
		</div>

		<hr class="border-t-8 border-[#D5D5D5]-300 my-3 w-full" />

		<!-- Options Section -->
		<div class="flex flex-col bg-white w-full mt-2 px-8 py-4">
			{#each options as option, index}
				<div
					class="relative flex flex-row items-center my-3 cursor-pointer"
					on:click={() => handleClickoption(option)}
				>
					<svelte:component this={option.icon} />
					<h2 class="text-neutral-grey-3 font-semibold ml-4">{option.name}</h2>
					<div class="absolute top-1 right-4">
						<RightArrow />
					</div>
				</div>
			{/each}
		</div>
		<hr class="border-t-8 border-[#D5D5D5]-300 my-3 w-full" />
		<ProgressCard userId={id} name={$userDataStore?.name}/>
	</div>
</div>

<style>
    .bg-neutral-grey-11 { background-color: #F6F6F6; }
    .text-neutral-grey-3 { color: #6B7280; }
    .text-neutral-grey-4 { color: #374151; }
    .border-neutral-200 { border-color: #E5E7EB; }
</style>