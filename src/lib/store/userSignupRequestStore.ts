import { Gender, type User } from '$lib/messages/User.msg';
import { writable } from 'svelte/store';

const initialUserDataRequest = {
	email: '',
	password: '',
	gender: Gender.Other,
	name: '',
	yogaLevel: '',
	age: undefined,
	height: undefined,
	medicalConditions: [],
	menstrualFlow: undefined,
	sleepTime: 0,
	weight: 0,
	mobileNumber: ''
};
export const userSignupRequestStore = writable<User>(initialUserDataRequest);

export const initialiseUserDataRequest = () => {
	userSignupRequestStore.set(initialUserDataRequest as User);
};
