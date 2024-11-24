import { goto } from '$app/navigation';

// Function to handle navigation based on history length
export function handelBack() {
  if (window.history.length > 2) {
    history.go(-1); // Go back two pages in history
  } else {
    goto('/'); // Fallback to the homepage if there’s not enough history
  }
}
