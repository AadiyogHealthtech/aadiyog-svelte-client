// src/lib/utils/auth.ts
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { authStore } from '$lib/store/authStore';
import { AUTH_TOKEN_KEY } from '../constants';

interface CookieOptions {
	days?: number;
	path?: string;
	domain?: string;
	secure?: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
}

export const setAuthCookie = (token: string, options: CookieOptions = {}) => {
	const { days = 7, path = '/', domain = '', secure = true, sameSite = 'Strict' } = options;

	const expires = new Date();
	expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

	const cookieValue = [
		`${AUTH_TOKEN_KEY}=${token}`,
		`expires=${expires.toUTCString()}`,
		`path=${path}`,
		secure ? 'Secure' : '',
		`SameSite=${sameSite}`
	]
		.filter(Boolean)
		.join(';');

	if (browser) {
		document.cookie = cookieValue;
		authStore.set(token);
	}
};

export const removeAuthCookie = () => {
	if (browser) {
		document.cookie = `${AUTH_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
		authStore.set(null);
	}
};

export const handleLogout = async () => {
	removeAuthCookie();
	await goto('/login');
};
