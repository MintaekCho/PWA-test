import React, { useState, useEffect } from 'react';
import { Camera, Bell, Wifi, WifiOff, Award } from 'lucide-react';
import QRScanner from './components/QRScanner';
import { getFCMToken } from './firebase';
import { getMessaging, onMessage } from 'firebase/messaging';

// 앱 버전 정보
const APP_VERSION = '1.0.7';

const App = () => {
    // 상태값 정의
    const [currentSection, setCurrentSection] = useState('home'); // 현재 보여지는 섹션 (home/camera)
    const [isOnline, setIsOnline] = useState(navigator.onLine); // 온라인 상태
    const [notificationStatus, setNotificationStatus] = useState('pending'); // 알림 권한 상태 (pending/granted/denied)
    const [showFeatureHighlight, setShowFeatureHighlight] = useState(false); // 기능 하이라이트 모달 표시 여부
    const [deviceToken, setDeviceToken] = useState<string>(''); // FCM 디바이스 토큰
    const [notificationSupported, setNotificationSupported] = useState(false); // 브라우저의 알림 지원 여부

    // 온라인/오프라인 상태 감지를 위한 이벤트 리스너 설정
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 브라우저의 알림 지원 여부 확인 및 현재 알림 권한 상태 설정
    useEffect(() => {
        const isSupported = 'Notification' in window;
        setNotificationSupported(isSupported);

        if (isSupported) {
            setNotificationStatus(Notification.permission);
        }
    }, []);

    // 포그라운드 메시지 수신 처리
    useEffect(() => {
        const messaging = getMessaging();
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Received foreground message:', payload);

            // PWA 설치 상태 확인
            const isPWA = window.matchMedia('(display-mode: standalone)').matches;
            console.log('Is PWA:', isPWA);

            // 알림 권한이 허용된 경우 직접 알림 생성
            if (Notification.permission === 'granted') {
                try {
                    const notification = payload.notification || {};
                    const { title = 'Default Title', body = 'Default Body' } = notification;
                    navigator.serviceWorker.ready.then((registration) => {
                        registration.showNotification(title, {
                            body: body,
                            icon: '/logo192.png',
                            badge: '/smartTSLogo.png',
                        });
                    });
                } catch (error) {
                    console.error('서비스워커 알림 생성 실패:', error);
                }
            }
        });

        return () => unsubscribe();
    }, [notificationSupported]);

    // 알림 권한 요청 및 FCM 토큰 발급 함수
    const requestNotification = async () => {
        // 브라우저가 알림을 지원하지 않는 경우
        if (!notificationSupported) {
            alert('이 브라우저는 알림을 지원하지 않습니다.');
            return;
        }

        // 이미 알림이 거부된 경우
        if (notificationStatus === 'denied') {
            alert('브라우저 설정에서 알림 권한을 허용해주세요.');
            return;
        }

        setNotificationStatus('requesting');
        try {
            // 알림 권한 요청
            const permission = await Notification.requestPermission();
            setNotificationStatus(permission);

            if (permission === 'granted') {
                try {
                    // FCM 토큰 발급 요청
                    const token = await getFCMToken();
                    if (token) {
                        setDeviceToken(token);
                    } else {
                        throw new Error('FCM 토큰을 받아올 수 없습니다.');
                    }
                } catch (fcmError) {
                    console.error('FCM 토큰 에러:', fcmError);
                    alert('푸시 알림 설정 중 문제가 발생했습니다. 나중에 다시 시도해주세요.');
                }
            }
        } catch (error) {
            console.error('알림 권한 요청 에러:', error);
            setNotificationStatus('denied');
            alert('알림 권한 요청 중 문제가 발생했습니다.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 text-white p-4">
            {/* 상태바 - 온라인 상태, 알림 상태, 버전 정보 표시 */}
            <div className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur p-2 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    {/* 온라인 상태 표시 */}
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi className="w-4 h-4 text-green-400" />
                        ) : (
                            <WifiOff className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
                        <span className="text-xs text-gray-400 ml-2">v{APP_VERSION}</span>
                    </div>
                    {/* 알림 상태 표시 */}
                    <div className="flex items-center gap-2">
                        <Bell className={`w-4 h-4 ${notificationSupported ? 'text-green-400' : 'text-red-400'}`} />
                        <span className="text-sm">{notificationSupported ? notificationStatus : 'Not Supported'}</span>
                    </div>
                </div>

                {/* FCM 디바이스 토큰 표시 영역 */}
                {deviceToken && (
                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
                        <input
                            type="text"
                            value={deviceToken}
                            readOnly
                            className="flex-1 bg-transparent text-xs overflow-hidden text-ellipsis"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(deviceToken);
                                alert('Token copied to clipboard!');
                            }}
                            className="px-2 py-1 bg-purple-600 text-xs rounded hover:bg-purple-700 transition-colors"
                        >
                            Copy Token
                        </button>
                    </div>
                )}
            </div>

            {/* 메인 컨텐츠 영역 */}
            <div className={`max-w-4xl mx-auto ${deviceToken ? 'pt-28' : 'pt-16'}`}>
                {/* 헤더 */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        PWA Experience
                    </h1>
                    <p className="text-lg text-gray-300 opacity-75">Discover the power of modern web</p>
                </div>

                {/* 기능 카드 영역 - QR 스캐너와 알림 설정 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* QR 스캐너 카드 */}
                    <div
                        className="group bg-black/30 backdrop-blur p-6 rounded-lg hover:bg-black/40 transition-all duration-300 cursor-pointer"
                        onClick={() => setCurrentSection('camera')}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Camera className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">QR Scanner</h3>
                                <p className="text-gray-300">Scan QR codes instantly</p>
                            </div>
                        </div>
                    </div>

                    {/* 알림 설정 카드 */}
                    <div
                        className={`group bg-black/30 backdrop-blur p-6 rounded-lg hover:bg-black/40 transition-all duration-300 ${
                            notificationSupported ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                        }`}
                        onClick={requestNotification}
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-pink-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Bell className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Notifications</h3>
                                <p className="text-gray-300">
                                    {notificationSupported
                                        ? 'Stay updated in real-time'
                                        : 'Not supported in this browser'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR 스캐너 섹션 */}
                <div className="relative">
                    {currentSection === 'camera' && (
                        <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden">
                            <div className="p-6">
                                <div className="relative">
                                    <button
                                        className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                        onClick={() => setCurrentSection('home')}
                                    >
                                        Close
                                    </button>
                                    <QRScanner />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 플로팅 버튼 - 기능 하이라이트 모달 토글 */}
                <button
                    className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform"
                    onClick={() => setShowFeatureHighlight(!showFeatureHighlight)}
                >
                    <Award className="w-6 h-6" />
                </button>

                {/* 기능 하이라이트 모달 */}
                {showFeatureHighlight && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowFeatureHighlight(false)}
                    >
                        <div className="bg-black/30 backdrop-blur max-w-md w-full rounded-lg p-6">
                            <h3 className="text-xl font-bold mb-4">✨ Pro Features</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                    <span>Offline Support</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-pink-500 rounded-full" />
                                    <span>Background Sync</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                    <span>Push Notifications</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
