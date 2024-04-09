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
				white: '#FFFFFF',
				'neutral-grey-11': '#F5F5F5'
			}
		}
	},
	plugins: []
};
