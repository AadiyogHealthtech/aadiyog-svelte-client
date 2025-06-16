import { writable } from 'svelte/store';

interface ILoginInputStore {
	[key: string]: {
		id: string;
		label: string;
		input: {
			type: string;
			value: string;
			extraValue?: string;
			error: string;
			validationRegex: string;
			errorText: string;
			required: boolean;
			placeholder: string;
			disabled: boolean;
		};
	};
}

export const loginStore = writable<ILoginInputStore>({});
