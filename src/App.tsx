// src/App.tsx
import React, { useState, useRef } from 'react';
import { Camera, Bell, Wifi, WifiOff, Award, FileText, Pen, Phone, Upload, MapPin, Image } from 'lucide-react';
import { TestProvider, useTestContext } from './context/TestContext';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useNotification } from './hooks/useNotification';

// 공통 컴포넌트들
import StatusBar from './components/common/StatusBar';
import TestCard from './components/common/TestCard';
import TestSummary from './components/common/TestSummary';
import FeatureModal from './components/common/FeatureModal';

// 테스트 컴포넌트들
import QRScanner from './components/QRScanner';
import PdfTest from './components/tests/PdfTest';
import SignatureTest from './components/tests/SignatureTest';
import PhoneTest from './components/tests/PhoneTest';
import FileIOTest from './components/tests/FileIOTest';
import LocationTest from './components/tests/LocationTest';
import PhotoTest from './components/tests/PhotoTest';

// 앱 버전 정보
const APP_VERSION = '1.0.8';

const AppContent: React.FC = () => {
    const [currentSection, setCurrentSection] = useState<string>('home');
    const [showFeatureHighlight, setShowFeatureHighlight] = useState<boolean>(false);
    const isOnline = useOnlineStatus();
    const { notificationStatus, notificationSupported, deviceToken, requestNotification } = useNotification();

    const { testResults, updateTestResult } = useTestContext();

    // 파일 입력 ref
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 text-white p-4">
            {/* 상태바 */}
            <StatusBar
                isOnline={isOnline}
                appVersion={APP_VERSION}
                notificationSupported={notificationSupported}
                notificationStatus={notificationStatus}
                deviceToken={deviceToken}
            />

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* QR Scanner Card */}
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

                            {/* Notification Card */}
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

                        {/* 테스트 기능 카드들 */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold mb-4 border-b border-purple-500 pb-2">
                                PWA 기능 테스트
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <TestCard
                                    title="PDF 렌더링"
                                    icon={FileText}
                                    iconBgColor="bg-blue-600"
                                    testResult={testResults.pdf}
                                    onClick={() => setCurrentSection('pdf-test')}
                                />
                                <TestCard
                                    title="전자서명"
                                    icon={Pen}
                                    iconBgColor="bg-green-600"
                                    testResult={testResults.signature}
                                    onClick={() => setCurrentSection('signature-test')}
                                />
                                <TestCard
                                    title="전화 기능"
                                    icon={Phone}
                                    iconBgColor="bg-yellow-600"
                                    testResult={testResults.phone}
                                    onClick={() => setCurrentSection('phone-test')}
                                />
                                <TestCard
                                    title="파일 I/O"
                                    icon={Upload}
                                    iconBgColor="bg-purple-600"
                                    testResult={testResults.fileIO}
                                    onClick={() => setCurrentSection('file-io-test')}
                                />
                                <TestCard
                                    title="위치정보"
                                    icon={MapPin}
                                    iconBgColor="bg-pink-600"
                                    testResult={testResults.location}
                                    onClick={() => setCurrentSection('location-test')}
                                />
                                <TestCard
                                    title="사진 접근"
                                    icon={Image}
                                    iconBgColor="bg-indigo-600"
                                    testResult={testResults.photo}
                                    onClick={() => setCurrentSection('photo-test')}
                                />
                            </div>
                        </div>

                        {/* 테스트 요약 */}
                        <TestSummary />
                    </>
                ) : currentSection === 'camera' ? (
                    <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden">
                        <div className="p-6">
                            <div className="relative">
                                <button
                                    className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                                    onClick={() => setCurrentSection('home')}
                                >
                                    닫기
                                </button>
                                <QRScanner />
                            </div>
                        </div>
                    </div>
                ) : currentSection === 'pdf-test' ? (
                    <PdfTest
                        onClose={() => setCurrentSection('home')}
                        testResult={testResults.pdf}
                        updateTestResult={(result) => updateTestResult('pdf', result)}
                    />
                ) : currentSection === 'signature-test' ? (
                    <SignatureTest
                        onClose={() => setCurrentSection('home')}
                        testResult={testResults.signature}
                        updateTestResult={(result) => updateTestResult('signature', result)}
                    />
                ) : currentSection === 'phone-test' ? (
                    <PhoneTest
                        onClose={() => setCurrentSection('home')}
                        testResult={testResults.phone}
                        updateTestResult={(result) => updateTestResult('phone', result)}
                    />
                ) : currentSection === 'file-io-test' ? (
                    <FileIOTest
                        onClose={() => setCurrentSection('home')}
                        testResult={testResults.fileIO}
                        updateTestResult={(result) => updateTestResult('fileIO', result)}
                        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                    />
                ) : currentSection === 'location-test' ? (
                    <LocationTest
                        onClose={() => setCurrentSection('home')}
                        testResult={testResults.location}
                        updateTestResult={(result) => updateTestResult('location', result)}
                    />
                ) : currentSection === 'photo-test' ? (
                    <PhotoTest
                        onClose={() => setCurrentSection('home')}
                        testResult={testResults.photo}
                        updateTestResult={(result) => updateTestResult('photo', result)}
                        photoInputRef={photoInputRef as React.RefObject<HTMLInputElement>}
                    />
                ) : null}
            </div>

            {/* 플로팅 버튼 */}
            <button
                className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center hover:scale-110 transition-transform"
                onClick={() => setShowFeatureHighlight(!showFeatureHighlight)}
            >
                <Award className="w-6 h-6" />
            </button>

            {/* 기능 하이라이트 모달 */}
            {showFeatureHighlight && <FeatureModal onClose={() => setShowFeatureHighlight(false)} />}

            {/* 숨겨진 파일 입력 필드들 */}
            <input type="file" ref={fileInputRef} className="hidden" />

            <input type="file" accept="image/*" ref={photoInputRef} className="hidden" />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <TestProvider>
            <AppContent />
        </TestProvider>
    );
};

export default App;
