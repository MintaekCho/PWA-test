// src/components/tests/PhotoTest/index.tsx
import React, { useState } from 'react';
import { Image, Camera } from 'lucide-react';
import { TestComponentProps } from '../../../types';

interface PhotoTestProps extends TestComponentProps {
    photoInputRef: React.RefObject<HTMLInputElement>;
}

const PhotoTest: React.FC<PhotoTestProps> = ({ onClose, testResult, updateTestResult, photoInputRef }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageInfo, setImageInfo] = useState<{
        name: string;
        size: number;
        type: string;
        width?: number;
        height?: number;
    } | null>(null);

    const openPhotoPicker = (): void => {
        if (photoInputRef.current) {
            // capture 속성 제거 (갤러리 접근용)
            photoInputRef.current.removeAttribute('capture');
            photoInputRef.current.click();
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 선택해주세요');
            updateTestResult({
                tested: true,
                success: false,
                details: '잘못된 파일 형식',
            });
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target && event.target.result) {
                    const dataUrl = event.target.result as string;
                    setImagePreview(dataUrl);

                    // 이미지 정보 저장
                    setImageInfo({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                    });

                    // 이미지 크기 확인을 위한 Image 객체 생성
                    const img = document.createElement('img');
                    img.onload = () => {
                        setImageInfo((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      width: img.width,
                                      height: img.height,
                                  }
                                : null
                        );
                    };
                    img.src = dataUrl;

                    updateTestResult({
                        tested: true,
                        success: true,
                        details: `이미지 로드 성공: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
                    });
                }
            };
            reader.onerror = (error) => {
                updateTestResult({
                    tested: true,
                    success: false,
                    details: `이미지 읽기 실패: ${error}`,
                });
            };
            reader.readAsDataURL(file);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            updateTestResult({
                tested: true,
                success: false,
                details: `이미지 처리 중 오류: ${errorMessage}`,
            });
        }
    };

    // 카메라 직접 열기 테스트
    const openCamera = (): void => {
        if (photoInputRef.current) {
            try {
                // capture 속성 사용 (카메라 직접 열기)
                photoInputRef.current.setAttribute('capture', 'environment');
                photoInputRef.current.click();

                updateTestResult({
                    ...testResult,
                    details: `${testResult.details || ''} | 카메라 열기 요청됨`,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                updateTestResult({
                    tested: true,
                    success: false,
                    details: `카메라 열기 실패: ${errorMessage}`,
                });
            }
        }
    };

    // 카메라/갤러리 지원 체크
    const isCameraSupported = (): boolean => {
        return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    };

    return (
        <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">사진 접근 테스트</h2>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">사진 접근 테스트</h3>
                    <button
                        onClick={openPhotoPicker}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-lg transition-colors"
                    >
                        갤러리에서 사진 선택
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                        기기의 사진 라이브러리에 접근합니다. 권한 요청 팝업이 표시될 수 있습니다.
                    </p>
                </div>

                <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-4">카메라 직접 열기</h3>
                    <button
                        onClick={openCamera}
                        className={`w-full ${
                            isCameraSupported() ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-600 cursor-not-allowed'
                        } px-4 py-3 rounded-lg transition-colors`}
                        disabled={!isCameraSupported()}
                    >
                        카메라 열기 (모바일 전용)
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                        {isCameraSupported()
                            ? '* 모바일 기기에서만 카메라가 직접 열릴 수 있습니다. 일부 브라우저에서는 지원되지 않을 수 있습니다.'
                            : '* 이 기기 또는 브라우저에서는 카메라 API가 지원되지 않습니다.'}
                    </p>
                </div>
            </div>

            {imagePreview && (
                <div className="bg-black/20 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-2">선택된 이미지:</h3>
                    <div className="rounded-lg overflow-hidden bg-black/10 p-2">
                        <img
                            src={imagePreview}
                            alt="Selected from gallery"
                            className="w-full h-auto max-h-80 object-contain rounded"
                        />
                    </div>

                    {imageInfo && (
                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div>파일명:</div>
                            <div className="text-gray-300">{imageInfo.name}</div>

                            <div>크기:</div>
                            <div className="text-gray-300">{(imageInfo.size / 1024).toFixed(2)} KB</div>

                            <div>타입:</div>
                            <div className="text-gray-300">{imageInfo.type}</div>

                            {imageInfo.width && imageInfo.height && (
                                <>
                                    <div>해상도:</div>
                                    <div className="text-gray-300">
                                        {imageInfo.width} x {imageInfo.height}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="bg-black/20 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">지원 상태</h3>
                <dl className="grid grid-cols-2 gap-y-2 text-sm">
                    <dt>입력 API:</dt>
                    <dd className="text-green-400">지원됨</dd>

                    <dt>MediaDevices API:</dt>
                    <dd className={isCameraSupported() ? 'text-green-400' : 'text-red-400'}>
                        {isCameraSupported() ? '지원됨' : '지원되지 않음'}
                    </dd>

                    <dt>파일 접근:</dt>
                    <dd className="text-green-400">지원됨</dd>

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

export default PhotoTest;
