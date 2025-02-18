/// <reference lib="webworker" />

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyA8BcUTgJ3wukM97Gj20fPUaoL7xatolK4',
    authDomain: 'pwa-test-e17a9.firebaseapp.com',
    projectId: 'pwa-test-e17a9',
    storageBucket: 'pwa-test-e17a9.firebasestorage.app',
    messagingSenderId: '508178722344',
    appId: '1:508178722344:web:ff3af4e7cf067e26cd8f1d',
});

const messaging = firebase.messaging();

// 설치 이벤트 추가
self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    self.skipWaiting();
});

// 활성화 이벤트 추가
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
});

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png',
        badge: '/smartTSLogo.png',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.');
    event.waitUntil(self.clients.openWindow('/'));
    event.notification.close();
});
