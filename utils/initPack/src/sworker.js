var cacheName = 'AppName-v4';

var filesToCache = [
	'index.html',
	'manifest.json',
	'',
];

self.addEventListener('install', function(e) {
	console.log('[ServiceWorker] Install');
	e.waitUntil(
		caches.open(cacheName).then(function(cache) {
			console.log('[ServiceWorker] Caching app shell');
			return cache.addAll(filesToCache);
		})
	);
});

self.addEventListener('fetch', event => {
	console.log('[ServiceWorker] Fetching');
	event.respondWith(
		caches.match(event.request, {ignoreSearch:true}).then(response => {
			return response || fetch(event.request);
		})
	);
});

//self.addEventListener('activate', event => {
//	event.waitUntil(self.clients.claim());
//});

//self.addEventListener('message', function (event) {
//	if(event.data.action === 'skipWaiting') {
//		self.skipWaiting();
//	}
//});