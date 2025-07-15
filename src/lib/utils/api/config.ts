import { base } from '$app/paths';
import { env } from '$env/dynamic/public';
import axios, { type AxiosError, type AxiosResponse } from 'axios';
import { doLogOut } from '../../generic-methods';
import { EXTERNAL_HOSTNAME } from '../constants';
import { HttpError } from '../error';

const ENV = env.PUBLIC_ENV || 'dev';
console.info('CLIENT ENV:', env.PUBLIC_ENV);
export const API_INTERNAL = axios.create({
	baseURL: base + '/api'
});

export const API_BFF_CSR = axios.create({
	baseURL: EXTERNAL_HOSTNAME(ENV),
	withCredentials: true
});

export const API_IAM_CSR = axios.create({
	baseURL: EXTERNAL_HOSTNAME(ENV),
	withCredentials: true
});

// Request Interceptor
API_BFF_CSR.interceptors.request.use(
	(config) => {
		config.headers.setContentType('application/json');
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response Interceptor
API_BFF_CSR.interceptors.response.use(
	(response: AxiosResponse) => {
		console.info(
			'BFF CSR Response',
			JSON.stringify({
				url: response.config.url,
				status: response.status
			})
		);
		return response;
	},
	(error: AxiosError) => {
		console.error(
			'BFF CSR Response Error',
			JSON.stringify({
				url: error?.response?.config.url,
				status: error?.response?.status
			})
		);
		if (error.response?.status == 401) {
			doLogOut();
		}
		throw new HttpError(error.message, error.response?.status ?? 500);
	}
);

// Request Interceptor
API_IAM_CSR.interceptors.request.use(
	(config) => {
		config.headers.setContentType('application/json');
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response Interceptor
API_IAM_CSR.interceptors.response.use(
	(response: AxiosResponse) => {
		console.info(
			'IAM CSR Response',
			JSON.stringify({
				url: response.config.url,
				status: response.status
			})
		);
		return response;
	},
	(error: AxiosError) => {
		console.error(
			'IAM CSR Response Error',
			JSON.stringify({
				url: error?.response?.config.url,
				status: error?.response?.status
			})
		);
		let errorText: string = '';
		error.response?.data?.details?.forEach((detail) => {
			if (detail?.metadata?.error_message?.length) {
				errorText = detail.metadata.error_message;
			}
		});
		if (error.response?.status == 401) {
			doLogOut();
		}
		throw new HttpError(errorText || error.message, error.response?.status ?? 500);
	}
);
