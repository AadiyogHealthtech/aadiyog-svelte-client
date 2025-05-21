import { writable } from 'svelte/store';

// Create a writable store with an initial empty array
export const allWorkouts = writable<any[]>([]);