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
    console.log("Starting LCE handler...");
    setLoadingLCE();
    try {
        const res = await reqCall();
        console.log("Response received:", res);

        if (res.status >= 200 && res.status < 300) {
            console.log("Request successful, updating LCE state...");
            setContentLCE();
            return res.data;
        } else {
            console.warn("Unexpected status code:", res.status);
            setErrorLCE(`Unexpected status: ${res.status}`);
        }
    } catch (error: any) {
        console.error('Error occurred during request:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
        });
        setErrorLCE(
            error.response?.data?.message || error.message || 'An unknown error occurred'
        );
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
    console.log("getAllCourses: Starting...");
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
        console.log("Attributes for request:", attributes);

        const query = populateRequest(attributes);
        console.log("Generated query string:", query);

        const response = await COURSES_REQUEST.get('/?' + query);
        console.log("API Response:", response);

        return response;
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

export const userSignup = async (email: string, name: string, password: string): Promise<any> => {
    console.log("Starting user signup...");
    try {
        return await handleLCE(async () => {
            const payload = { email, username: name, password };
            console.log("Payload being sent:", payload);

            const response = await LOGIN_REQUEST.post(`/register`, payload);

            console.log("Signup successful:", response.status, response.data);
            return response;
        });
    } catch (error: any) {
        console.error("Signup failed. Error details:", {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
        });
        throw error;
    }
};




export const storeUserData = async (userData) => {
	return handleLCE(async () => {
		return await USER_REQUEST.post(`/`, {
			data: userData
		});
	});
};

// src/lib/utils/api/services.ts

// Fetch course details
// export const getCourse = async (courseId: number) => {
// 	try {
// 		const response = await axios.get(`/api/courses/${courseId}`);
// 		return response.data;
// 	} catch (error) {
// 		console.error('Error fetching course:', error);
// 		return null;
// 	}
// };

// Fetch playlist details
export const getPlaylist = async (courseId: number) => {
	try {
		const response = await axios.get(`/api/courses/${courseId}/playlist`);
		return response.data;
	} catch (error) {
		console.error('Error fetching playlist:', error);
		return null;
	}
};
const POSTS_REQUEST = axios.create({
    baseURL: API_URL + '/posts'
});

// export const getPosts = async (id) => {
//     const attributes = [
//         'title',
//         'description',
//         'highlightImage',
//         'AadiyogUser',
//         'likes'
//     ];

//     console.log("getPosts: Fetching posts from /posts endpoint...");
//     const token = getToken();
//     console.log("Using token:", token);

//     try {
//         const response = await POSTS_REQUEST.get('/${id}?' + populateRequest(attributes), {
//             headers: {
//                 Authorization: `bearer ${getToken()}`
//             }
//         });

//         console.log("Fetched posts:", response.data);
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching posts:", error.response || error.message);
//         throw error; // Handle the error appropriately
//     }
// };

export const getPosts = async (id = '') => {
    const attributes = [
        'title',
        'description',
        'highlightImage',
        'AadiyogUser',
        'likes'
    ];

    console.log("getPosts: Fetching posts from /posts endpoint...");
    const token = getToken();
    console.log("Using token:", token);

    try {
        const url = id ? `/${id}?` : '/?'; // If an ID is passed, fetch specific post, otherwise fetch all posts
        const response = await POSTS_REQUEST.get(url + populateRequest(attributes), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Fetched posts:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching posts:", error.response || error.message);
        throw error;
    }
};




        // return handleLCE(async () => {
        //     return await POSTS_REQUEST.get(`/${id}?` + populateRequest(attributes));
        // });


// export const getCourse = async (id) => {
// 	const attributes = [
// 		'healthTags',
// 		'workouts',
// 		'workouts.exercises',
// 		'thumbnailUrl',
// 		'feedback_and_supports',
// 		'instructors',
// 		'extraData',
// 		'steps',
// 		'videos'
// 	];
// 	return handleLCE(async () => {
// 		return await COURSES_REQUEST.get(`/${id}?` + populateRequest(attributes));
// 	});
// };