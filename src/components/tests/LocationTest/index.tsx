// src/components/tests/LocationTest/index.tsx
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { TestComponentProps, UserLocation } from '../../../types';

const LocationTest: React.FC<TestComponentProps> = ({ onClose, testResult, updateTestResult }) => {
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const handleLocationTest = (): void => {
        updateTestResult({
            tested: true,
            success: false,
            details: '위치 정보 요청 중...',
        });

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                // 성공 콜백
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    setUserLocation({
                        latitude,
                        longitude,
                        accuracy,
                        timestamp: position.timestamp,
                    });
                    updateTestResult({
                        tested: true,
                        success: true,
                        details: `위치: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (정확도: ${accuracy.toFixed(
                            1
                        )}m)`,
                    });
                },
                // 에러 콜백
                (error) => {
                    let errorMsg = '';
                    switch (error.code) {
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
                    updateTestResult({
                        tested: true,
                        success: false,
                        details: errorMsg,
                    });
                },
                // 옵션
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } else {
            const errorMsg = '이 브라우저는 위치 정보를 지원하지 않습니다';
            setLocationError(errorMsg);
            updateTestResult({
                tested: true,
                success: false,
                details: errorMsg,
            });
        }
    };

    // 위치를 지도에 표시하는 함수
    const getMapLink = (lat: number, lng: number): string => {
        return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
    };

    return (
        <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">위치정보 테스트</h2>
                <button
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>

            <div className="bg-black/20 p-4 rounded-lg mb-4">
                <div className="text-sm mb-2">테스트 상태:</div>
                <div className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.details}
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
                            '위치 가져오기' 버튼을 클릭하면 브라우저에서 위치정보 접근 권한을 요청합니다. 권한을
                            허용하면 현재 위치 정보를 표시합니다.
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

                        <div className="mt-4 flex justify-center">
                            <a
                                href={getMapLink(userLocation.latitude, userLocation.longitude)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                <MapPin className="w-4 h-4 mr-2" />
                                지도에서 보기
                            </a>
                        </div>

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

            <div className="mt-6 p-4 bg-black/20 rounded-lg">
                <h3 className="text-lg font-medium mb-2">위치 정보 지원 상태</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt>Geolocation API:</dt>
                    <dd className={'geolocation' in navigator ? 'text-green-400' : 'text-red-400'}>
                        {'geolocation' in navigator ? '지원됨' : '지원되지 않음'}
                    </dd>
                    <dt>고정밀도:</dt>
                    <dd className="text-green-400">지원됨</dd>
                    <dt>사용자 권한:</dt>
                    <dd
                        className={userLocation ? 'text-green-400' : locationError ? 'text-red-400' : 'text-yellow-400'}
                    >
                        {userLocation ? '허용됨' : locationError ? '거부됨/오류' : '요청되지 않음'}
                    </dd>
                    <dt>PWA 모드:</dt>
                    <dd
                        className={
                            window.matchMedia('(display-mode: standalone)').matches
                                ? 'text-green-400'
                                : 'text-yellow-400'
                        }
                    >
                        {window.matchMedia('(display-mode: standalone)').matches ? '활성화됨' : '비활성화됨'}
                    </dd>
                </dl>
            </div>
        </div>
    );
};

export default LocationTest;
