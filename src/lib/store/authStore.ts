import { get, writable } from 'svelte/store';

export const authStore = writable(null);
export const getToken = () => {
	return get(authStore);
};
