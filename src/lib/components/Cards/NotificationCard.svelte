<script lang="ts">
    export let notification: {
      id: number;
      name: string;
      message: string;
      createdAt: string;
    };
  
    let liked = 0;
  
    // Toggle the like status (optional interaction)
    function toggleLike() {
      liked = liked === 0 ? 1 : 0;
    }
  
    // Handle button click (e.g., view notification details)
    function handleNotificationAction(notificationId: number) {
      alert(`Notification ID: ${notificationId}`);
    }
  </script>
  
  <!-- Notification Card -->
  <div class="h-full pt-8 flex flex-col items-start w-screen px-0 relative box-border">
    <!-- User Information and Message -->
    <div class="w-full flex flex-row items-center justify-between border-b border-gray-300 py-4 overflow-hidden">
      <!-- Left Section: Name and Message -->
      <div class="flex items-center space-x-4 w-full">
        <img src="/assets/images/Manu.webp" alt={notification.name} class="w-10 h-10 rounded-full flex-shrink-0" />
        <div class="w-full">
          <h3 class="font-bold text-gray-800 truncate">{notification.name}</h3>
          <p class="text-sm text-gray-500  w-[100%]">{notification.message}</p>
          <h4 class="text-xs text-gray-400">
            {new Date(notification.createdAt).toLocaleString()}
          </h4>
        </div>
        <!-- <button 
        class="bg-black text-white px-5 py-2 rounded hover:bg-black focus:outline-none flex-shrink-10"
        on:click={() => handleNotificationAction(notification.id)}
      >
        follow
      </button> -->
      </div>
  
      <!-- Right Section: Button -->
      <!-- <button 
        class="bg-blue-500 text-white px-5 py-2 rounded hover:bg-blue-600 focus:outline-none flex-shrink-10"
        on:click={() => handleNotificationAction(notification.id)}
      >
        following
      </button> -->
      
    </div>
  </div>
  
  <style>
    /* Hide scrollbar for smooth horizontal scrolling */
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }
  </style>
  