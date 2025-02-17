import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

const QRScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setScanning(true);
                scanQRCode();
            }
        } catch (err) {
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

    return (
        <div className="relative max-w-md mx-auto">
            {error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <p>{error}</p>
                    <button
                        onClick={handleReset}
                        className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
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
