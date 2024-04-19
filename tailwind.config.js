/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: { DEFAULT: '#F37003' },
				neutral: { DEFAULT: '#333333' },
				'neutral-content': '#FFFFFF',
				'neutral-grey': '#999999',
				'neutral-grey-2': '#151515',
				'neutral-grey-3': '#333333',
				'neutral-grey-4': '#4D4D4D',
				'neutral-grey-7': '#999999',
				'neutral-grey-8': '#B3B3B3',
				'neutral-grey-11': '#F5F5F5',
				'Semantic-grey-12': '#868686',
				'neutral-blue': '#5D5D90',
				'neutral-blue-11': '#4B4DED33',
				'Semantic-Green': '#34C759',
				'Semantic-Green-shadow': '#31D0AA33'
			}
		}
	},
	plugins: []
};
