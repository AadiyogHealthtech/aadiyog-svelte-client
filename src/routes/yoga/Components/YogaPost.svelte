<!-- src/routes/yoga/Components/YogaPost.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getToken } from '$lib/store/authStore';
    import { Toaster, toast } from "svelte-french-toast";
    import Button from '$lib/components/Button/Button.svelte';
    import BottomTabBar from '$lib/components/TabBar/BottomTabBar.svelte';
    import Community from '$lib/icons/CommunityIcon.svelte';
    import Courses from '$lib/icons/CoursesIcon.svelte';
    import Profile from '$lib/icons/ProfileIcon.svelte';
    import Cropper from 'cropperjs';
    import 'cropperjs/dist/cropper.css';
  
    export let id: string;
  
    // Post data and state
    let postData: any = null;
    let isLoading = true;
    let error: string | null = null;
    let postContent = '';
    let postTitle = '';
    let isWorkoutPost = false;
  
    // Image handling
    let selectedImages: File[] = [];
    let showCropper = false;
    let currentImage: File | null = null;
    let cropper: Cropper | null = null;
    let cropperImageElement: HTMLImageElement;
  
    // Bottom tabs
    let tabs = [
      { name: 'Community', icon: Community },
      { name: 'Workout', icon: Courses },
      { name: 'Profile', icon: Profile }
    ];
  
    onMount(async () => {
      try {
        const token = getToken();
        if (!token) throw new Error('User not authenticated');
  
        const response = await fetch(`https://v2.app.aadiyog.in/api/posts/${id}?populate=*`, {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        if (!response.ok) throw new Error('Failed to fetch post');
  
        postData = (await response.json()).data;
        postTitle = postData.attributes.title;
        postContent = postData.attributes.description;
        isWorkoutPost = !!postData.attributes.yoga_name;
  
        if (isWorkoutPost) {
          const workoutData = postData.attributes.summaryJson;
          postTitle = postTitle || `My ${workoutData.yoga_name} Workout`;
          postContent = postContent || 
            `I just completed ${workoutData.reps} reps with score ${workoutData.score}!`;
        }
      } catch (err) {
        error = err.message;
        toast.error('Failed to load post data');
      } finally {
        isLoading = false;
      }
    });
  
    // Image handling functions
    const handleFileChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        currentImage = target.files[0];
        showCropper = true;
      }
    };
  
    const initializeCropper = () => {
      if (cropperImageElement && currentImage) {
        cropper = new Cropper(cropperImageElement, {
          aspectRatio: 1, viewMode: 1, autoCropArea: 0.8,
          movable: true, zoomable: true, scalable: true
        });
      }
    };
  
    const saveCroppedImage = async () => {
      if (cropper) {
        const canvas = cropper.getCroppedCanvas({ width: 800, height: 800 });
        canvas.toBlob((blob) => {
          if (blob) {
            selectedImages = [...selectedImages, new File([blob], currentImage!.name, {
              type: currentImage!.type, lastModified: Date.now()
            })];
            cancelCrop();
          }
        }, currentImage!.type);
      }
    };
  
    const cancelCrop = () => {
      showCropper = false;
      currentImage = null;
      cropper?.destroy();
      cropper = null;
    };
  
    const deleteImage = (index: number) => {
      selectedImages.splice(index, 1);
      selectedImages = [...selectedImages];
    };
  
    // Post submission
    const handlePost = async () => {
      if (!postTitle.trim() && selectedImages.length === 0) {
        toast.error('Please add a title or at least one image');
        return;
      }
  
      try {
        const token = getToken();
        const userId = localStorage.getItem("userId");
        if (!token || !userId) throw new Error('User not authenticated');
  
        const formData = new FormData();
        formData.append('data', JSON.stringify({
          title: postTitle,
          description: postContent,
          yoga_name: postData?.attributes.yoga_name || null,
          reps: postData?.attributes.reps || null,
          score: postData?.attributes.score || null,
          time: postData?.attributes.time || null,
          summaryJson: postData?.attributes.summaryJson || null,
          user: userId
        }));
  
        selectedImages.forEach(image => {
          formData.append('files.highlightImage', image);
        });
  
        const response = await fetch(`https://v2.app.aadiyog.in/api/posts/${id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
  
        if (!response.ok) throw new Error('Failed to update post');
        
        toast.success('Post updated successfully!');
        goto('/community');
      } catch (err) {
        toast.error(err.message);
      }
    };
  
    // Helper function
    function formatTime(ms: number): string {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m ${seconds < 10 ? '0' + seconds : seconds}s`;
    }
  </script>
  
  <div class="h-full flex flex-col bg-white w-full">
    {#if isLoading}
      <div class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    {:else if error}
      <div class="flex-1 flex items-center justify-center">
        <p class="text-red-500">{error}</p>
      </div>
    {:else}
      <div class="flex-1 overflow-y-auto pb-20 px-6 pt-6">
        <div class="flex flex-row items-center justify-center relative">
          <h2 class="text-neutral-grey-3 font-bold">
            {isWorkoutPost ? 'Share Your Workout' : 'Post on Community'}
          </h2>
          <button class="absolute right-0" on:click={() => goto('/community')}>
            <h3 class="text-neutral-grey-3">Discard</h3>
          </button>
        </div>
  
        {#if isWorkoutPost && postData?.attributes.summaryJson}
          <div class="mt-4 p-4 rounded-lg">
            <h3 class="text-black font-bold">Workout Summary</h3>
            <p class="text-black">
              Yoga: {postData.attributes.yoga_name}<br>
              Reps: {postData.attributes.reps}<br>
              Score: {postData.attributes.score}<br>
              Duration: {formatTime(postData.attributes.time)}
            </p>
          </div>
        {/if}
  
        <div class="mt-8">
          <h2 class="text-neutral-grey-3 font-bold">Post Title</h2>
          <input
            type="text"
            class="mt-2 p-4 w-full border rounded-xl"
            placeholder="Enter post title..."
            bind:value={postTitle}
          />
        </div>
  
        <div class="mt-8">
          <h3 class="text-neutral-grey-3 font-bold">Add Images</h3>
          <div class="mt-4 flex flex-wrap gap-4">
            {#each selectedImages as image, index}
              <div class="relative w-20 h-20 border border-dashed border-2 rounded-xl">
                <img 
                  src={URL.createObjectURL(image)} 
                  class="w-full h-full object-cover rounded-xl" 
                />
                <button
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  on:click={() => deleteImage(index)}
                >×</button>
              </div>
            {/each}
            <div class="w-20 h-20 border-dashed border-2 flex items-center justify-center rounded-xl cursor-pointer relative">
              <input
                type="file"
                accept="image/*"
                class="absolute opacity-0 w-full h-full cursor-pointer"
                on:change={handleFileChange}
              />
              <span class="text-neutral-grey-3 text-lg">+</span>
            </div>
          </div>
        </div>
  
        <div class="mt-8">
          <h3 class="text-neutral-grey-2 font-bold">Post Content</h3>
          <textarea
            class="mt-2 p-6 w-full h-36 border rounded-xl"
            placeholder="Write post content..."
            bind:value={postContent}
          />
        </div>
  
        <div class="flex justify-end mb-4">
          <Button variant="primary" class="mt-6" on:click={handlePost}>
            Post
          </Button>
        </div>
      </div>
  
      <!-- Bottom tab bar -->
      <div class="fixed bottom-0 left-0 w-full bg-white shadow-md">
        <BottomTabBar {tabs} activeTab={1} />
      </div>
  
      <!-- Image cropper modal -->
      {#if showCropper && currentImage}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-4 rounded-xl max-w-lg w-full m-4">
            <h3 class="text-neutral-grey-3 font-bold mb-4">Crop Image</h3>
            <div class="max-h-64 overflow-auto">
              <img
                bind:this={cropperImageElement}
                src={URL.createObjectURL(currentImage)}
                on:load={initializeCropper}
                class="w-full"
              />
            </div>
            <div class="flex justify-end gap-4 mt-4">
              <Button variant="secondary" on:click={cancelCrop}>Cancel</Button>
              <Button variant="primary" on:click={saveCroppedImage}>Save</Button>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
  
  