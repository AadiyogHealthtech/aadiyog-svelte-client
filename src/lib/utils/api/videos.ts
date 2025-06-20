const BASE_URL = 'https://v2.app.aadiyog.in/api';

export interface Exercise {
	id: number;
	title: string;
	description: string;
	url: string;
	imgUrl?: string;
	extraData?: JSON;
}

export async function fetchAllExercises(): Promise<Exercise[]> {
	try {
		// Step 1: Fetch the testing collection
		const testRes = await fetch(`${BASE_URL}/testings`);
		const testJson = await testRes.json();
		// Extract the names from testing collection
		const testingNames = testJson.data.map((item: any) => item.attributes.name);

		// Step 2: Fetch all video exercises
		const videoRes = await fetch(`${BASE_URL}/videos`);
		const videoJson = await videoRes.json();
		console.log("test json",videoJson)

		// Step 3: Filter videos whose title is in the testingNames
		const filteredVideos: Exercise[] = videoJson.data
			.filter((v: any) => testingNames.includes(v.attributes.title))
			.map((v: any) => ({
				id: v.id,
				title: v.attributes.title,
				description: v.attributes.description,
				url: v.attributes.url,
				imgUrl: v.attributes.imgUrl || undefined,
				extraData:v.attributes.extraData
			}));
		console.log("filter is here",filteredVideos)

		return filteredVideos;

	} catch (error) {
		console.error('Error fetching filtered exercises:', error);
		return [];
	}
}
