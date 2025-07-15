/// <reference types="@sveltejs/kit" />

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { build, files, version } from '$service-worker';

const CACHE = `cache-${version}`;
const ASSETS = [...build, ...files];

self.addEventListener('install', (event) => {
	const essentialUrls = [
		// '/api/important-data', // Replace with your actual API endpoints
		// '/offline.html' // Fallback page
	];

	event.waitUntil(
		caches.open(CACHE).then(async (cache) => {
			await cache.addAll([...ASSETS, ...essentialUrls]);
		})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE) await caches.delete(key);
			}
			await self.clients.claim();
		})
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Navigation requests (HTML pages)
	if (event.request.mode === 'navigate') {
		event.respondWith(
			caches
				.match(event.request)
				.then((cachedResponse) => {
					return cachedResponse || fetchAndCache(event.request);
				})
				.catch(() => caches.match('/offline.html'))
		);
		return;
	}

	// API requests
	if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
		event.respondWith(
			caches.open(CACHE).then((cache) => {
				return cache.match(event.request).then((cachedResponse) => {
					const fetchPromise = fetch(event.request).then((networkResponse) => {
						if (networkResponse.status === 200) {
							cache.put(event.request, networkResponse.clone());
						}
						return networkResponse;
					});
					return cachedResponse || fetchPromise;
				});
			})
		);
		return;
	}

	// Static assets
	if (ASSETS.includes(url.pathname)) {
		event.respondWith(caches.match(event.request));
		return;
	}

	// Other requests
	event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

async function fetchAndCache(request) {
	const cache = await caches.open(CACHE);
	try {
		const response = await fetch(request);
		if (response.status === 200) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		const cachedResponse = await cache.match(request);
		console.log(error);
		return cachedResponse || new Response('Offline', { status: 503, statusText: 'Offline' });
	}
}

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});
