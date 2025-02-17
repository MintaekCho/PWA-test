/// <reference lib="webworker" />

import { getMessaging, onMessage } from 'firebase/messaging';
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

const messaging = getMessaging();

// 포그라운드 메시지 핸들러
onMessage(messaging, (payload) => {
    console.log('Received foreground message:', payload);
    // 여기서 알림을 직접 표시하거나 UI를 업데이트
    if (!payload.notification) {
        return;
    }
    new Notification(payload.notification.title || 'No title', {
        body: payload.notification.body || 'No body',
        icon: '/logo192.png',
        badge: '/smartTSLogo.png',
    });
});
