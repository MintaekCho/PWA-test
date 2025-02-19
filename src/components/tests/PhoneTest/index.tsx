// src/components/tests/PhoneTest/index.tsx
import React, { useEffect } from 'react';
import { Phone } from 'lucide-react';
import { TestComponentProps } from '../../../types';

const PhoneTest: React.FC<TestComponentProps> = ({ onClose, testResult, updateTestResult }) => {
    // 컴포넌트 마운트 시 지원 여부 확인
    useEffect(() => {
        checkPhoneSupport();
    }, []);

    const checkPhoneSupport = (): void => {
        const phoneNumber = '01012345678'; // 테스트용 번호

        try {
            // tel: 프로토콜 지원 테스트
            const telLink = document.createElement('a');
            telLink.href = `tel:${phoneNumber}`;
            telLink.textContent = '전화 걸기';

            // 지원 여부 확인 (간접적으로)
            const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);

            updateTestResult({
                tested: true,
                success: isMobile,
                details: isMobile
                    ? '전화 기능이 지원됩니다. 테스트하려면 아래 버튼을 클릭하세요.'
                    : '현재 기기에서는 전화 기능이 지원되지 않을 수 있습니다 (데스크톱 환경)',
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            updateTestResult({
                tested: true,
                success: false,
                details: `전화 기능 테스트 중 오류: ${errorMessage}`,
            });
        }
    };

    const makePhoneCall = (): void => {
        try {
            window.location.href = 'tel:01012345678';
            // 성공 여부는 사용자 확인 필요
            setTimeout(() => {
                const confirmed = window.confirm('전화 앱이 열렸나요?');
                updateTestResult({
                    tested: true,
                    success: confirmed,
                    details: confirmed
                        ? '전화 기능 테스트 성공'
                        : '전화 기능 테스트 실패 - 전화 앱이 열리지 않았습니다',
                });
            }, 1000);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            updateTestResult({
                tested: true,
                success: false,
                details: `전화 걸기 실패: ${errorMessage}`,
            });
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">전화 기능 테스트</h2>
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

            <div className="text-center py-8">
                <div className="inline-block p-6 bg-black/20 rounded-full mb-6">
                    <Phone className="w-12 h-12 text-yellow-400" />
                </div>
                <h3 className="text-xl font-medium mb-4">전화 앱 연결 테스트</h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                    '전화 걸기' 버튼을 클릭하면 기기의 전화 앱이 열리고 테스트 번호로 연결을 시도합니다. 테스트 후
                    결과를 확인합니다.
                </p>

                <button
                    onClick={makePhoneCall}
                    className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg text-lg transition-colors inline-flex items-center gap-2"
                >
                    <Phone className="w-5 h-5" />
                    전화 걸기 (01012345678)
                </button>
            </div>

            <div className="mt-6 p-4 bg-black/20 rounded-lg">
                <h3 className="text-lg font-medium mb-2">기기 정보</h3>
                <div className="text-sm text-gray-300 break-words">{navigator.userAgent}</div>
                <div className="mt-3 text-sm">
                    <span className="font-medium text-gray-300">PWA 상태: </span>
                    <span
                        className={
                            window.matchMedia('(display-mode: standalone)').matches
                                ? 'text-green-400'
                                : 'text-yellow-400'
                        }
                    >
                        {window.matchMedia('(display-mode: standalone)').matches
                            ? 'PWA 모드로 실행 중'
                            : '브라우저에서 실행 중'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PhoneTest;
