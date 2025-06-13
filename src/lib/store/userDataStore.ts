import { writable } from 'svelte/store';

export const userDataStore = writable(null);

export const getMedicalConditions = (medicalConditions) => {
	let conditions = '';
	medicalConditions?.forEach((condn, index) => {
		conditions += index !== 0 ? ',' : '' + condn?.name;
	});
	return conditions;
};
