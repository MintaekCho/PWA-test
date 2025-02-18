import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const QRScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied' | 'unsupported'>('pending');
    
    useEffect(() => {
        checkCameraSupport();
    }, []);

    const checkCameraSupport = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraPermission('unsupported');
            setError('이 브라우저는 카메라 접근을 지원하지 않습니다.');
            return;
        }

        try {
            // 현재 권한 상태 확인
            const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setCameraPermission(permissionStatus.state as 'granted' | 'denied' | 'pending');
            
            // 권한 상태 변경 감지
            permissionStatus.onchange = () => {
                setCameraPermission(permissionStatus.state as 'granted' | 'denied' | 'pending');
                
                if (permissionStatus.state === 'granted') {
                    setError('');
                    startCamera();
                } else if (permissionStatus.state === 'denied') {
                    setError('카메라 접근 권한이 거부되었습니다.');
                    stopCamera();
                }
            };

            // 권한이 허용되었으면 카메라 시작
            if (permissionStatus.state === 'granted') {
                startCamera();
            } else if (permissionStatus.state === 'denied') {
                startCamera(); // 권한 요청 트리거
            }
        } catch (err) {
            // permissions API를 지원하지 않는 브라우저의 경우
            startCamera(); // 직접 권한 요청 시도
        }
    };

    const startCamera = async () => {
        try {
            // 카메라 접근 권한 요청 (권한은 한번 받으면 브라우저에 저장)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setScanning(true);
                scanQRCode();
                setCameraPermission('granted');
                setError('');
            }
        } catch (err) {
            setCameraPermission('denied');
            setError('카메라 접근 권한이 필요합니다.');
            console.error('Camera error:', err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            setScanning(false);
        }
    };

    const scanQRCode = () => {
        if (!scanning) return;

        requestAnimationFrame(scanQRCode);

        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code) {
                    setResult(code.data);
                    setScanning(false);
                    stopCamera();
                }
            }
        }
    };

    const handleReset = () => {
        setResult('');
        setError('');
        
        if (cameraPermission === 'denied') {
            // 권한이 거부된 경우 브라우저 설정으로 안내
            setCameraPermission('pending');
            navigator.permissions.query({ name: 'camera' as PermissionName }).then(permissionStatus => {
                if (permissionStatus.state === 'denied') {
                    setError('브라우저 설정에서 카메라 접근 권한을 허용해주세요.');
                } else {
                    startCamera();
                }
            }).catch(() => {
                // permissions API를 지원하지 않는 브라우저의 경우
                startCamera();
            });
        } else {
            startCamera();
        }
    };

    // 카메라 권한 상태에 따른 UI 표시
    const renderPermissionStatus = () => {
        switch (cameraPermission) {
            case 'granted':
                return (
                    <div className="flex items-center gap-2 mb-2 bg-green-100 text-green-800 px-3 py-1 rounded-md">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">카메라 권한 허용됨</span>
                    </div>
                );
            case 'denied':
                return (
                    <div className="flex items-center gap-2 mb-2 bg-red-100 text-red-800 px-3 py-1 rounded-md">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">카메라 권한 거부됨</span>
                    </div>
                );
            case 'pending':
                return (
                    <div className="flex items-center gap-2 mb-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">카메라 권한 대기 중</span>
                    </div>
                );
            case 'unsupported':
                return (
                    <div className="flex items-center gap-2 mb-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-md">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="text-sm">카메라 지원 안됨</span>
                    </div>
                );
        }
    };

    return (
        <div className="relative max-w-md mx-auto">
            {/* 카메라 권한 상태 표시 */}
            {renderPermissionStatus()}
            
            {error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                    {cameraPermission === 'denied' ? (
                        <div>
                            <p className="mt-2 text-sm">다음 방법으로 권한을 변경할 수 있습니다:</p>
                            <ul className="list-disc ml-5 mt-1 text-sm">
                                <li>주소창 왼쪽의 자물쇠/정보 아이콘 클릭</li>
                                <li>"카메라" 항목을 "허용"으로 변경</li>
                                <li>페이지를 새로고침하세요</li>
                            </ul>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                            >
                                페이지 새로고침
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleReset}
                            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                        >
                            다시 시도
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    {!result ? (
                        <div className="relative">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg" />
                            <div className="absolute inset-0 border-2 border-white/50 rounded-lg pointer-events-none">
                                <div className="absolute inset-0 border-2 border-white/50 animate-pulse"></div>
                            </div>
                            <canvas ref={canvasRef} className="hidden" />
                            <p className="mt-2 text-center text-gray-200">QR 코드를 카메라에 비춰주세요</p>
                        </div>
                    ) : (
                        <div className="bg-black/30 backdrop-blur p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">스캔 결과:</h3>
                            <p className="break-all mb-4">{result}</p>
                            <button
                                onClick={handleReset}
                                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                다시 스캔하기
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QRScanner;