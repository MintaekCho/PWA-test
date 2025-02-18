import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const QRScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            // 카메라 접근 권한 요청 (권한은 한번 받으면 브라우저에 저장)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
            });

            console.log(stream)

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
        startCamera();
    };

    // 카메라 권한 표시 배지
    const renderPermissionBadge = () => {
        switch (cameraPermission) {
            case 'granted':
                return (
                    <div className="flex items-center mb-4 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span>카메라 권한: 허용됨</span>
                    </div>
                );
            case 'denied':
                return (
                    <div className="flex items-center mb-4 bg-red-100 text-red-800 px-3 py-2 rounded-lg">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span>카메라 권한: 거부됨</span>
                    </div>
                );
            case 'pending':
                return (
                    <div className="flex items-center mb-4 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
                        <div className="w-3 h-3 bg-yellow-500 animate-pulse rounded-full mr-2"></div>
                        <span>카메라 권한: 요청 중...</span>
                    </div>
                );
        }
    };

    return (
        <div className="relative max-w-md mx-auto">
            {/* 카메라 권한 상태 표시 */}
            {renderPermissionBadge()}

            {error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                    {cameraPermission === 'denied' && (
                        <div className="mt-2 text-sm">
                            <p>카메라 권한이 차단되었습니다. 권한을 다시 허용하려면:</p>
                            <ol className="list-decimal ml-5 mt-2 space-y-1">
                                <li>브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하세요</li>
                                <li>사이트 설정에서 '카메라'를 찾으세요</li>
                                <li>'허용'으로 변경하세요</li>
                                <li>페이지를 새로고침하세요</li>
                            </ol>
                        </div>
                    )}
                    <button
                        onClick={handleReset}
                        className="mt-3 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                        다시 시도
                    </button>
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
