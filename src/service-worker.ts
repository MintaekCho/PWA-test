/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';

declare const self: ServiceWorkerGlobalScope;

clientsClaim(); // 서비스 워커가 즉시 제어권을 가질 수 있게함

precacheAndRoute(self.__WB_MANIFEST); // 정적 자원 캐싱 (__WB_MANIFEST는 빌드 시 생성되는 정적 자원 목록이며 오프라인 동작을 가능하게 하는 핵심기능)

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

const CACHE_NAME = 'pdf-cache-v1';
const urlsToCache = [
    '/',
    '/fonts/PretendardVariable.ttf',
    // 필요 시 추가 리소스
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});