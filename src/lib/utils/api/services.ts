import { setContentLCE, setErrorLCE, setLoadingLCE } from '$lib/store/LCEStore';
import { getToken } from '$lib/store/authStore';
import axios from 'axios';

const API_URL = 'https://v1.app.aadiyog.in/api';
const COURSE_REQUEST = axios.create({
	baseURL: API_URL + '/course'
});
const COURSES_REQUEST = axios.create({
	baseURL: API_URL + '/courses'
});
const USER_REQUEST = axios.create({
	baseURL: API_URL + '/aadiyog-users'
});
const LOGIN_REQUEST = axios.create({
	baseURL: API_URL + '/auth/local'
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// const handleLCE = async (reqCall: any) => {
// 	setLoadingLCE();
// 	const res = await reqCall();
// 	if (res.status == 200) {
// 		setContentLCE();
// 		return res.data;
// 	} else setErrorLCE('Something went wrong!');
// 	return null;
// };

const handleLCE = async (reqCall: any) => {
	setLoadingLCE();
	try {
	  const res = await reqCall();
	  if (res.status === 200) {
		setContentLCE();
		return res.data;
	  } else {
		setErrorLCE('Something went wrong!');
	  }
	} catch (error) {
	  console.error('Error occurred during request:', error);
	  setErrorLCE(error instanceof Error ? error.message : 'An unknown error occurred');
	}
	return null;
  };
  

const populateRequest = (attributes) => {
	let req = '';
	attributes?.forEach((attribute, idx) => {
		req += (idx != 0 ? '&' : '') + `populate[${idx}]=${attribute}`;
	});
	return req;
};

export const getAllCourses = async () => {
	return handleLCE(async () => {
		const attributes = [
			'healthTags',
			'workouts',
			'workouts.exercises',
			'thumbnailUrl',
			'feedback_and_supports',
			'instructors',
			'extraData',
			'videos'
		];
		return await COURSES_REQUEST.get('/?' + populateRequest(attributes));
	});
};

export const getCourse = async (id) => {
	const attributes = [
		'healthTags',
		'workouts',
		'workouts.exercises',
		'thumbnailUrl',
		'feedback_and_supports',
		'instructors',
		'extraData',
		'steps',
		'videos'
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

// export const userLogin = async (mobile, password) => {
// 	return handleLCE(async () => {
// 		return await LOGIN_REQUEST.post(`/`, {
// 			identifier: mobile?.toString(),
// 			password
// 		});
// 	});
// };

export const userLogin = async (mobile: string, password: string) => {
    console.log('Login Request:', { identifier: mobile, password });  // Log the request data
    return handleLCE(async () => {
        return await LOGIN_REQUEST.post(`/`, {
            identifier: mobile?.toString(),
            password
        });
    });
};

export const userSignup = async (mobile, email, password) => {
	console.log("usersignup function");
	return handleLCE(async () => {
		console.log(mobile , email , password);
		return await LOGIN_REQUEST.post(`/register`, {
			username: mobile,
			email:email ,
			password : password
		});
	});
};

export const storeUserData = async (userData) => {
	return handleLCE(async () => {
		return await USER_REQUEST.post(`/`, {
			data: userData
		});
	});
};
