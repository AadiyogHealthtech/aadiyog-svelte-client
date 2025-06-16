import { writable } from "svelte/store";

export type WorkoutDetails = {
	id: number;
	name: string;
	duration: number; // in minutes
	exercises: string[];
};

export const workoutDetails = writable<WorkoutDetails | null>(null);