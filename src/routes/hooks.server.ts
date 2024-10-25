import { redirect, type Handle } from '@sveltejs/kit';

const PUBLIC_ROUTES = [
	'/login',
	'/signup',
	'/personalization',
	'/onboarding',
	...new Array(9).fill(null).map((_, i) => `/onboarding/${i + 1}`)
];

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('token');
	const path = event.url.pathname;

	// If user is logged in and tries to access auth pages (login/signup)
	if (token && PUBLIC_ROUTES.includes(path)) {
		throw redirect(303, '/');
	}

	// If user is not logged in and tries to access protected routes
	if (!token && !PUBLIC_ROUTES.includes(path)) {
		throw redirect(303, '/login');
	}

	const response = await resolve(event);
	return response;
};
