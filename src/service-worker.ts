/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';

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


// 포그라운드 메시지 핸들러
self.addEventListener('push', (event: PushEvent) => {
    console.log('Received push message:', event);
    const title = '알림 테스트';
    const options = {
        body: event.data?.text(),
        icon: '/logo192.png',
        badge: '/smartTSLogo.png',
    };
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});