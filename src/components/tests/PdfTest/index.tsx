// src/components/tests/PdfTest/index.tsx
import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { TestComponentProps } from '../../../types';

// PDF.js 워커 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfTest: React.FC<TestComponentProps> = ({ onClose, testResult, updateTestResult }) => {
    const [pdfFile, setPdfFile] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(1);

    // PDF 테스트 시작
    const startPdfTest = () => {
        // 샘플 PDF URL 또는 데이터 URL
        const samplePdfUrl = '/sample-pdf.pdf';

        try {
            setPdfFile(samplePdfUrl);
            updateTestResult({
                tested: true,
                success: false,
                details: 'PDF 로드 중...',
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            updateTestResult({
                tested: true,
                success: false,
                details: `PDF 초기화 실패: ${errorMessage}`,
            });
        }
    };

    // PDF 로드 성공 핸들러
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
        updateTestResult({
            tested: true,
            success: true,
            details: `PDF 로드 성공: ${numPages}페이지`,
        });
    };

    return (
        <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">PDF 렌더링 테스트 (react-pdf)</h2>
                <button
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
                    onClick={onClose}
                >
                    닫기
                </button>
            </div>

            {/* 상태 표시 부분 */}
            <div className="bg-black/20 p-4 rounded-lg mb-4">
                <div className="text-sm mb-2">테스트 상태:</div>
                <div className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.details}
                </div>
            </div>

            {/* 테스트 정보 및 컨트롤 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* ... 정보 표시 영역 ... */}
                <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">테스트 옵션</h3>
                    <div className="space-y-4">
                        <button
                            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors"
                            onClick={startPdfTest}
                        >
                            PDF 렌더링 테스트
                        </button>
                        <div className="text-sm text-gray-300">
                            이 테스트는 React-PDF를 사용하여 PDF를 표시하는 기능을 테스트합니다. 모바일 기기에서도
                            호환성이 향상되었습니다.
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF 뷰어 영역 */}
            {pdfFile && (
                <div className="mt-6 bg-white rounded-lg overflow-hidden p-2">
                    <Document
                        file={pdfFile}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={(error) => {
                            updateTestResult({
                                tested: true,
                                success: false,
                                details: `PDF 로드 실패: ${error.message}`,
                            });
                        }}
                        options={{
                            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
                            cMapPacked: true,
                            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/',
                        }}
                    >
                        {/* ... 페이지 표시 및 컨트롤 ... */}
                    </Document>
                </div>
            )}

            {/* 안내 메시지 */}
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
                <p className="text-blue-300">PDF가 제대로 표시되면 테스트에 성공한 것입니다.</p>
            </div>
        </div>
    );
};

export default PdfTest;
