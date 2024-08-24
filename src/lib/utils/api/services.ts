import { setContentLCE, setErrorLCE, setLoadingLCE } from '$lib/store/LCEStore';
import axios from 'axios';

let API_URL = 'https://v1.app.aadiyog.in/api';
let token =
	'89989ee5d0ed2a9d04b365b74ff65007c109ccdb2d366d1ff9dff75ddaeae58de93fb90d08feb3939a23f75b7097e4dfd92868ddf542cd9a25fcb112bec40676c4f2edb98f44dc5163fab15af0f298119fe43084d9926c69ce38f2e456ca174fea1ba098943621b65f4a4d7dfe83061d8e52308f173d4881aa0b7c85ce0d8930';
let COURSE_REQUEST = axios.create({
	baseURL: API_URL + '/course',
	headers: {
		Authorization: 'bearer ' + token
	}
});
let COURSES_REQUEST = axios.create({
	baseURL: API_URL + '/courses',
	headers: {
		Authorization: 'bearer ' + token
	}
});
let USER_REQUEST = axios.create({
	baseURL: API_URL + '/aadiyog-users',
	headers: {
		Authorization: 'bearer ' + token
	}
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
		'thumbnailUrl',
		'feedback_and_supports',
		'instructors',
		'extraData'
	];
	return handleLCE(async () => {
		return await COURSES_REQUEST.get(`/${id}?` + populateRequest(attributes));
	});
};

export const getUserData = async (id) => {
	return handleLCE(async () => {
		return await USER_REQUEST.get(`/${id}?populate[0]=medicalConditions`);
	});
};
