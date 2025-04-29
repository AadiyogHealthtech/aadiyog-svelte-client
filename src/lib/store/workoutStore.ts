import { writable } from 'svelte/store';

// Initialize the store with null or an empty array
export const workoutStore = writable<any[] | null>(null);