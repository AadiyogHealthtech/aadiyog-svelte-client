import type {
	IValidateActivationCodeRequest,
	IValidateOtpRequest
} from '$lib/core-commons/types/api/activationPage';
import type {
	ICategoryRequest,
	IListCategoryRequest
} from '$lib/core-commons/types/api/categories';
import type { IGetCollectionRequest } from '$lib/core-commons/types/api/collections';
import type { ICountryResponse } from '$lib/core-commons/types/api/commons';
import type { IListCouponsRequest } from '$lib/core-commons/types/api/coupons';
import type {
	IGenerateOtpRequest,
	IGenerateOtpResponse,
	ILoginCustomerRequest
} from '$lib/core-commons/types/api/loginPage';
import type { IOrderRequest } from '$lib/core-commons/types/api/order';
import type { IListProductRequest } from '$lib/core-commons/types/api/products';
import type { ICustomer, IUpdateCustomerRequest } from '$lib/core-commons/types/api/profile';
import type { ISignupRequest } from '$lib/core-commons/types/api/signupPage';
import {
	getAPIUri,
	getAuthAndConfigHeaders,
	getConfigHeaders,
	getCookiesFromDocument
} from '../utils';
import { API_BFF_CSR, API_IAM_CSR } from './config';
import type { IRaiseSupportTicketRequest } from '$lib/core-commons/types/api/homePage';

export async function getCountryList() {
	const headers = getConfigHeaders(getCookiesFromDocument());
	return API_BFF_CSR.get<ICountryResponse>(getAPIUri('countries'), {
		headers
	});
}

export async function generateOtp(request: IGenerateOtpRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_IAM_CSR.post<IGenerateOtpResponse>(getAPIUri('otp:generate', 'iam'), request, {
		headers
	});
}

export async function validateActivationCode(request: IValidateActivationCodeRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_IAM_CSR.post(getAPIUri('activationCode:validate', 'iam'), request, {
		headers
	});
}

export async function validateOtp(request: IValidateOtpRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_IAM_CSR.post(getAPIUri('otp:validate', 'iam'), request, {
		headers
	});
}

export async function loginCustomer(request: ILoginCustomerRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_IAM_CSR.post(getAPIUri('customer:login', 'iam'), request, {
		headers
	});
}

export async function signupCustomer(request: ISignupRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_IAM_CSR.post(getAPIUri('signup', 'iam'), request, {
		headers
	});
}

export async function getCustomer() {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_BFF_CSR.get<ICustomer>(getAPIUri('customers/*', 'bff'), {
		headers
	});
}

export async function updateCustomer(request: IUpdateCustomerRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	const newRequest = { ...request };
	delete newRequest.name;
	return API_BFF_CSR.patch(getAPIUri(request.name as string, 'bff'), newRequest, {
		headers
	});
}

export async function getCreateOrder(request: IOrderRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_BFF_CSR.post(getAPIUri('carts/-/orders'), request, {
		headers
	});
}

export async function getEventData(startDate: string, endDate: string) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	const queryParams = new URLSearchParams();
	queryParams.append('startDate', startDate);
	queryParams.append('endDate', endDate);
	return API_BFF_CSR.get(getAPIUri('events'), {
		headers,
		params: queryParams
	});
}

export async function getListCategoriesLocal(request: IListCategoryRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	const queryParams = new URLSearchParams();
	Object.entries(request).forEach(([key, value]) => {
		if (value) {
			queryParams.append(key, value);
		}
	});
	return API_BFF_CSR.get(getAPIUri('categories'), {
		headers,
		params: queryParams
	});
}

export async function getCategoryLocal(slug: string, request: ICategoryRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	const queryParams = new URLSearchParams();
	Object.entries(request).forEach(([key, value]) => {
		if (value) {
			queryParams.append(key, value);
		}
	});
	return API_BFF_CSR.get(getAPIUri('categories/' + slug), {
		headers,
		params: queryParams
	});
}

export async function getListProductsLocal(slug: string, request: IListProductRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	const queryParams = new URLSearchParams();
	Object.entries(request).forEach(([key, value]) => {
		if (value) {
			queryParams.append(key, value);
		}
	});
	return API_BFF_CSR.get(getAPIUri('categories/' + slug + '/products'), {
		headers,
		params: queryParams
	});
}

export async function getMenuLocal() {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_BFF_CSR.get(getAPIUri('menu'), {
		headers
	});
}

export async function getUpcomingEventLocal() {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_BFF_CSR.get(getAPIUri('events/upcoming'), {
		headers
	});
}

export async function getCollection(slug: string, request: IGetCollectionRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_BFF_CSR.get(getAPIUri('collections/' + slug), {
		headers
	});
}

export async function raiseSupportTicket(request: IRaiseSupportTicketRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	return API_BFF_CSR.post(getAPIUri('supportTicket'), request, {
		headers
	});
}

export async function getListCoupons(request: IListCouponsRequest) {
	const headers = getAuthAndConfigHeaders(getCookiesFromDocument());
	const queryParams = new URLSearchParams();
	Object.entries(request).forEach(([key, value]) => {
		if (value) {
			queryParams.append(key, value);
		}
	});
	return API_BFF_CSR.get(getAPIUri('coupon'), {
		headers,
		params: queryParams
	});
}
