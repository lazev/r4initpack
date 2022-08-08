var R4ServiceWorkerCacheName = 'v1';

var R4ServiceWorkerCacheFiles = [
	'/'
];

self.addEventListener('install', event => {
	console.info('[SW] install '+ R4ServiceWorkerCacheName);
	event.waitUntil(addResourcesToCache(R4ServiceWorkerCacheFiles));
});


self.addEventListener('fetch', (event) => {
	event.respondWith(
		cacheFirst({
			request: event.request,
			preloadResponsePromise: event.preloadResponse,
			fallbackUrl: ''
		})
	);
});


self.addEventListener('activate', event => {
	event.waitUntil(async () => deleteOldCaches());
	event.waitUntil(async () => enableNavigationPreload());
});


var addResourcesToCache = async resources => {
  let cache = await caches.open(R4ServiceWorkerCacheName);
  await cache.addAll(resources);
};


var putInCache = async (request, response) => {
  let cache = await caches.open(R4ServiceWorkerCacheName);
  await cache.put(request, response);
};


var cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {

	if(request.url.substr(-4) != '.php') {
		let responseFromCache = await caches.match(request);
		if(responseFromCache) {
			//console.info('[SW] cache', responseFromCache);
			return responseFromCache;
		}
	}

	let preloadResponse = await preloadResponsePromise;
	if(preloadResponse) {
		//console.info('[SW] preload', preloadResponse);
		putInCache(request, preloadResponse.clone());
		return preloadResponse;
	}

	try {
		let responseFromNetwork = await fetch(request);

		if(request.method != 'POST')
			putInCache(request, responseFromNetwork.clone());

		//console.info('[SW] network', responseFromNetwork);

		return responseFromNetwork;

	} catch (error) {

		let fallbackResponse = await caches.match(fallbackUrl);
		if(fallbackResponse) return fallbackResponse;

		return new Response('Internet?', {
			status: 408,
			headers: { 'Content-Type': 'text/plain' },
		});
	}
};


var enableNavigationPreload = async () => {
	if(self.registration.navigationPreload) {
		await self.registration.navigationPreload.enable();
	}
};


var deleteCache = async key => {
	await caches.delete(key);
};


var deleteOldCaches = async () => {
	let cacheKeepList = [R4ServiceWorkerCacheName];
	let keyList = await caches.keys();
	let cachesToDelete = keyList.filter((key) => !cacheKeepList.includes(key));
	await Promise.all(cachesToDelete.map(deleteCache));
};


//self.addEventListener('message', function (event) {
//	if(event.data.action === 'skipWaiting') {
//		self.skipWaiting();
//	}
//});