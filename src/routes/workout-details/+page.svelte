<script>
	import { goto } from "$app/navigation";
  import workoutImage from "$lib/Images/workoutImage.png";
  import { userDataStore } from '$lib/store/userDataStore';
  import { getUserData, getUserPosts } from '$lib/utils/api/services';

  let userData = {
    name: "Rishabh Saini",
    location: "Greater Noida, UttarPradesh",
    timestamp: new Date(),
    workout: {
      time: "1h 15mins",
      accuracyScore: 78,
      difficultyScore: 4,
      caloriesBurned: "340 cals",
      message: "A fantastic workout for a fantastic morning! Aadiyog has helped me record my workouts and reach the goals I've set for myself, I feel the energy flowing through me, as I perform my workouts, here to share the progress with you guys!"
    }
  };

  // Format the current time for the timestamp
  $: formattedTime = `Today at ${userData.timestamp.getHours()}:${String(userData.timestamp.getMinutes()).padStart(2, '0')} am`;

  // Sliding mechanism
  let y = 0;
  let isDragging = false;
  let startY = 0;
  let maxSlide = -400; // Max slide up distance (adjust as needed)
  let minSlide = 0; // Fully down position

  function startDrag(event) {
    isDragging = true;
    startY = event.clientY || event.touches[0].clientY;
  }

  function onDrag(event) {
    if (!isDragging) return;
    const clientY = event.clientY || (event.touches && event.touches[0].clientY);
    const deltaY = clientY - startY;
    y = Math.max(maxSlide, Math.min(minSlide, deltaY));
  }

  function endDrag() {
    isDragging = false;
    // Snap to nearest boundary
    if (y < maxSlide / 2) {
      y = maxSlide;
    } else {
      y = minSlide;
    }
  }

  // Variable sections
  let additionalSections = [
    {
      type: "summary",
      title: "AI Summary",
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla egestas dapibus risus id molestie. Duis eu accumsan elit. Proin tempor eiusmod dictum. Nullam vitae vulputate metus. Aliquam pharetra orci sed odio molestie efficitur."
    },
    {
      type: "results",
      title: "Results",
      data: [
        { name: "Suryanamaskar", reps: 3, time: 3 }, // Time in minutes
        { name: "Sarvangasana", reps: 2, time: 2 },
        { name: "Aadiyog", reps: 3, time: 1 }
      ]
    }
  ];

  // Toggle state for Reps/Time
  let showReps = true;

  // Calculate max values for scaling bars
  $: maxReps = Math.max(...additionalSections.find(section => section.type === "results").data.map(row => row.reps));
  $: maxTime = Math.max(...additionalSections.find(section => section.type === "results").data.map(row => row.time));

  // Menu toggle state
  let showMenu = false;

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function handleMenuAction(action) {
    // console.log(`${action} clicked`);
    showMenu = false;
    // Implement action logic here (e.g., share, edit, delete)
  }

  // Back button handler
  function handleBack() {
    goto('/community')
    // Implement navigation logic here (e.g., history.back() or route change)
  }
</script>

<div class="h-screen flex flex-col items-center justify-center">
  <!-- Load Font Awesome for icons -->

  <main class="workout-card font-sans">
    <div class="workout-header">
      <div class="workout-image-container">
        <img src={workoutImage} alt="Yoga workout" class="workout-image" />
      </div>
      <button class="back-button" on:click={handleBack}>
        <i class="fas fa-arrow-left back-icon"></i>
      </button>
    </div>

    <div class="slidable-container" style="transform: translateY({y}px);">
      <div class="drag-handle" 
           on:mousedown={startDrag} 
           on:touchstart={startDrag}>
        <div class="handle-bar"></div>
      </div>
      <div class="content-container">
        <div class="user-info">
          <div class="avatar"></div>
          <div class="user-details">
            <div class="user-name">{userData.name}</div>
            <div class="user-timestamp">{formattedTime} · {userData.location}</div>
          </div>
          <div class="menu-container">
            <button class="menu-button" on:click={toggleMenu}>
              <span class="dots">⋮</span>
            </button>
            {#if showMenu}
              <div class="menu-dropdown">
                <button class="menu-item" on:click={() => handleMenuAction('Share')}>
                  <i class="fas fa-share-alt menu-icon"></i> Share
                </button>
                <button class="menu-item" on:click={() => handleMenuAction('Edit')}>
                  <i class="fas fa-edit menu-icon"></i> Edit
                </button>
                <button class="menu-item" on:click={() => handleMenuAction('Delete')}>
                  <i class="fas fa-trash menu-icon"></i> Delete
                </button>
              </div>
            {/if}
          </div>
        </div>
        
        <div class="user-message section-separator">
          {userData.workout.message}
        </div>
        
        <div class="workout-summary bg-white section-separator">
          <div class="summary-item flex justify-center items-center">
            <div class="summary-label">Workout Time</div>
            <div class="summary-value">{userData.workout.time}</div>
          </div>
          
          <div class="summary-item flex justify-center items-center">
            <div class="summary-label">Accuracy Score</div>
            <div class="summary-value">{userData.workout.accuracyScore}</div>
          </div>
          
          <div class="summary-item flex justify-center items-center">
            <div class="summary-label">Calories Burned</div>
            <div class="summary-value">{userData.workout.caloriesBurned}</div>
          </div>
          
          <div class="summary-item flex justify-center items-center">
            <div class="summary-label">Workout Difficulty</div>
            <div class="summary-value">{userData.workout.difficultyScore}</div>
          </div>
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
                  <button 
                    class:toggle-active={showReps}
                    on:click={() => showReps = true}>
                    Reps
                  </button>
                  <button 
                    class:toggle-active={!showReps}
                    on:click={() => showReps = false}>
                    Time
                  </button>
                </div>
              </div>
              <div class="results-table">
                <div class="table-header">
                  <span>Name</span>
                </div>
                {#each section.data as row}
                  <div class="table-row">
                    <span>{row.name}</span>
                    <span>
                      {#if showReps}
                        <div 
                          class="reps-bar" 
                          style="width: {(row.reps / maxReps) * 100}px;">
                        </div>
                      {:else}
                        <div 
                          class="reps-bar" 
                          style="width: {(row.time / maxTime) * 100}px;">
                        </div>
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
</div>

<svelte:window 
  on:mousemove={onDrag} 
  on:touchmove={onDrag} 
  on:mouseup={endDrag} 
  on:touchend={endDrag} />

<style>
  .workout-card {
    max-width: 400px;
    border-radius: 16px;
    overflow: hidden;
    background-color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    margin: 0 auto;
    position: relative;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  .workout-header {
    position: relative;
    width: 100%;
  }
  
  .workout-image-container {
    width: 100%;
    height: auto;
  }
  
  .workout-image {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .slidable-container {
    background-color: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    position: relative;
    z-index: 10;
    transition: transform 0.3s ease;
    overflow: hidden;
  }
  
  .drag-handle {
    width: 100%;
    padding: 8px 0;
    text-align: center;
    cursor: grab;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
  }
  
  .handle-bar {
    width: 30%;
    height: 5px;
    background-color: #080808;
    border-radius: 4px;
    margin: 0 auto;
  }
  
  .content-container {
    max-height: 90vh; 
    overflow-y: auto;
    padding-bottom: 16px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid #f0f0f0;
    position: relative;
  }
  
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #e0e0e0;
    background-image: url("");
    background-size: cover;
    margin-right: 12px;
  }
  
  .user-details {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  
  .user-name {
    font-weight: 600;
    font-size: 14px;
    color: #111;
  }
  
  .user-timestamp {
    font-size: 12px;
    color: #000000;
    font-weight: 400;
  }
  
  .user-message {
    padding: 16px;
    font-size: 16px;
    line-height: 1.4;
    color: #333;
    font-weight: 400;
  }
  
  .workout-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 16px;
    background-color: white;
  }
  
  .summary-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
  
  .summary-label {
    font-size: 12px;
    color: #000000;
  }
  
  .summary-value {
    font-size: 20px;
    font-weight: 400;
    color: #111;
  }

  .additional-section {
    padding: 16px;
    background-color: white;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #111;
    margin-bottom: 8px;
  }

  .section-content {
    font-size: 16px;
    line-height: 1.5;
    color: #21272A;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 14px;
    padding-right: 12px;
  }

  .toggle-buttons {
    display: flex;
    gap: 8px;
  }

  .toggle-buttons button {
    width: 51.24px;
    height: 21px;
    padding: 8px;
    border-radius: 50px;
    border: 1px solid black;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-buttons button.toggle-active {
    background-color: #302f2f;
    color: #fff;
  }

  .results-table {
    width: 100%;
    font-size: 14px;
    color: #333;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    font-weight: 400;
    padding: 8px 0;
    border-bottom: 1px solid #767373;
    color: #b9b9b9;
    font-size: 11px;
    margin-bottom: 8px;
  }

  .table-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 1px 0;
    font-size: 11px;
    font-weight: 500;
  }

  .table-row span:nth-child(1) {
    width: 50%;
  }

  .table-row span:nth-child(2) {
    width: 40%;
  }

  .table-row span:nth-child(3) {
    width: 10%;
  }

  .reps-bar {
    height: 10px;
    background-color: #F37003;
    display: inline-block;
    border-radius: 2px;
  }

  .count {
    padding-right: 6px;
    display: flex;
    justify-content: end;
  }

  .section-separator {
    box-shadow: 0 4px 8px rgba(19, 18, 18, 0.2);
  }

  /* Menu styles */
  .menu-container {
    margin-left: auto;
  }

  .menu-button {
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .dots {
    font-size: 20px;
    color: #111;
    line-height: 1;
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 120px;
    z-index: 20;
    overflow: hidden;
  }

  .menu-item {
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    text-align: left;
    font-size: 14px;
    color: #111;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .menu-item:hover {
    background-color: #f0f0f0;
  }

  .menu-icon {
    font-size: 14px;
    color: #111;
  }

  /* Back button styles */
  .back-button {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }



  .back-icon {
    font-size: 16px;
    color: #111;
  }
</style>