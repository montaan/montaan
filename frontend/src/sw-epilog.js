workbox.routing.registerRoute(
    new RegExp('/_/(user/view|cards/(list|viewed|(view|vcard)/[a-f0-9-]+))$'),
    new workbox.strategies.NetworkFirst()
);
self.addEventListener('install', event => {
    self.skipWaiting();
});