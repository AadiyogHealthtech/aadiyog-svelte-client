// src/lib/store/auth.ts
import { writable } from 'svelte/store';

export const user = writable(null);

export function setUser(u) {
	user.set(u);
	localStorage.setItem('user', JSON.stringify(u));
}

export function clearUser() {
	user.set(null);
	localStorage.removeItem('user');
}
