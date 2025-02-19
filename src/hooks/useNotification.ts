import { useState, useEffect } from 'react';
import { getFCMToken } from '../firebase'; // 기존 Firebase 서비스 import

interface UseNotificationReturn {
    notificationSupported: boolean;
    notificationStatus: NotificationPermission | 'requesting';
    deviceToken: string;
    requestNotification: () => Promise<void>;
}

export function useNotification(): UseNotificationReturn {
    const [notificationSupported, setNotificationSupported] = useState<boolean>(false);
    const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'requesting'>('default');
    const [deviceToken, setDeviceToken] = useState<string>('');

    // 초기화: 브라우저 알림 지원 여부 및 현재 권한 상태 확인
    useEffect(() => {
        const isSupported = 'Notification' in window;
        setNotificationSupported(isSupported);

        if (isSupported) {
            setNotificationStatus(Notification.permission as NotificationPermission);
        }
    }, []);

    // 알림 권한 요청 함수
    const requestNotification = async (): Promise<void> => {
        if (!notificationSupported) {
            alert('이 브라우저는 알림을 지원하지 않습니다.');
            return;
        }

        if (notificationStatus === 'denied') {
            alert('브라우저 설정에서 알림 권한을 허용해주세요.');
            return;
        }

        setNotificationStatus('requesting');
        try {
            const permission = await Notification.requestPermission();
            setNotificationStatus(permission);

            if (permission === 'granted') {
                try {
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

    return {
        notificationSupported,
        notificationStatus,
        deviceToken,
        requestNotification,
    };
}
