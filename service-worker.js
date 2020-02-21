const CACHE_NAME = 'wpisz-tutaj-dowolny-string';

// List of files which are store in cache.
let filesToCache = [
    '/',
    '/styles.css',
    '/images/logo.png',
    '/scripts.js',
	'/db.js',
	'raleway_medium.ttf'
];

self.addEventListener('install', function (evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(filesToCache);
        }).catch(function (err) {
            // Snooze errors...
            // console.error(err);
        })
    );
});

self.addEventListener('fetch', function (evt) {
    // Snooze logs...
    // 
    evt.respondWith(
        // Firstly, send request..
        fetch(evt.request).catch(function () {
            // When request failed, return file from cache...
            return caches.match(evt.request);
        })
    );
});
