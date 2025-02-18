// localhost 여부를 확인하는 함수
// localhost, [::1](IPv6 localhost), 127.xxx.xxx.xxx(IPv4 localhost) 체크
const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
        window.location.hostname === '[::1]' ||
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// 서비스 워커 설정을 위한 타입 정의
type Config = {
    // 서비스 워커 등록 성공 시 실행될 콜백
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    // 서비스 워커 업데이트 시 실행될 콜백
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

// 서비스 워커 등록 함수
export function register(config?: Config) {
    // 프로덕션 환경이고 브라우저가 서비스 워커를 지원하는 경우에만 실행
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        console.log('register');
        // PUBLIC_URL이 같은 도메인인지 확인
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) {
            return;
        }

        // 페이지 로드가 완료된 후 서비스 워커 등록
        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

            // localhost인 경우와 아닌 경우 다르게 처리
            if (isLocalhost) {
                checkValidServiceWorker(swUrl, config);
            } else {
                registerValidSW(swUrl, config);
            }
        });
    }
}

// 서비스 워커 등록 함수
export function registerServiceWorker() {
    navigator.serviceWorker
        .register('firebase-messaging-sw.js')
        .then(function (registration) {
            console.log('Service Worker 등록 성공:', registration);
            alert(`Service Worker 등록 성공:, ${registration}`);
        })
        .catch(function (error) {
            console.log('Service Worker 등록 실패:', error);
            alert(`Service Worker 등록 실패:, ${error}`);
        });
}

// 서비스 워커 등록 실행 함수
function registerValidSW(swUrl: string, config?: Config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            // 서비스 워커 업데이트 감지
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) {
                    return;
                }
                // 서비스 워커 상태 변경 감지
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // 새로운 컨텐츠가 있는 경우
                            console.log('New content is available; please refresh.');
                            if (config?.onUpdate) {
                                config.onUpdate(registration);
                            }
                        } else {
                            // 모든 컨텐츠가 캐시된 경우
                            console.log('Content is cached for offline use.');
                            if (config?.onSuccess) {
                                config.onSuccess(registration);
                            }
                        }
                    }
                };
            };
        })
        .catch((error) => {
            console.error('Error during service worker registration:', error);
        });
}

// 서비스 워커 유효성 검사 함수
function checkValidServiceWorker(swUrl: string, config?: Config) {
    // 서비스 워커 스크립트 fetch
    fetch(swUrl, {
        headers: { 'Service-Worker': 'script' },
    })
        .then((response) => {
            const contentType = response.headers.get('content-type');
            // 404 에러이거나 자바스크립트 파일이 아닌 경우
            if (response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1)) {
                // 서비스 워커 등록 해제 후 페이지 새로고침
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister().then(() => {
                        window.location.reload();
                    });
                });
            } else {
                // 정상적인 경우 서비스 워커 등록
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            // 오프라인인 경우
            console.log('No internet connection found. App is running in offline mode.');
        });
}

// 서비스 워커 등록 해제 함수
export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}
