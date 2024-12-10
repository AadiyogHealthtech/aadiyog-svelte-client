import { writable, get } from 'svelte/store';

// Check if we are in the browser
const isBrowser = typeof window !== 'undefined';

// Create the store and check localStorage for an existing token if we are in the browser
export const authStore = writable<string | null>(isBrowser ? localStorage.getItem('authToken') : null);

// Subscribe to changes in the authStore and save the token in localStorage (only in the browser)
if (isBrowser) {
  authStore.subscribe(($authStore) => {
    if ($authStore) {
      localStorage.setItem('authToken', $authStore); // Save token to localStorage
    } else {
      localStorage.removeItem('authToken'); // Remove token from localStorage
    }
  });
}

// Function to get the token value (only in the browser)
export const getToken = () => {
  if (isBrowser) {
    return get(authStore); // Use `get` to access the value of the store
  }
  return null; // Return null if not in the browser
};
