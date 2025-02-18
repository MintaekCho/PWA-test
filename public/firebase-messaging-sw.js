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

// messaging.onBackgroundMessage((payload) => {
//     console.log('Received background message:', payload);

//     const notificationTitle = payload.notification.title;
//     const notificationOptions = {
//         body: payload.notification.body,
//         icon: '/logo192.png',
//         badge: '/smartTSLogo.png',
//     };

//     self.registration.showNotification(notificationTitle, notificationOptions);
// });

// self.addEventListener("push", function (e) {
//     if (!e.data.json()) return;
//     const resultData = e.data.json().notification;
//     const notificationTitle = resultData.title;
//     const notificationOptions = {
//       body: resultData.body,
//       vibrate: [200, 100, 200], // 진동 패턴
//       tag: 'notification-tag',   // 알림 그룹화
//       renotify: true,           // 같은 tag여도 다시 알림
//       silent: false,            // 소리 허용
//       requireInteraction: true, // 사용자가 직접 닫을 때까지 유지
//       actions: [                // 알림 액션 버튼
//           {
//               action: 'open',
//               title: '열기'
//           }
//       ]

//     };
//     console.log(resultData.title, {
//       body: resultData.body,
//     });
//     e.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
//   });

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png',
        badge: '/smartTSLogo.png',
        // 추가 옵션들
        vibrate: [200, 100, 200], // 진동 패턴
        tag: 'notification-tag', // 알림 그룹화
        renotify: true, // 같은 tag여도 다시 알림
        silent: false, // 소리 허용
        requireInteraction: true, // 사용자가 직접 닫을 때까지 유지
        actions: [
            // 알림 액션 버튼
            {
                action: 'open',
                title: '열기',
            },
        ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click received.');
    event.waitUntil(self.clients.openWindow('/'));
    event.notification.close();
});
