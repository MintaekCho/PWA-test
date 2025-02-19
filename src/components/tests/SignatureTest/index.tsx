// src/components/tests/SignatureTest/index.tsx
import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { TestComponentProps } from '../../../types';

const SignatureTest: React.FC<TestComponentProps> = ({ onClose, testResult, updateTestResult }) => {
    const [signatureData, setSignatureData] = useState<string>('');
    const sigCanvas = useRef<SignatureCanvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // 캔버스 크기를 컨테이너에 맞게 조정하는 함수
    const resizeCanvas = () => {
        if (containerRef.current && sigCanvas.current) {
            const container = containerRef.current;
            const canvas = sigCanvas.current as any;

            // 현재 컨테이너의 크기 가져오기
            const { width, height } = container.getBoundingClientRect();

            // 캔버스 크기 설정
            setCanvasSize({ width, height: 200 });

            // 캔버스 비율 조정
            if (canvas._canvas) {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas._canvas.width = width * ratio;
                canvas._canvas.height = 200 * ratio;
                canvas._canvas.style.width = `${width}px`;
                canvas._canvas.style.height = `200px`;

                // 이전 서명이 있었다면 지우고 다시 그리기
                if (signatureData && !canvas.isEmpty()) {
                    canvas.clear();
                }
            }
        }
    };

    // 컴포넌트 마운트 시와 윈도우 크기 변경 시 캔버스 크기 조정
    useEffect(() => {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    const clearSignature = (): void => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            setSignatureData('');
            updateTestResult({
                tested: true,
                success: false,
                details: '서명이 지워졌습니다',
            });
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
        updateTestResult({
            tested: true,
            success: true,
            details: `서명 저장 성공: ${new Date().toLocaleString()}`,
        });

        // 서명 다운로드 옵션 제공
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = `signature-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    };

    return (
        <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">전자서명 테스트</h2>
                <button
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>

            <div className="bg-black/20 p-4 rounded-lg mb-4">
                <div className="text-sm mb-2">테스트 상태:</div>
                <div className={`text-sm ${testResult.success ? 'text-green-400' : 'text-gray-400'}`}>
                    {testResult.details}
                </div>
            </div>

            <div className="mb-4 bg-white rounded-lg overflow-hidden" ref={containerRef}>
                <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                        width: canvasSize.width,
                        height: canvasSize.height,
                        className: 'signature-canvas',
                    }}
                    backgroundColor="rgba(255, 255, 255)"
                    onBegin={() => {
                        updateTestResult({
                            tested: true,
                            success: false,
                            details: '서명 진행 중...',
                        });
                    }}
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
                        <img src={signatureData} alt="Saved signature" className="max-w-full h-auto bg-white" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignatureTest;
