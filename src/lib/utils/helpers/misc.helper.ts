import { userDataStore } from '$lib/store/userDataStore';
import { goto } from '$app/navigation'; // SvelteKit's navigation function

export const validateSession = (onFailure = () => {}) => {
	try {
		const user = JSON.parse(localStorage?.getItem('user'));
		
		console.log(user);

		if (!user) {
			goto('/login'); // Redirect if user is not found
			return;
		}

		userDataStore.set(user);
		
	} catch (err) {
		console.error(err);
		localStorage.removeItem('user');
		onFailure();
		goto('/login'); // Redirect on error too
	}
};
