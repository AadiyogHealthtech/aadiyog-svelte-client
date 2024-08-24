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
