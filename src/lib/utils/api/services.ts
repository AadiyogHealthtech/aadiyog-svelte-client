import { setContentLCE, setErrorLCE, setLoadingLCE } from '$lib/store/LCEStore';
import { getToken } from '$lib/store/authStore';
import axios from 'axios';


const API_URL = 'https://v2.app.aadiyog.in/api';
const COURSE_REQUEST = axios.create({
  baseURL: API_URL + '/course'
});
const COURSES_REQUEST = axios.create({
  baseURL: API_URL + '/courses'
});

const WORKOUTS_REQUEST = axios.create({
  baseURL: API_URL + '/workouts'
});
const USER_REQUEST = axios.create({
  baseURL: API_URL + '/aadiyog-users'
});
const LOGIN_REQUEST = axios.create({
  baseURL: API_URL + '/auth/local'
});
const POSTS_REQUEST = axios.create({
  baseURL: API_URL + '/posts'
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
  // console.log("Starting LCE handler...");
  setLoadingLCE();
  try {
    const res = await reqCall();
    // console.log("Response received:", res);
    if (res.status >= 200 && res.status < 300) {
      // console.log("Request successful, updating LCE state...");
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
  // console.log("getAllCourses: Starting...");
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
    // console.log("Attributes for request:", attributes);

    const query = populateRequest(attributes);
    // console.log("Generated query string:", query);

    const response = await COURSES_REQUEST.get('/?' + query);
    // console.log("API Response:", response);

    return response;
  });
};

export const getAllWorkouts = async () => {
  // console.log("getAllWorkouts: Starting...");
  return handleLCE(async () => {
    const attributes = [
      'healthTags',
      'courses',
      'thumbnail',
      'exercises',
    ];
    // console.log("Attributes for request:", attributes);

    const query = populateRequest(attributes); // Ensure this generates the correct query
    // console.log("Generated query string:", query);

    // Make the API request with Authorization header
    const response = await axios.get(`https://v2.app.aadiyog.in/api/workouts/?${query}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    // console.log("API Response workout -> :", response.data);
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

export const getWorkout = async (id) => {
  const attributes = [
    'healthTags',
    'courses',
    'courses.workouts',
    'thumbnailUrl',
    'exercises',
    'exercises.excercise', // Add this to populate the related exercise collection
    'videos',
  ];
  return handleLCE(async () => {
    return await WORKOUTS_REQUEST.get(`/${id}?` + populateRequest(attributes), {
      headers: {
        Authorization: `bearer ${getToken()}`,
      },
    });
  });
};

export const getUserData = async (id) => {
  return handleLCE(async () => {
    return await USER_REQUEST.get(`/${id}?populate[0]=medicalConditions&populate[1]=image&populate[2]=followers&populate[3]=following`, {
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
  // console.log('Login Request:', { identifier: mobile, password });  // Log the request data
  return handleLCE(async () => {
    return await LOGIN_REQUEST.post(`/`, {
      identifier: mobile?.toString(),
      password
    });
  });
};

export const userSignup = async (email: string, mobileNumber: string, password: string): Promise<any> => {
  // console.log("Starting user signup...");
  try {
    return await handleLCE(async () => {
      const payload = { email, username: mobileNumber, password };
      // console.log("Payload being sent:", payload);

      const response = await LOGIN_REQUEST.post(`/register`, payload);
      // console.log("Signup successful:", response.status, response.data);
      return response;
    });

  } catch (error: any) {
    console.error("Signup failed. Error details:", error);

    // Extracting the error message properly
    const errorMessage = error?.response?.data?.error?.message;

    if (errorMessage === "Email or Username are already taken") {
      window.alert("User already exists. Please try a different email or username.");
    } else {
      window.alert("Signup failed. Please try again later.");
    }
  }
};






export const storeUserData = async (userData) => {
  // console.log("storing user data: ", userData);
  if(userData.age === undefined){
    userData.age = 18;
  }
  if(userData.weight === 0 ){
    userData.weight = 60
  }
  if(userData.yogaLevel === ""){
    userData.yogaLevel = "beginner"
  }
  if(userData.sleepTime === 0){
    userData.sleepTime = 6
  }
  userData.image = null;
  const res = await USER_REQUEST.post(`/`, {
    data: userData
  })

  return res;
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

// export const getPosts = async (id) => {
//     const attributes = [
//         'title',
//         'description',
//         'highlightImage',
//         'AadiyogUser',
//         'likes'
//     ];

//     // console.log("getPosts: Fetching posts from /posts endpoint...");
//     const token = getToken();
//     // console.log("Using token:", token);

//     try {
//         const response = await POSTS_REQUEST.get('/${id}?' + populateRequest(attributes), {
//             headers: {
//                 Authorization: `bearer ${getToken()}`
//             }
//         });

//         // console.log("Fetched posts:", response.data);
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

  // console.log("getPosts: Fetching posts from /posts endpoint...");
  const token = getToken();
  // console.log("Using token:", token);

  try {
    const url = id ? `/${id}?` : '/?'; // If an ID is passed, fetch specific post, otherwise fetch all posts
    const response = await POSTS_REQUEST.get(url + populateRequest(attributes), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // console.log("Fetched posts:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching posts:", error.response || error.message);
    throw error;
  }
};

// Add this function to services.ts
export const likePost = async (postId: number, currentUserId: number) => {
  const token = getToken();
  if (!token) {
    throw new Error("User not authenticated");
  }

  return handleLCE(async () => {
    // Fetch the current post to get the existing likes array
    const getResponse = await POSTS_REQUEST.get(`/${postId}?populate[likes][populate]=*`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const currentLikes = getResponse.data.data.attributes.likes.data.map((like: any) => like.id) || [];
    const userAlreadyLiked = currentLikes.includes(currentUserId);

    // Update the likes array
    const updatedLikes = userAlreadyLiked
      ? currentLikes.filter((id: number) => id !== currentUserId) // Unlike
      : [...currentLikes, currentUserId]; // Like

    // Send the PUT request
    const response = await POSTS_REQUEST.put(
      `/${postId}`,
      {
        data: {
          likes: updatedLikes,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Return the full response so handleLCE can process the status
    return {
      data: {
        liked: !userAlreadyLiked,
        likesCount: updatedLikes.length,
      },
      status: response.status, // Include status for handleLCE
    };
  });
};

export const getAllCommunityPosts = async () => {
  // console.log('getAllCommunityPosts: Starting...');

  try {
    // Fetch token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Updated query to populate user, highlightImage, and likes with related user data
    const url = `${API_URL}/posts?populate[user][populate]=image&populate=highlightImage&populate[likes][populate]=*`;

    // API request using the custom axios instance
    const response = await POSTS_REQUEST.get(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    // console.log('API Response:', response.data);

    // Process the response with enhanced user, image, and likes data
    const communityPosts = response.data.data.map((item: any) => ({
      id: item.id,
      title: item.attributes.title,
      description: item.attributes.description,
      createdAt: item.attributes.createdAt,
      updatedAt: item.attributes.updatedAt,
      publishedAt: item.attributes.publishedAt,
      likes: {
        count: item.attributes.likes?.data?.length || 0, // Number of likes
        users: item.attributes.likes?.data?.map((like: any) => ({
          id: like.id,
          name: like.attributes?.name || "Unknown", // Assuming AadiyogUser has a name field
          // Add other user fields you want to include from the likes relation
        })) || [],
      },
      user: {
        id: item.attributes.user?.data?.id,
        name: item.attributes.user?.data?.attributes?.name,
        image: item.attributes.user?.data?.attributes?.image?.data?.attributes?.url || null,
      },
      highlightImages:
        item.attributes.highlightImage?.data?.map((img: any) => img.attributes.url) || [],
    }));

    return communityPosts;
  } catch (error: any) {
    console.error('Error in getAllCommunityPosts:', error.response?.data || error.message || error);
    throw error;
  }
};

export const handlePost = async (
  postTitle: string,
  postContent: string,
  selectedImages: File[],
  errorMessage: string,
  setIsLoading: (loading: boolean) => void,
  setErrorMessage: (message: string) => void
) => {
  if (!postTitle.trim() && selectedImages.length === 0) {
    setErrorMessage('Please add a title or at least one image.');
    return;
  }

  const token = getToken();
  const userId = localStorage.getItem('userId');
  if (!userId) {
    setErrorMessage('User ID is missing. Please log in again.');
    return;
  }

  if (!token) {
    setErrorMessage('User is not authenticated. Please log in again.');
    return;
  }

  try {
    setIsLoading(true);
    setErrorMessage('');

    // Prepare the `data` payload
    const dataPayload = {
      title: postTitle || 'Community Post',
      description: postContent || '',
      user: userId,
    };

    // Create FormData object
    const formData = new FormData();
    formData.append('data', JSON.stringify(dataPayload)); // Correctly append the `data` payload as a JSON string

    // Append images
    selectedImages.forEach((image) => {
      formData.append('files.highlightImage', image);
    });

    // Make the POST request
    const response = await fetch('https://v2.app.aadiyog.in/api/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`, // Add the authorization header
      },
      body: formData, // Pass the FormData object as the request body
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.error?.message || 'Failed to post.');
    }

    return true; // Post was successful
  } catch (error: any) {
    console.error('Post Error:', error);
    setErrorMessage(error.message || 'An error occurred while posting.');
    return false; // Error occurred during post
  } finally {
    setIsLoading(false);
  }
};


// src/api.js
// export const getUserPost = async (userId) => {
//   const token = getToken();
//   try {
//       const response = await fetch(`https://v2.app.aadiyog.in/api/aadiyog-users/${userId}?populate[0]=post`,{
//         method: 'GET',
//         headers: {
//             'Authorization': `Bearer ${token}`, // Replace 'token' with your actual token variable
//             'Content-Type': 'application/json' // Optional: Specifies the content type
//         }
//       });
//       if (!response.ok) {
//           throw new Error('Failed to fetch user post');
//       }
//       const data = await response.json();
//       console.log(data.data.attributes.post.data.attributes);
//       return data.data.attributes.post.data.attributes;
//   } catch (error) {
//       console.error('Error fetching user post:', error);
//       return null;
//   }
// }
export const getUserPost = async (userId) => {
  const token = getToken();
  try {
    const response = await fetch(`https://v2.app.aadiyog.in/api/aadiyog-users/${userId}?populate[0]=post`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user post');
    }

    const data = await response.json();
    const posts = data.data.attributes.post.data; // Access posts field

    // Check if posts is an array or a single object
    const userPost = Array.isArray(posts)
      ? posts.map((post) => ({
        id: post.id,
        title: post.attributes.title,
        description: post.attributes.description,
        createdAt: post.attributes.createdAt,
        updatedAt: post.attributes.updatedAt,
        publishedAt: post.attributes.publishedAt,
        likes: post.attributes.likes || 0, // Default likes to 0
        highlightImages: post.attributes.highlightImages || [], // Default to empty array
        user: post.attributes.user || null, // Include user info if available
      }))
      : posts
        ? [
          {
            id: posts.id,
            title: posts.attributes.title,
            description: posts.attributes.description,
            createdAt: posts.attributes.createdAt,
            updatedAt: posts.attributes.updatedAt,
            publishedAt: posts.attributes.publishedAt,
            likes: posts.attributes.likes || 0,
            highlightImages: posts.attributes.highlightImages || [],
            user: posts.attributes.user || null,
          },
        ]
        : []; // Default to an empty array if no posts exist
    console.log(userPost);
    return userPost;
  } catch (error) {
    console.error('Error fetching user post:', error);
    return [];
  }
};
export const getUserPosts = async (userId) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/aadiyog-users/${userId}?populate[posts][populate]=highlightImage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user post');
    }

    const result = await response.json();
    const posts = result?.data?.attributes?.posts?.data || [];

    return posts.map(post => ({
      id: post.id,
      title: post.attributes.title,
      description: post.attributes.description,
      createdAt: post.attributes.createdAt,
      highlightImages: post.attributes.highlightImage?.data?.map(img => img.attributes.url) || [], // Collect all image URLs
    }));
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
};


export const updateProfileImage = async (userId: string, imageFile: File) => {
  // console.log("updateProfileImage: Starting image upload for user:", userId);

  const token = getToken();
  if (!token) {
    throw new Error('Authentication token not found');
  }

  try {
    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('files.image', imageFile); // Assuming 'profileImage' is the field name in the backend

    const response = await USER_REQUEST.put(`/${userId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    // console.log("Profile image updated successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating profile image:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update profile image');
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