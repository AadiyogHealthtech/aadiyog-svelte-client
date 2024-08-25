import { setContentLCE, setErrorLCE, setLoadingLCE } from '$lib/store/LCEStore';
import { getToken } from '$lib/store/authStore';
import axios from 'axios';

let API_URL = 'https://v1.app.aadiyog.in/api';
let COURSE_REQUEST = axios.create({
	baseURL: API_URL + '/course'
});
let COURSES_REQUEST = axios.create({
	baseURL: API_URL + '/courses'
});
let USER_REQUEST = axios.create({
	baseURL: API_URL + '/aadiyog-users'
});
let LOGIN_REQUEST = axios.create({
	baseURL: API_URL + '/auth/local'
});

let handleLCE = async (reqCall) => {
	setLoadingLCE();
	let res = await reqCall();
	if (res.status == 200) {
		setContentLCE();
		return res.data;
	} else setErrorLCE('Something went wrong!');
	return null;
};

let populateRequest = (attributes) => {
	let req = '';
	attributes?.forEach((attribute, idx) => {
		req += (idx != 0 ? '&' : '') + `populate[${idx}]=${attribute}`;
	});
	return req;
};

export const getAllCourses = async () => {
	return handleLCE(async () => {
		let attributes = [
			'healthTags',
			'workouts',
			'workouts.exercises',
			'thumbnailUrl',
			'feedback_and_supports',
			'instructors',
			'extraData'
		];
		return await COURSES_REQUEST.get('/?' + populateRequest(attributes));
	});
};

export const getCourse = async (id) => {
	let attributes = [
		'healthTags',
		'workouts',
		'workouts.exercises',
		'thumbnailUrl',
		'feedback_and_supports',
		'instructors',
		'extraData',
		'steps'
	];
	return handleLCE(async () => {
		return await COURSES_REQUEST.get(`/${id}?` + populateRequest(attributes));
	});
};

export const getUserData = async (id) => {
	return handleLCE(async () => {
		return await USER_REQUEST.get(`/${id}?populate[0]=medicalConditions`, {
			headers: {
				Authorization: `bearer ${getToken()}`
			}
		});
	});
};

export const getUserDataByFieldType = async (key, value) => {
	return handleLCE(async () => {
		return await USER_REQUEST.get(`?populate[0]=medicalConditions`, {
			params: {
				filters: {
					[key]: {
						$eq: value
					}
				}
			},
			headers: {
				Authorization: `bearer ${getToken()}`
			}
		});
	});
};

export const userLogin = async (mobile, password) => {
	return handleLCE(async () => {
		return await LOGIN_REQUEST.post(`/`, {
			identifier: mobile?.toString(),
			password
		});
	});
};
