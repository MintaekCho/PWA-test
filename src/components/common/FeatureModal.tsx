import React from 'react';
import { Award } from 'lucide-react';

interface FeatureModalProps {
    onClose: () => void;
}

const FeatureModal: React.FC<FeatureModalProps> = ({ onClose }) => {
    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-black/30 backdrop-blur max-w-md w-full rounded-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center mb-4">
                    <Award className="w-6 h-6 text-yellow-400 mr-2" />
                    <h3 className="text-xl font-bold">✨ PWA 테스트 목록</h3>
                </div>

                <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>PDF 렌더링 (react-pdf)</span>
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

                <div className="mt-6 bg-black/20 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">PWA 정보</h4>
                    <div className="text-sm text-gray-300">
                        <p>이 앱은 Progressive Web App으로 설치하여 사용할 수 있습니다.</p>
                        <p className="mt-2">
                            PWA 모드:{' '}
                            {window.matchMedia('(display-mode: standalone)').matches
                                ? '활성화됨'
                                : '브라우저에서 실행 중'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg transition-colors"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};

export default FeatureModal;
