const BASE_URL = 'https://v2.app.aadiyog.in/api'; // Replace with your Strapi backend URL


export interface Exercise {
	id: number;
	title: string;
	description: string;
	url: string;
	imgUrl?: string; // Direct image URL from the field
}

export async function fetchAllExercises(): Promise<Exercise[]> {
	try {
		const res = await fetch(`${BASE_URL}/videos`);
		const json = await res.json();
console.log("omg",json.data)
const videos: Exercise[] = json.data.map((v: any) => ({
	id: v.id,
	title: v.attributes.title,
	description: v.attributes.description,
	url: v.attributes.url,
	imgUrl: v.attributes.imgUrl || undefined // use the new direct field
}));

return videos;
} catch (error) {
console.error('Error fetching exercises:', error);
return [];
}
}