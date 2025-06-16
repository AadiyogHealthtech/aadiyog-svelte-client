import { writable } from 'svelte/store';

export const lceStore = writable({
	isLoading: false,
	hasContent: false,
	hasError: false,
	error: null
});

export const setLoadingLCE = () => {
	lceStore.set({
		isLoading: true,
		hasContent: false,
		hasError: false,
		error: null
	});
};
export const setContentLCE = () => {
	lceStore.set({
		isLoading: false,
		hasContent: true,
		hasError: false,
		error: null
	});
};
export const setErrorLCE = (error) => {
	lceStore.set({
		isLoading: false,
		hasContent: false,
		hasError: true,
		error: error
	});
};
