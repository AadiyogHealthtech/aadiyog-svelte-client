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
				'neutral-grey-5': '#666666',
				'neutral-grey-6': '#808080',
				'neutral-grey-7': '#999999',
				'neutral-grey-8': '#B3B3B3',
				'neutral-grey-10': '#E6E6E6',
				'neutral-grey-11': '#F5F5F5',
				'Semantic-grey-12': '#868686',
				'neutral-blue': '#5D5D90',
				'neutral-blue-11': '#4B4DED33',
				'semantic-Green': '#34C759',
				'semantic-Red': '#FF3B30',
				base: { 100: '#ffffff' }
			}
		}
	},
	plugins: []
};
