<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import workoutImage from "$lib/Images/workoutImage.png";

  interface User {
    id: number;
    attributes: {
      username: string;
      name?: string;
      // location?: string;
      avatar?: {
        data?: {
          attributes?: {
            url?: string;
          }
        }
      };
    };
  }

  interface PostData {
    id: number;
    createdAt: string;
    attributes: {
      createdAt: string;
      description: string;
      reps: number;
      score: number;
      time: number;
      title: string;
      yoga_name: string;
      user: {
        data: User;
      };
    };
  }

  let userData = {
    name: "User Name",
    // location: "Location",
    avatar: "",
    timestamp: new Date(),
    workout: {
      time: "0m 0s",
      accuracyScore: 0,
      difficultyScore: 3,
      caloriesBurned: "0 cals",
      message: "Workout details"
    }
  };

  let postData: PostData | null = null;
  let isLoading = true;
  let error = '';
  let y = 0;
  let isDragging = false;
  let startY = 0;
  const maxSlide = -400;
  const minSlide = 0;

  let additionalSections = [
    {
      type: "summary",
      title: "Workout Summary",
      content: "Loading workout details..."
    },
    {
      type: "results",
      title: "Results",
      data: [
        { 
            name:"",
            reps: "",
            time: ""
          }
      ]
    }
  ];

  let showReps = true;
  $: maxReps = Math.max(...additionalSections.find(section => section.type === "results").data.map(row => row.reps), 1);
  $: maxTime = Math.max(...additionalSections.find(section => section.type === "results").data.map(row => row.time), 1);
  $: formattedTime = postData ? formatDateTime(postData.createdAt) : `Today at ${userData.timestamp.getHours()}:${String(userData.timestamp.getMinutes()).padStart(2, '0')}`;

  let showMenu = false;

onMount(async () => {
  try {
    // Add a small delay to ensure page state is ready
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if ($page.state.postData) {
      postData = $page.state.postData;
      updateUserDataWithPost();
    } else {
      const postId = new URLSearchParams(window.location.search).get('id');
      if (postId) {
        await fetchPostData(postId);
        if (postData) {
          updateUserDataWithPost();
        }
      } else {
        throw new Error('No post ID provided');
      }
    }
       

  } catch (err) {
    error = err.message;
    console.error('Error loading post:', err);
  } finally {
    isLoading = false;
  }
});

  async function fetchPostData(postId: string) {
    try {
      const response = await fetch(
        `https://v2.app.aadiyog.in/api/posts/${postId}?populate[user][populate][avatar]=*`
      );
      const data = await response.json();
      if (data.data) {
        postData = data.data;
      } else {
        throw new Error('Post data not found');
      }
    } catch (err) {
      throw new Error('Failed to fetch post data');
    }
  }

  function updateUserDataWithPost() {
    if (!postData) return;
// console.log("post data1",postData)
    const user = postData?.attributes?.user;
    // const avatarUrl = user?.attributes?.avatar?.data?.attributes?.url 
    //   ? `https://your-strapi-url${user.attributes.avatar.data.attributes.url}`
    //   : "";

    userData = {
      name: user?.data?.attributes?.name || "User",
      avatar: workoutImage,
      timestamp: new Date(postData?.createdAt),
      workout: {
        time: formatTime(postData.attributes.time),
        accuracyScore: postData.attributes.score,
        difficultyScore: calculateDifficulty(postData.attributes.score),
        caloriesBurned: calculateCalories(postData.attributes.time, postData.attributes.score),
        message: postData.attributes.description || 
                `Completed ${postData.attributes.reps} reps of ${postData.attributes.yoga_name}`
      }
    };

    additionalSections = [
      {
        type: "summary",
        title: "Workout Summary",
        content: `Completed ${postData.attributes.reps} reps of ${postData.attributes.yoga_name} in ${formatTime(postData.attributes.time)}`
      },
      {
        type: "results",
        title: "Results",
        data: [
          { 
            name: postData.attributes.yoga_name,
            reps: postData.attributes.reps,
            time: (postData.attributes.time / 60000).toFixed(2)
          }
        ]
      }
    ];
  }

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  // Format as "Xm Ys" (e.g., "5m 30s")
  return `${minutes}m ${seconds}s`;
  
  // Alternative: Format as decimal minutes (e.g., "5.5 mins")
  // const decimalMinutes = (milliseconds / 60000).toFixed(1);
  // return `${decimalMinutes} mins`;
}

  function formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function calculateDifficulty(score: number): number {
    if (score > 80) return 5;
    if (score > 60) return 4;
    if (score > 40) return 3;
    return 2;
  }

  function calculateCalories(timeInSeconds: number, score: number): string {
    const calories = Math.round((timeInSeconds / 60) * 5 * (score / 100));
    return `${calories} cals`;
  }

  function startDrag(event: MouseEvent | TouchEvent) {
    isDragging = true;
    startY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY;
  }

  function onDrag(event: MouseEvent | TouchEvent) {
    if (!isDragging) return;
    const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY;
    const deltaY = clientY - startY;
    y = Math.max(maxSlide, Math.min(minSlide, deltaY));
  }

  function endDrag() {
    isDragging = false;
    if (y < maxSlide / 2) y = maxSlide;
    else y = minSlide;
  }

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function handleMenuAction(action: string) {
    console.log(`${action} clicked`);
    showMenu = false;
  }

  function handleBack() {
    goto('/community');
  }
</script>

<div class="h-screen flex flex-col items-center justify-center bg-gray-50">
  {#if isLoading}
    <div class="absolute inset-0 flex justify-center items-center">
      <div class="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="absolute inset-0 flex justify-center items-center">
      <div class="text-red-500 p-4 bg-red-50 rounded-lg max-w-md text-center">
        {error}
        <button on:click={handleBack} class="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">
          Back to Community
        </button>
      </div>
    </div>
  {:else}
    <main class="workout-card">
      <div class="workout-header">
        <div class="workout-image-container">
          <img src={workoutImage} alt="Yoga workout" class="workout-image" />
        </div>
        <button class="back-button" on:click={handleBack}>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      <div class="slidable-container" style="transform: translateY({y}px);">
        <div class="drag-handle" on:mousedown={startDrag} on:touchstart={startDrag}>
          <div class="handle-bar"></div>
        </div>
        <div class="content-container">
          <div class="user-info">
            {#if userData.avatar}
              <img src={userData.avatar} alt="User avatar" class="avatar" />
            {:else}
              <div class="avatar">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            {/if}
            <div class="user-details">
              <div class="user-name">
                {userData.name}
                <!-- {#if postData}
                  <span class="yoga-name">{postData.attributes.yoga_name}</span>
                {/if} -->
              </div>
              <div class="user-timestamp">{formattedTime} </div>
            </div>
            <div class="menu-container">
              <button class="menu-button" on:click={toggleMenu}>
                <span class="dots">⋮</span>
              </button>
              {#if showMenu}
                <div class="menu-dropdown">
                  <button class="menu-item" on:click={() => handleMenuAction('Share')}>
                    <svg xmlns="http://www.w3.org/2000/svg" class="menu-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </div>
              {/if}
            </div>
          </div>
          
          <div class="user-message section-separator">
            {userData.workout.message}
          </div>
          
          <div class="workout-summary bg-white section-separator">
            <div class="summary-item">
              <div class="summary-label">Workout Time</div>
              <div class="summary-value">{userData.workout.time}</div>
            </div>
            
            <div class="summary-item">
              <div class="summary-label">Accuracy Score</div>
              <div class="summary-value">{userData.workout.accuracyScore}</div>
            </div>
            
            <!-- <div class="summary-item">
              <div class="summary-label">Calories Burned</div>
              <div class="summary-value">{userData.workout.caloriesBurned}</div>
            </div> -->
            
            <!-- <div class="summary-item">
              <div class="summary-label">Workout Difficulty</div>
              <div class="summary-value">{userData.workout.difficultyScore}/5</div>
            </div> -->
          </div>

          {#each additionalSections as section}
            {#if section.type === "summary"}
              <div class="additional-section summary-section section-separator">
                <h3 class="section-title">{section.title}</h3>
                <p class="section-content">{section.content}</p>
              </div>
            {:else if section.type === "results"}
              <div class="additional-section results-section section-separator">
                <div class="results-header">
                  <h3 class="section-title">{section.title}</h3>
                  <div class="toggle-buttons">
                    <button class:toggle-active={showReps} on:click={() => showReps = true}>
                      Reps
                    </button>
                    <button class:toggle-active={!showReps} on:click={() => showReps = false}>
                      Time
                    </button>
                  </div>
                </div>
                <div class="results-table">
                  <div class="table-header">
                    <span>Exercise</span>
                    <span class="pl-[4rem] " >Performance</span>
                    <span class="count">{showReps ? 'Reps' : 'Time'}</span>
                  </div>
                  {#each section.data as row}
                    <div class="table-row">
                      <span>{row.name}</span>
                      <span>
                        {#if showReps}
                          <div class="reps-bar" style="width: {(row.reps / maxReps) * 100}px;"></div>
                        {:else}
                          <div class="reps-bar" style="width: {(row.time / maxTime) * 100}px;"></div>
                        {/if}
                      </span>
                      <span class="count">
                        {#if showReps}
                          {row.reps}
                        {:else}
                          {row.time}
                        {/if}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </main>
  {/if}
</div>

<svelte:window 
  on:mousemove={onDrag} 
  on:touchmove={onDrag} 
  on:mouseup={endDrag} 
  on:touchend={endDrag} />

<style>
  .workout-card {
    width: 100%;
    max-width: 400px;
    border-radius: 16px;
    overflow: hidden;
    background-color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    position: relative;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  
  .workout-header {
    position: relative;
    width: 100%;
  }
  
  .workout-image-container {
    width: 100%;
    height: 240px;
    overflow: hidden;
  }
  
  .workout-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .slidable-container {
    background-color: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    position: relative;
    z-index: 10;
    transition: transform 0.3s ease;
  }
  
  .drag-handle {
    width: 100%;
    padding: 12px 0;
    text-align: center;
    cursor: grab;
    background-color: white;
  }
  
  .handle-bar {
    width: 40px;
    height: 4px;
    background-color: #e5e5e5;
    border-radius: 2px;
    margin: 0 auto;
  }
  
  .content-container {
    padding-bottom: 24px;
    overflow-y: auto;
    max-height: 60vh;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    padding: 16px;
    position: relative;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    color: #666;
    overflow: hidden;
  }
  
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .user-details {
    flex: 1;
  }
  
  .user-name {
    font-weight: 600;
    font-size: 16px;
    color: #111;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .yoga-name {
    font-size: 12px;
    background-color: #F37003;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
  }
  
  .user-timestamp {
    font-size: 12px;
    color: #666;
    margin-top: 2px;
  }
  
  .user-message {
    padding: 16px;
    font-size: 15px;
    line-height: 1.5;
    color: #333;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .workout-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 16px;
  }
  
  .summary-item {
    display: flex;
    flex-direction: column;
  }
  
  .summary-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }
  
  .summary-value {
    font-size: 20px;
    font-weight: 600;
    color: #111;
  }

  .additional-section {
    padding: 16px;
    background-color: white;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #111;
    margin-bottom: 12px;
  }

  .section-content {
    font-size: 14px;
    line-height: 1.5;
    color: #444;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .toggle-buttons {
    display: flex;
    gap: 8px;
  }

  .toggle-buttons button {
    padding: 4px 12px;
    border-radius: 16px;
    border: 1px solid #ddd;
    font-size: 12px;
    font-weight: 500;
    background: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-buttons button.toggle-active {
    background-color: #333;
    color: white;
    border-color: #333;
  }

  .results-table {
    width: 100%;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
    font-size: 12px;
    color: #999;
    margin-bottom: 8px;
  }

  .table-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    font-size: 14px;
  }

  .table-row span {
    flex: 1;
  }

  .table-row span:first-child {
    flex: 2;
  }

  .reps-bar {
    height: 8px;
    background-color: #F37003;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .count {
    text-align: right;
    font-weight: 600;
    color: #333;
  }

  .section-separator {
    border-bottom: 1px solid #f0f0f0;
  }

  .back-button {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .back-button svg {
    width: 20px;
    height: 20px;
    color: #333;
  }

  .menu-container {
    position: relative;
  }

  .menu-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
  }

  .dots {
    font-size: 20px;
    line-height: 1;
    color: #333;
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 140px;
    z-index: 20;
    overflow: hidden;
  }

  .menu-item {
    width: 100%;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    text-align: left;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    transition: background 0.2s;
  }

  .menu-item:hover {
    background-color: #f5f5f5;
  }

  .menu-icon {
    width: 16px;
    height: 16px;
    color: #333;
  }

  @media (max-width: 400px) {
    .workout-card {
      border-radius: 0;
      max-width: 100%;
      height: 100vh;
    }
    
    .workout-image-container {
      height: 30vh;
    }
    
    .content-container {
      max-height: 70vh;
    }
  }
</style>