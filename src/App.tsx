import React, { useState, useEffect, useRef } from 'react';
import { Camera, Bell, Wifi, WifiOff, Award, FileText, Pen, Phone, 
         Upload, MapPin, Image } from 'lucide-react';
import QRScanner from './components/QRScanner';
import { getFCMToken } from './firebase';
import { getMessaging, onMessage } from 'firebase/messaging';
import SignatureCanvas from 'react-signature-canvas';
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// 타입 정의
type TestResult = {
  tested: boolean;
  success: boolean;
  details: string;
};

type TestResults = {
  pdf: TestResult;
  signature: TestResult;
  phone: TestResult;
  fileIO: TestResult;
  location: TestResult;
  photo: TestResult;
};

type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type Summary = {
  totalTests: number;
  testedCount: number;
  successCount: number;
  successRate: number;
};

// PDF 스타일 정의
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20
  },
  text: {
    margin: 12,
    fontSize: 14,
    textAlign: 'justify'
  }
});

// 앱 버전 정보
const APP_VERSION = '1.0.8';

const App: React.FC = () => {
    // 기존 상태값
    const [currentSection, setCurrentSection] = useState<string>('home'); // 현재 보여지는 섹션
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'requesting'>('default');
    const [showFeatureHighlight, setShowFeatureHighlight] = useState<boolean>(false);
    const [deviceToken, setDeviceToken] = useState<string>('');
    const [notificationSupported, setNotificationSupported] = useState<boolean>(false);
    
    // 테스트 기능을 위한 새로운 상태값
    const [pdfFile, setPdfFile] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [signatureData, setSignatureData] = useState<string>('');
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<TestResults>({
        pdf: { tested: false, success: false, details: '' },
        signature: { tested: false, success: false, details: '' },
        phone: { tested: false, success: false, details: '' },
        fileIO: { tested: false, success: false, details: '' },
        location: { tested: false, success: false, details: '' },
        photo: { tested: false, success: false, details: '' },
    });
    
    // 참조값
    const sigCanvas = useRef<SignatureCanvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const photoInputRef = useRef<HTMLInputElement | null>(null);
    
    // 기존 useEffect 유지 (온라인 상태, 알림 설정)
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const isSupported = 'Notification' in window;
        setNotificationSupported(isSupported);

        if (isSupported) {
            setNotificationStatus(Notification.permission as NotificationPermission);
        }
    }, []);

    useEffect(() => {
        if (!notificationSupported) return;
        
        const messaging = getMessaging();
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Received foreground message:', payload);
            const isPWA = window.matchMedia('(display-mode: standalone)').matches;
            console.log('Is PWA:', isPWA);

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

    // 1. PDF 렌더링 테스트 함수 (@react-pdf/renderer 사용)
    const handlePdfTest = (): void => {
        setCurrentSection('pdf-test');
        // 테스트 상태 초기화
        setTestResults(prev => ({
            ...prev,
            pdf: { tested: true, success: false, details: '테스트 진행 중...' }
        }));

        // 간단한 PDF 생성 테스트
        try {
            // 렌더링 시도만으로 테스트
            setTestResults(prev => ({
                ...prev,
                pdf: { 
                    tested: true, 
                    success: true, 
                    details: 'PDF 렌더링 컴포넌트 로드 성공' 
                }
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('PDF 렌더링 초기화 오류:', error);
            setTestResults(prev => ({
                ...prev,
                pdf: { 
                    tested: true, 
                    success: false, 
                    details: `PDF 렌더링 초기화 실패: ${errorMessage}` 
                }
            }));
        }
    };
    
    // PDF 샘플 컴포넌트 - 테스트용
    const SamplePDF: React.FC = () => (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.title}>PWA 테스트 문서</Text>
                    <Text style={styles.text}>
                        이 문서는 PWA 환경에서 @react-pdf/renderer 라이브러리의 
                        PDF 렌더링 기능을 테스트하기 위해 생성되었습니다.
                    </Text>
                    <Text style={styles.text}>
                        테스트 일시: {new Date().toLocaleString()}
                    </Text>
                    <Text style={styles.text}>
                        기기 정보: {navigator.userAgent}
                    </Text>
                </View>
            </Page>
        </Document>
    );

    // 2. 전자서명 테스트 함수
    const handleSignatureTest = (): void => {
        setCurrentSection('signature-test');
        setTestResults(prev => ({
            ...prev,
            signature: { tested: true, success: false, details: '서명을 그려주세요' }
        }));
    };
    
    const clearSignature = (): void => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            setSignatureData('');
            setTestResults(prev => ({
                ...prev,
                signature: { tested: true, success: false, details: '서명이 지워졌습니다' }
            }));
        }
    };
    
    const saveSignature = (): void => {
        if (!sigCanvas.current) return;
        
        if (sigCanvas.current.isEmpty()) {
            alert('서명을 먼저 그려주세요');
            return;
        }
        
        const dataURL = sigCanvas.current.toDataURL('image/png');
        setSignatureData(dataURL);
        setTestResults(prev => ({
            ...prev,
            signature: { 
                tested: true, 
                success: true, 
                details: `서명 저장 성공: ${new Date().toLocaleString()}` 
            }
        }));
        
        // 서명 다운로드 옵션 제공
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = `signature-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    // 3. 전화 테스트 함수
    const handlePhoneTest = (): void => {
        setCurrentSection('phone-test');
        const phoneNumber = '01012345678'; // 테스트용 번호
        
        try {
            // tel: 프로토콜 지원 테스트
            const telLink = document.createElement('a');
            telLink.href = `tel:${phoneNumber}`;
            telLink.textContent = '전화 걸기';
            
            // 지원 여부 확인 (간접적으로)
            const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
            
            setTestResults(prev => ({
                ...prev,
                phone: { 
                    tested: true, 
                    success: isMobile, 
                    details: isMobile 
                        ? '전화 기능이 지원됩니다. 테스트하려면 아래 버튼을 클릭하세요.' 
                        : '현재 기기에서는 전화 기능이 지원되지 않을 수 있습니다 (데스크톱 환경)' 
                }
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setTestResults(prev => ({
                ...prev,
                phone: { tested: true, success: false, details: `전화 기능 테스트 중 오류: ${errorMessage}` }
            }));
        }
    };
    
    const makePhoneCall = (): void => {
        try {
            window.location.href = 'tel:01012345678';
            // 성공 여부는 사용자 확인 필요
            setTimeout(() => {
                const confirmed = window.confirm('전화 앱이 열렸나요?');
                setTestResults(prev => ({
                    ...prev,
                    phone: { 
                        tested: true, 
                        success: confirmed, 
                        details: confirmed 
                            ? '전화 기능 테스트 성공' 
                            : '전화 기능 테스트 실패 - 전화 앱이 열리지 않았습니다' 
                    }
                }));
            }, 1000);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setTestResults(prev => ({
                ...prev,
                phone: { tested: true, success: false, details: `전화 걸기 실패: ${errorMessage}` }
            }));
        }
    };

    // 4. 파일 I/O 테스트 함수
    const handleFileIOTest = (): void => {
        setCurrentSection('file-io-test');
        setTestResults(prev => ({
            ...prev,
            fileIO: { tested: true, success: false, details: '파일을 선택해주세요' }
        }));
    };
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && event.target.result) {
                    setImageFile(file);
                    setTestResults(prev => ({
                        ...prev,
                        fileIO: { 
                            tested: true, 
                            success: true, 
                            details: `파일 업로드 성공: ${file.name} (${(file.size / 1024).toFixed(2)} KB)` 
                        }
                    }));
                }
            };
            reader.onerror = (error) => {
                setTestResults(prev => ({
                    ...prev,
                    fileIO: { tested: true, success: false, details: `파일 읽기 실패: ${error}` }
                }));
            };
            reader.readAsDataURL(file);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setTestResults(prev => ({
                ...prev,
                fileIO: { tested: true, success: false, details: `파일 처리 중 오류: ${errorMessage}` }
            }));
        }
    };
    
    const downloadTestFile = (): void => {
        try {
            // 테스트용 텍스트 파일 생성
            const content = `PWA 파일 다운로드 테스트\n${new Date().toLocaleString()}\n기기 정보: ${navigator.userAgent}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `pwa-test-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            setTestResults(prev => ({
                ...prev,
                fileIO: { 
                    tested: true, 
                    success: true, 
                    details: `파일 다운로드 테스트 완료: ${new Date().toLocaleString()}` 
                }
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setTestResults(prev => ({
                ...prev,
                fileIO: { tested: true, success: false, details: `파일 다운로드 실패: ${errorMessage}` }
            }));
        }
    };

    // 5. 위치정보 테스트 함수
    const handleLocationTest = (): void => {
        setCurrentSection('location-test');
        setTestResults(prev => ({
            ...prev,
            location: { tested: true, success: false, details: '위치 정보 요청 중...' }
        }));
        
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                // 성공 콜백
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setUserLocation({
                        latitude,
                        longitude,
                        accuracy,
                        timestamp: position.timestamp
                    });
                    setTestResults(prev => ({
                        ...prev,
                        location: { 
                            tested: true, 
                            success: true, 
                            details: `위치: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (정확도: ${accuracy.toFixed(1)}m)` 
                        }
                    }));
                },
                // 에러 콜백
                (error) => {
                    let errorMsg = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg = '사용자가 위치 정보 요청을 거부했습니다';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMsg = '위치 정보를 사용할 수 없습니다';
                            break;
                        case error.TIMEOUT:
                            errorMsg = '위치 정보 요청 시간이 초과되었습니다';
                            break;
                        default:
                            errorMsg = '알 수 없는 오류가 발생했습니다';
                    }
                    setLocationError(errorMsg);
                    setTestResults(prev => ({
                        ...prev,
                        location: { tested: true, success: false, details: errorMsg }
                    }));
                },
                // 옵션
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            setLocationError('이 브라우저는 위치 정보를 지원하지 않습니다');
            setTestResults(prev => ({
                ...prev,
                location: { 
                    tested: true, 
                    success: false, 
                    details: '이 브라우저는 위치 정보를 지원하지 않습니다' 
                }
            }));
        }
    };

    // 6. 사진 접근 테스트 함수
    const handlePhotoTest = (): void => {
        setCurrentSection('photo-test');
        setTestResults(prev => ({
            ...prev,
            photo: { tested: true, success: false, details: '사진 접근 테스트 중...' }
        }));
    };
    
    const openPhotoPicker = (): void => {
        if (photoInputRef.current) {
            photoInputRef.current.click();
        }
    };
    
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 선택해주세요');
            setTestResults(prev => ({
                ...prev,
                photo: { tested: true, success: false, details: '잘못된 파일 형식' }
            }));
            return;
        }
        
        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && event.target.result) {
                    setImagePreview(event.target.result as string);
                    setTestResults(prev => ({
                        ...prev,
                        photo: { 
                            tested: true, 
                            success: true, 
                            details: `이미지 로드 성공: ${file.name} (${(file.size / 1024).toFixed(2)} KB)` 
                        }
                    }));
                }
            };
            reader.onerror = (error) => {
                setTestResults(prev => ({
                    ...prev,
                    photo: { tested: true, success: false, details: `이미지 읽기 실패: ${error}` }
                }));
            };
            reader.readAsDataURL(file);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setTestResults(prev => ({
                ...prev,
                photo: { tested: true, success: false, details: `이미지 처리 중 오류: ${errorMessage}` }
            }));
        }
    };
    
    // 카메라 직접 열기 테스트
    const openCamera = (): void => {
        if (photoInputRef.current) {
            try {
                // capture 속성 사용 시도 (모바일에서만 작동)
                photoInputRef.current.setAttribute('capture', 'environment');
                photoInputRef.current.click();
                
                setTestResults(prev => ({
                    ...prev,
                    photo: { 
                        ...prev.photo,
                        details: `${prev.photo.details} | 카메라 열기 요청됨` 
                    }
                }));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                setTestResults(prev => ({
                    ...prev,
                    photo: { 
                        tested: true, 
                        success: false, 
                        details: `카메라 열기 실패: ${errorMessage}` 
                    }
                }));
            }
        }
    };

    // 결과 요약 생성
    const generateSummary = (): Summary => {
        const successCount = Object.values(testResults).filter(test => test.success).length;
        const testedCount = Object.values(testResults).filter(test => test.tested).length;
        
        return {
            totalTests: 6,
            testedCount,
            successCount,
            successRate: testedCount > 0 ? Math.round((successCount / testedCount) * 100) : 0
        };
    };

    // 결과 공유 함수
    const shareResults = async (): Promise<void> => {
        const summary = generateSummary();
        const shareText = `
PWA 테스트 결과 (${new Date().toLocaleString()})
기기: ${navigator.userAgent}
총 테스트: ${summary.testedCount}/${summary.totalTests}
성공률: ${summary.successRate}%

세부 결과:
${Object.entries(testResults)
    .map(([key, value]) => `- ${key}: ${value.tested ? (value.success ? '✅ 성공' : '❌ 실패') : '⬜ 미테스트'}`)
    .join('\n')}
        `;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'PWA 테스트 결과',
                    text: shareText
                });
            } else {
                // 공유 API를 지원하지 않는 경우 클립보드에 복사
                await navigator.clipboard.writeText(shareText);
                alert('테스트 결과가 클립보드에 복사되었습니다');
            }
        } catch (error) {
            console.error('결과 공유 중 오류:', error);
            alert('결과 공유 중 오류가 발생했습니다');
        }
    };

    // UI 렌더링
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 text-white p-4">
            {/* 상태바 - 기존 코드 유지 */}
            <div className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur p-2 flex flex-col gap-2 z-10">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi className="w-4 h-4 text-green-400" />
                        ) : (
                            <WifiOff className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
                        <span className="text-xs text-gray-400 ml-2">v{APP_VERSION}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Bell className={`w-4 h-4 ${notificationSupported ? 'text-green-400' : 'text-red-400'}`} />
                        <span className="text-sm">{notificationSupported ? notificationStatus : 'Not Supported'}</span>
                    </div>
                </div>

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
                {currentSection === 'home' ? (
                    <>
                        {/* 헤더 */}
                        <div className="text-center mb-12">
                            <h1 className="text-5xl font-bold mb-4 animate-pulse bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                                PWA Test Suite
                            </h1>
                            <p className="text-lg text-gray-300 opacity-75">모바일 웹 앱 기능 테스트</p>
                        </div>

                        {/* 기존 기능 카드 - QR 스캐너, 알림 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

                        {/* 새로운 테스트 기능 카드 */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold mb-4 border-b border-purple-500 pb-2">PWA 기능 테스트</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* 1. PDF 렌더링 테스트 */}
                                <div 
                                    className="bg-black/30 backdrop-blur p-4 rounded-lg hover:bg-black/40 transition-all cursor-pointer"
                                    onClick={handlePdfTest}
                                >
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="p-3 bg-blue-600 rounded-full">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-medium">PDF 렌더링</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            testResults.pdf.tested 
                                            ? (testResults.pdf.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')
                                            : 'bg-gray-500/20 text-gray-300'
                                        }`}>
                                            {testResults.pdf.tested 
                                                ? (testResults.pdf.success ? '테스트 성공' : '테스트 실패')
                                                : '미테스트'}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. 전자서명 테스트 */}
                                <div 
                                    className="bg-black/30 backdrop-blur p-4 rounded-lg hover:bg-black/40 transition-all cursor-pointer"
                                    onClick={handleSignatureTest}
                                >
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="p-3 bg-green-600 rounded-full">
                                            <Pen className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-medium">전자서명</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            testResults.signature.tested 
                                            ? (testResults.signature.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')
                                            : 'bg-gray-500/20 text-gray-300'
                                        }`}>
                                            {testResults.signature.tested 
                                                ? (testResults.signature.success ? '테스트 성공' : '테스트 실패')
                                                : '미테스트'}
                                        </span>
                                    </div>
                                </div>

                                {/* 3. 전화 테스트 */}
                                <div 
                                    className="bg-black/30 backdrop-blur p-4 rounded-lg hover:bg-black/40 transition-all cursor-pointer"
                                    onClick={handlePhoneTest}
                                >
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="p-3 bg-yellow-600 rounded-full">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-medium">전화 기능</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            testResults.phone.tested 
                                            ? (testResults.phone.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')
                                            : 'bg-gray-500/20 text-gray-300'
                                        }`}>
                                            {testResults.phone.tested 
                                                ? (testResults.phone.success ? '테스트 성공' : '테스트 실패')
                                                : '미테스트'}
                                        </span>
                                    </div>
                                </div>

                                {/* 4. 파일 I/O 테스트 */}
                                <div 
                                    className="bg-black/30 backdrop-blur p-4 rounded-lg hover:bg-black/40 transition-all cursor-pointer"
                                    onClick={handleFileIOTest}
                                >
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="p-3 bg-purple-600 rounded-full">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-medium">파일 I/O</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            testResults.fileIO.tested 
                                            ? (testResults.fileIO.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')
                                            : 'bg-gray-500/20 text-gray-300'
                                        }`}>
                                            {testResults.fileIO.tested 
                                                ? (testResults.fileIO.success ? '테스트 성공' : '테스트 실패')
                                                : '미테스트'}
                                        </span>
                                    </div>
                                </div>

                                {/* 5. 위치정보 테스트 */}
                                <div 
                                    className="bg-black/30 backdrop-blur p-4 rounded-lg hover:bg-black/40 transition-all cursor-pointer"
                                    onClick={handleLocationTest}
                                >
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="p-3 bg-pink-600 rounded-full">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-medium">위치정보</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            testResults.location.tested 
                                            ? (testResults.location.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')
                                            : 'bg-gray-500/20 text-gray-300'
                                        }`}>
                                            {testResults.location.tested 
                                                ? (testResults.location.success ? '테스트 성공' : '테스트 실패')
                                                : '미테스트'}
                                        </span>
                                    </div>
                                </div>

                                {/* 6. 사진 접근 테스트 */}
                                <div 
                                    className="bg-black/30 backdrop-blur p-4 rounded-lg hover:bg-black/40 transition-all cursor-pointer"
                                    onClick={handlePhotoTest}
                                >
                                    <div className="flex flex-col items-center gap-3 text-center">
                                        <div className="p-3 bg-indigo-600 rounded-full">
                                            <Image className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-medium">사진 접근</h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            testResults.photo.tested 
                                            ? (testResults.photo.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')
                                            : 'bg-gray-500/20 text-gray-300'
                                        }`}>
                                            {testResults.photo.tested 
                                                ? (testResults.photo.success ? '테스트 성공' : '테스트 실패')
                                                : '미테스트'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 테스트 상태 요약 */}
                        <div className="bg-black/30 backdrop-blur p-6 rounded-lg mt-8">
                            <h2 className="text-xl font-semibold mb-4">테스트 진행 상황</h2>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">진행된 테스트:</span>
                                    <span className="font-medium">{generateSummary().testedCount}/{generateSummary().totalTests}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">성공한 테스트:</span>
                                    <span className="font-medium text-green-400">{generateSummary().successCount}/{generateSummary().testedCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">성공률:</span>
                                    <span className="font-medium">{generateSummary().successRate}%</span>
                                </div>
                                
                                <div className="w-full bg-black/30 rounded-full h-2.5 mt-4">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full" 
                                        style={{ width: `${(generateSummary().testedCount / generateSummary().totalTests) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            {generateSummary().testedCount > 0 && (
                                <button
                                    onClick={shareResults}
                                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors"
                                >
                                    테스트 결과 공유
                                </button>
                            )}
                        </div>
                    </>
                ) : currentSection === 'camera' ? (
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
                ) : currentSection === 'pdf-test' ? (
                    <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">PDF 렌더링 테스트 (@react-pdf/renderer)</h2>
                            <button
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                onClick={() => setCurrentSection('home')}
                            >
                                닫기
                            </button>
                        </div>
                        
                        <div className="bg-black/20 p-4 rounded-lg mb-4">
                            <div className="text-sm mb-2">테스트 상태:</div>
                            <div className={`text-sm ${testResults.pdf.success ? 'text-green-400' : 'text-red-400'}`}>
                                {testResults.pdf.details}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-black/20 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3">테스트 결과</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-300">라이브러리</dt>
                                        <dd className="text-sm">@react-pdf/renderer</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-300">렌더러</dt>
                                        <dd className="text-sm">브라우저 내장 (PDFViewer 컴포넌트)</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-300">기기 정보</dt>
                                        <dd className="text-xs break-words">{navigator.userAgent}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-300">PWA 상태</dt>
                                        <dd className="text-sm">
                                            {window.matchMedia('(display-mode: standalone)').matches 
                                                ? 'PWA 모드로 실행 중' 
                                                : '브라우저에서 실행 중 (PWA 아님)'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                            
                            <div className="bg-black/20 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3">테스트 옵션</h3>
                                <div className="space-y-4">
                                    <button
                                        className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors"
                                        onClick={() => {
                                            setTestResults(prev => ({
                                                ...prev, 
                                                pdf: {
                                                    ...prev.pdf,
                                                    details: `${prev.pdf.details} | PDF 뷰어 렌더링 테스트 시작`
                                                }
                                            }));
                                        }}
                                    >
                                        PDF 렌더링 테스트
                                    </button>
                                    <div className="text-sm text-gray-300">
                                        이 테스트는 @react-pdf/renderer를 사용하여 PDF를 동적으로 생성하고 
                                        표시하는 기능을 테스트합니다. 브라우저/기기별 호환성을 확인할 수 있습니다.
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* PDF 뷰어 영역 */}
                        <div className="mt-6 bg-white rounded-lg overflow-hidden" style={{ height: '500px' }}>
                            <PDFViewer width="100%" height="100%" className="border-0">
                                <SamplePDF />
                            </PDFViewer>
                        </div>
                        
                        {/* 테스트 결과 알림 */}
                        <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
                            <p className="text-green-300">
                                PDF 렌더링이 정상적으로 이루어진다면 테스트에 성공한 것입니다.
                                위 PDF가 정상적으로 보이는지 확인해주세요.
                            </p>
                        </div>
                    </div>
                ) : currentSection === 'signature-test' ? (
                    <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">전자서명 테스트</h2>
                            <button
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                onClick={() => setCurrentSection('home')}
                            >
                                닫기
                            </button>
                        </div>
                        
                        <div className="bg-black/20 p-4 rounded-lg mb-4">
                            <div className="text-sm mb-2">테스트 상태:</div>
                            <div className={`text-sm ${testResults.signature.success ? 'text-green-400' : 'text-gray-400'}`}>
                                {testResults.signature.details}
                            </div>
                        </div>
                        
                        <div className="mb-4 bg-white rounded-lg overflow-hidden">
                            <SignatureCanvas
                                ref={sigCanvas}
                                canvasProps={{
                                    width: 600,
                                    height: 200,
                                    className: 'signature-canvas w-full h-48'
                                }}
                                backgroundColor='rgba(255, 255, 255)'
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={clearSignature}
                                className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition-colors"
                            >
                                지우기
                            </button>
                            <button
                                onClick={saveSignature}
                                className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors"
                            >
                                서명 저장
                            </button>
                        </div>
                        
                        {signatureData && (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium mb-2">저장된 서명:</h3>
                                <div className="p-4 bg-black/10 rounded-lg">
                                    <img 
                                        src={signatureData} 
                                        alt="Saved signature" 
                                        className="max-w-full h-auto bg-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : currentSection === 'phone-test' ? (
                    <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">전화 기능 테스트</h2>
                            <button
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                onClick={() => setCurrentSection('home')}
                            >
                                닫기
                            </button>
                        </div>
                        
                        <div className="bg-black/20 p-4 rounded-lg mb-4">
                            <div className="text-sm mb-2">테스트 상태:</div>
                            <div className={`text-sm ${testResults.phone.success ? 'text-green-400' : 'text-gray-400'}`}>
                                {testResults.phone.details}
                            </div>
                        </div>
                        
                        <div className="text-center py-8">
                            <div className="inline-block p-6 bg-black/20 rounded-full mb-6">
                                <Phone className="w-12 h-12 text-yellow-400" />
                            </div>
                            <h3 className="text-xl font-medium mb-4">전화 앱 연결 테스트</h3>
                            <p className="text-gray-300 mb-8 max-w-md mx-auto">
                                '전화 걸기' 버튼을 클릭하면 기기의 전화 앱이 열리고 테스트 번호로 연결을 시도합니다.
                                테스트 후 결과를 확인합니다.
                            </p>
                            
                            <button
                                onClick={makePhoneCall}
                                className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg text-lg transition-colors inline-flex items-center gap-2"
                            >
                                <Phone className="w-5 h-5" />
                                전화 걸기 (01012345678)
                            </button>
                        </div>
                    </div>
                ) : currentSection === 'file-io-test' ? (
                    <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">파일 I/O 테스트</h2>
                            <button
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                onClick={() => setCurrentSection('home')}
                            >
                                닫기
                            </button>
                        </div>
                        
                        <div className="bg-black/20 p-4 rounded-lg mb-4">
                            <div className="text-sm mb-2">테스트 상태:</div>
                            <div className={`text-sm ${testResults.fileIO.success ? 'text-green-400' : 'text-gray-400'}`}>
                                {testResults.fileIO.details}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 파일 업로드 테스트 */}
                            <div className="bg-black/20 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-4">파일 업로드 테스트</h3>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition-colors mb-4"
                                >
                                    파일 선택
                                </button>
                                {imageFile && (
                                    <div className="mt-4">
                                        <div className="text-sm font-medium mb-1">업로드된 파일:</div>
                                        <div className="bg-black/30 p-2 rounded text-xs">
                                            <div>이름: {imageFile.name}</div>
                                            <div>크기: {(imageFile.size / 1024).toFixed(2)} KB</div>
                                            <div>타입: {imageFile.type}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* 파일 다운로드 테스트 */}
                            <div className="bg-black/20 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-4">파일 다운로드 테스트</h3>
                                <button
                                    onClick={downloadTestFile}
                                    className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors"
                                >
                                    테스트 파일 다운로드
                                </button>
                                <div className="mt-4 text-sm text-gray-300">
                                    간단한 텍스트 파일이 기기에 다운로드됩니다.
                                    기기 및 브라우저 설정에 따라 다운로드 방식이 달라질 수 있습니다.
                                </div>
                            </div>
                        </div>
                    </div>
                ) : currentSection === 'location-test' ? (
                    <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">위치정보 테스트</h2>
                            <button
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                onClick={() => setCurrentSection('home')}
                            >
                                닫기
                            </button>
                        </div>
                        
                        <div className="bg-black/20 p-4 rounded-lg mb-4">
                            <div className="text-sm mb-2">테스트 상태:</div>
                            <div className={`text-sm ${testResults.location.success ? 'text-green-400' : 'text-red-400'}`}>
                                {testResults.location.details}
                            </div>
                        </div>
                        
                        <div className="text-center py-6">
                            <div className="inline-block p-6 bg-black/20 rounded-full mb-6">
                                <MapPin className="w-12 h-12 text-pink-400" />
                            </div>
                            
                            {!userLocation && !locationError && (
                                <>
                                    <h3 className="text-xl font-medium mb-4">위치정보 권한 요청</h3>
                                    <p className="text-gray-300 mb-6 max-w-md mx-auto">
                                        '위치 가져오기' 버튼을 클릭하면 브라우저에서 위치정보 접근 권한을 요청합니다.
                                        권한을 허용하면 현재 위치 정보를 표시합니다.
                                    </p>
                                    <button
                                        onClick={handleLocationTest}
                                        className="bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-lg transition-colors"
                                    >
                                        위치 정보 가져오기
                                    </button>
                                </>
                            )}
                            
                            {userLocation && (
                                <div className="bg-black/20 p-4 rounded-lg text-left">
                                    <h3 className="text-lg font-medium mb-3">현재 위치:</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="grid grid-cols-3">
                                            <dt className="text-gray-400">위도:</dt>
                                            <dd className="col-span-2">{userLocation.latitude.toFixed(6)}</dd>
                                        </div>
                                        <div className="grid grid-cols-3">
                                            <dt className="text-gray-400">경도:</dt>
                                            <dd className="col-span-2">{userLocation.longitude.toFixed(6)}</dd>
                                        </div>
                                        <div className="grid grid-cols-3">
                                            <dt className="text-gray-400">정확도:</dt>
                                            <dd className="col-span-2">{userLocation.accuracy.toFixed(1)} 미터</dd>
                                        </div>
                                        <div className="grid grid-cols-3">
                                            <dt className="text-gray-400">타임스탬프:</dt>
                                            <dd className="col-span-2">{new Date(userLocation.timestamp).toLocaleString()}</dd>
                                        </div>
                                    </dl>
                                    
                                    <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded">
                                        <p className="text-green-300 text-sm">
                                            위치 정보를 성공적으로 가져왔습니다. 위치 정보 API가 정상 작동합니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {locationError && (
                                <div className="bg-red-900/20 p-4 border border-red-800 rounded-lg">
                                    <h3 className="text-lg font-medium mb-2 text-red-300">오류 발생</h3>
                                    <p className="text-sm mb-4">{locationError}</p>
                                    <button
                                        onClick={handleLocationTest}
                                        className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded transition-colors"
                                    >
                                        다시 시도
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : currentSection === 'photo-test' ? (
                    <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">사진 접근 테스트</h2>
                            <button
                                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                onClick={() => setCurrentSection('home')}
                            >
                                닫기
                            </button>
                        </div>
                        
                        <div className="bg-black/20 p-4 rounded-lg mb-4">
                            <div className="text-sm mb-2">테스트 상태:</div>
                            <div className={`text-sm ${testResults.photo.success ? 'text-green-400' : 'text-gray-400'}`}>
                                {testResults.photo.details}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-black/20 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-4">사진 접근 테스트</h3>
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={photoInputRef}
                                    onChange={handlePhotoSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={openPhotoPicker}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-lg transition-colors"
                                >
                                    갤러리에서 사진 선택
                                </button>
                            </div>
                            
                            <div className="bg-black/20 p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-4">카메라 직접 열기</h3>
                                <button
                                    onClick={openCamera}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-lg transition-colors"
                                >
                                    카메라 열기 (모바일 전용)
                                </button>
                                <p className="text-xs text-gray-400 mt-2">
                                    * 모바일 기기에서만 카메라가 직접 열릴 수 있습니다.
                                    일부 브라우저에서는 지원되지 않을 수 있습니다.
                                </p>
                            </div>
                        </div>
                        
                        {imagePreview && (
                            <div className="mt-6">
                                <h3 className="text-lg font-medium mb-2">선택된 이미지:</h3>
                                <div className="rounded-lg overflow-hidden bg-black/10 p-2">
                                    <img 
                                        src={imagePreview} 
                                        alt="Selected from gallery" 
                                        className="w-full h-auto max-h-80 object-contain rounded"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <></>
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowFeatureHighlight(false)}
                >
                    <div className="bg-black/30 backdrop-blur max-w-md w-full rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-4">✨ PWA 테스트 목록</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span>PDF 렌더링 (@react-pdf/renderer)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span>전자서명 (react-signature-canvas)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                                <span>전화 (tel: 프로토콜)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                <span>파일 I/O (업로드/다운로드)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-pink-500 rounded-full" />
                                <span>위치정보 (Geolocation API)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                <span>사진 (갤러리/카메라 접근)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* 숨겨진 파일 입력 필드 */}
            <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />
            
            <input 
                type="file"
                accept="image/*"
                ref={photoInputRef}
                className="hidden"
                onChange={handlePhotoSelect}
            />
        </div>
    );
};

export default App;