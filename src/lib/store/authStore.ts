import { get, writable } from 'svelte/store';

export const authStore = writable<string | null>(null);
export const getToken = () => {
	return get(authStore);
};
