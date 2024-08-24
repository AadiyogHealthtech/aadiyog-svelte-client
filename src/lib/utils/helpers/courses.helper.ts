export const joinWithCommas = (arr, keys) => {
	let str = '';
	arr?.forEach((item, idx) => {
		str += (idx != 0 ? ',' : '') + item?.[keys];
	});
	return str;
};

export const getImageFromObject = (obj) => {
	return obj?.data?.attributes?.url;
};

export const getVideosCountFromCourseWorkouts = (workouts) => {
	let ct = 0;
	workouts?.data?.forEach((workout) => {
		ct += workout?.attributes?.exercises?.length;
	});
	return ct;
};

export const getAverageRatingFromFeedbacks = (feedbacks) => {
	if (feedbacks?.data?.length === 0) return 'Not Rated yet';
	let rating = 0;
	feedbacks?.data?.forEach((feedback) => {
		rating += feedback?.attributes?.rating;
	});
	rating /= feedbacks?.data?.length;
	return rating;
};
