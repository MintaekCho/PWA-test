/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

// 싱글 페이지 앱을 위한 설정
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(({ request, url }: { request: Request; url: URL }) => {
    if (request.mode !== 'navigate') {
        return false;
    }
    if (url.pathname.startsWith('/_')) {
        return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
        return false;
    }
    return true;
}, createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html'));

// 푸시 알림 처리
// self.addEventListener('push', (event) => {
//     const data = event.data?.json() ?? {};

//     event.waitUntil(
//         self.registration.showNotification(data.title ?? 'New Message', {
//             body: data.body ?? 'You have a new message',
//             icon: '/smartTSLogo.png',
//             badge: '/smartTSLogo.png',
//         })
//     );
// });

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(self.clients.openWindow('/'));
});
