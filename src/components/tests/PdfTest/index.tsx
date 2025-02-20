import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { pdf } from '@react-pdf/renderer';
import { Document as PDFDocument, Page as PDFPage, View, Text, StyleSheet, Font, PDFViewer } from '@react-pdf/renderer';
import { TestComponentProps } from '../../../types';
import 'pdfjs-dist/web/pdf_viewer.css';

// PDF.js 워커 설정 - 로컬 워커 사용
// pdf 파일을 파싱하고 렌더링하는 계산적으로 무거운 작업이기 때문에 웹 워커를 사용하여 백그라운드 스레드에서 동작할 수 있도록 함
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

// 한글 폰트 등록 (PWA에서 로컬 폰트 경로 필요)
Font.register({
    family: 'Pretendard Variable',
    src: '/fonts/PretendardVariable.ttf',
});

// PDF 스타일 정의
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: 30,
        fontFamily: 'Pretendard Variable',
    },
    header: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottom: '1px solid #888',
    },
    title: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#555',
    },
    content: {
        marginTop: 20,
        marginBottom: 20,
        fontSize: 12,
        lineHeight: 1.5,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        marginVertical: 20,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#bfbfbf',
    },
    tableRowHeader: {
        backgroundColor: '#f0f0f0',
    },
    tableCol: {
        borderRightWidth: 1,
        borderRightColor: '#bfbfbf',
        padding: 8,
    },
    tableColHeader: {
        fontWeight: 'bold',
    },
    tableCell: {
        fontSize: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        fontSize: 8,
        textAlign: 'right',
        color: '#555',
    },
});

// PDF 데이터 타입 정의
interface PdfData {
    title: string;
    subtitle?: string;
    content: string;
    table?: {
        headers: string[];
        rows: string[][];
    };
}

// PDF 템플릿 컴포넌트
const PDFTemplate = ({ data }: { data: PdfData }) => (
    <PDFDocument>
        <PDFPage size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>{data.title}</Text>
                {data.subtitle && <Text style={styles.subtitle}>{data.subtitle}</Text>}
            </View>

            <View style={styles.content}>
                <Text>{data.content}</Text>
            </View>

            {data.table && (
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableRowHeader]}>
                        {data.table.headers.map((header, i) => (
                            <View
                                style={[
                                    styles.tableCol,
                                    styles.tableColHeader,
                                    { width: `${100 / data.table!.headers.length}%` },
                                ]}
                                key={`header-${i}`}
                            >
                                <Text style={styles.tableCell}>{header}</Text>
                            </View>
                        ))}
                    </View>
                    {data.table.rows.map((row, i) => (
                        <View style={styles.tableRow} key={`row-${i}`}>
                            {row.map((cell, j) => (
                                <View
                                    style={[styles.tableCol, { width: `${100 / data.table!.headers.length}%` }]}
                                    key={`cell-${i}-${j}`}
                                >
                                    <Text style={styles.tableCell}>{cell}</Text>
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.footer}>
                <Text>생성일: {new Date().toLocaleDateString()}</Text>
            </View>
        </PDFPage>
    </PDFDocument>
);

// PDF.js 뷰어 컴포넌트 (react-pdf 사용으로 간소화)
const PdfJsViewer = ({ pdfUrl, onRenderSuccess }: { pdfUrl: string; onRenderSuccess: () => void }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState<number>(1); // pdf 스케일

    const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.0)); // 최대 2배
    const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5)); // 최소 0.5배

    const documentOptions = useMemo(
        () => ({
            cMapUrl: '/cmaps/',
            cMapPacked: true,
        }),
        [] // 의존성 배열이 비어 있으므로 컴포넌트 생애 동안 한 번만 생성
    );

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setError(null);
        onRenderSuccess();
    };

    const onDocumentLoadError = (err: Error) => {
        setError(`PDF 로드 오류: ${err.message}`);
    };

    useEffect(() => {
        const updateScale = () => {
            const containerWidth = window.innerWidth; // 컨테이너 너비 (90%로 여유 둠)
            const pdfWidth = 530; // A4 기준 너비 (포인트 단위)
            const newScale = containerWidth / pdfWidth; // 화면에 맞는 비율
            setScale(Math.min(newScale, 1.5)); // 최대 scale 1.5로 제한
        };

        updateScale(); // 초기 설정
        window.addEventListener('resize', updateScale); // 창 크기 변경 시 업데이트
        return () => window.removeEventListener('resize', updateScale); // 정리
    }, []);

    return (
        <div className="w-full h-full flex flex-col overflow-auto">
            <div className="flex justify-center space-x-4 mb-2">
                <button
                    onClick={zoomOut}
                    className="bg-gray-200 p-2 rounded"
                    disabled={scale <= 0.5}
                >
                    축소
                </button>
                <span>{(scale * 100).toFixed(0)}%</span>
                <button
                    onClick={zoomIn}
                    className="bg-gray-200 p-2 rounded"
                    disabled={scale >= 2.0}
                >
                    확대
                </button>
            </div>
            {error ? (
                <div className="flex items-center justify-center h-full bg-white bg-opacity-90">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
                        <p className="font-bold">렌더링 오류</p>
                        <p>{error}</p>
                    </div>
                </div>
            ) : (
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    options={documentOptions}
                >
                    {Array.from(new Array(numPages || 0), (el, index) => (
                        <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            scale={scale} // 동적 scale 적용
                        />
                    ))}
                </Document>
            )}
        </div>
    );
};

const PdfTest: React.FC<TestComponentProps> = ({ onClose, testResult, updateTestResult }) => {
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [pdfData] = useState<PdfData>({
        title: '테스트 리포트',
        subtitle: '모바일 PDF 렌더링 테스트',
        content:
            '이 문서는 모바일 브라우저에서 동적으로 생성된 PDF를 테스트하기 위해 만들어졌습니다. 여러가지 데이터를 포함할 수 있으며 모바일 환경에서 제대로 표시되는지 확인합니다.',
        table: {
            headers: ['항목', '결과', '비고'],
            rows: [
                ['테스트 1', '성공', '모든 기기에서 작동'],
                ['테스트 2', '성공', '일부 기기에서 지연 발생'],
                ['테스트 3', '실패', '구형 모바일 기기에서 문제 발생'],
                ['테스트 4', '성공', '최적화 필요'],
            ],
        },
    });
    const [isAndroid, setIsAndroid] = useState<boolean>(false);
    const [usePdfJs, setUsePdfJs] = useState<boolean>(false);

    // 기기 감지
    useEffect(() => {
        const isAndroidDevice = /Android/i.test(navigator.userAgent);
        setIsAndroid(isAndroidDevice);
        if (isAndroidDevice) {
            setUsePdfJs(true); // 안드로이드에서는 기본적으로 PDF.js 사용
        }
    }, []);

    // PDF 생성 함수 (Base64로 변환)
    const generatePdf = async () => {
        setLoading(true);

        try {
            const pdfDoc = <PDFTemplate data={pdfData} />;
            const asPdf = pdf();
            asPdf.updateContainer(pdfDoc);
            const blob = await asPdf.toBlob();
            setPdfBlob(blob);

            // Blob을 Base64로 변환
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl);
                }
                setPdfUrl(base64data); // Base64 URL로 설정
                updateTestResult({
                    tested: true,
                    success: true,
                    details: 'PDF 생성 완료. 렌더링 중...',
                });
                setLoading(false);
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            updateTestResult({
                tested: true,
                success: false,
                details: `PDF 생성 실패: ${errorMessage}`,
            });
            setLoading(false);
        }
    };

    // PDF 공유 함수
    const sharePdf = async () => {
        if (!pdfBlob) return;

        try {
            if (navigator.share && navigator.canShare) {
                const file = new File([pdfBlob], '테스트_리포트.pdf', { type: 'application/pdf' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: pdfData.title,
                    });
                    updateTestResult({
                        tested: true,
                        success: true,
                        details: 'PDF 공유 성공',
                    });
                } else {
                    downloadPdf();
                }
            } else {
                downloadPdf();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            updateTestResult({
                tested: true,
                success: false,
                details: `PDF 공유 실패: ${errorMessage}`,
            });
        }
    };

    // PDF 다운로드 함수
    const downloadPdf = () => {
        if (!pdfUrl) return;

        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = '테스트_리포트.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        updateTestResult({
            tested: true,
            success: true,
            details: 'PDF 다운로드 완료',
        });
    };

    // PdfJs 렌더링 성공 핸들러
    const handlePdfJsRenderSuccess = () => {
        setLoading(false);
        updateTestResult({
            tested: true,
            success: true,
            details: 'PDF.js로 렌더링 성공',
        });
    };

    // 인라인 미리보기 toggle
    const [useInlinePreview, setUseInlinePreview] = useState<boolean>(false);

    return (
        <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">모바일 PDF 생성 및 렌더링 테스트</h2>
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
                {isAndroid && (
                    <div className="mt-2 text-xs text-yellow-300">
                        안드로이드 기기가 감지되었습니다. PDF.js 렌더링을 사용합니다.
                    </div>
                )}
            </div>

            {/* 테스트 정보 및 컨트롤 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">PDF 생성 옵션</h3>
                    <div className="space-y-4">
                        <button
                            className={`w-full ${
                                loading ? 'bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'
                            } px-4 py-3 rounded-lg transition-colors flex justify-center items-center`}
                            onClick={generatePdf}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    처리 중...
                                </>
                            ) : (
                                'PDF 생성하기'
                            )}
                        </button>

                        <div className="flex items-center mt-4">
                            <input
                                type="checkbox"
                                id="useInlinePreview"
                                checked={useInlinePreview}
                                onChange={(e) => setUseInlinePreview(e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor="useInlinePreview" className="text-sm text-gray-300">
                                인라인 PDF 미리보기 사용 (@react-pdf/renderer)
                            </label>
                        </div>

                        {!useInlinePreview && (
                            <div className="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    id="usePdfJs"
                                    checked={usePdfJs}
                                    onChange={(e) => setUsePdfJs(e.target.checked)}
                                    className="mr-2"
                                    disabled={isAndroid}
                                />
                                <label htmlFor="usePdfJs" className="text-sm text-gray-300">
                                    PDF.js 렌더러 사용 (모바일 호환성 향상)
                                </label>
                            </div>
                        )}

                        <div className="text-sm text-gray-300">
                            @react-pdf/renderer로 PDF를 생성하며, 렌더링은 선택한 방식으로 진행됩니다.
                        </div>
                    </div>
                </div>

                <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">테스트 정보</h3>
                    <div className="space-y-2 text-sm">
                        <p>
                            <span className="font-medium text-gray-300">PDF 생성:</span> @react-pdf/renderer
                        </p>
                        <p>
                            <span className="font-medium text-gray-300">렌더링:</span>{' '}
                            {useInlinePreview ? '@react-pdf/renderer' : usePdfJs ? 'PDF.js 렌더러' : '브라우저 내장'}
                        </p>
                        <p>
                            <span className="font-medium text-gray-300">상태:</span>{' '}
                            {loading ? '처리 중' : pdfUrl ? '렌더링됨' : '대기 중'}
                        </p>
                    </div>
                </div>
            </div>

            {/* PDF 뷰어 영역 - PDF.js 사용 */}
            {pdfUrl && !useInlinePreview && (
                <div className="mt-6 bg-white rounded-lg overflow-hidden p-2">
                    <div className="relative w-full" style={{ height: '600px' }}>
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <PdfJsViewer pdfUrl={pdfUrl} onRenderSuccess={handlePdfJsRenderSuccess} />
                        )}
                    </div>
                </div>
            )}

            {/* PDF 뷰어 영역 - 일반 embed 사용 */}
            {/* {pdfUrl && !useInlinePreview && !usePdfJs && (
                <div className="mt-6 bg-white rounded-lg overflow-hidden p-2">
                    <div className="relative w-full" style={{ height: '600px' }}>
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <>
                                <embed src={pdfUrl} type="application/pdf" className="absolute inset-0 w-full h-full" />
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                    <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                                        브라우저 내장 PDF 뷰어로 표시됨
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )} */}

            {/* 인라인 PDF 뷰어 (@react-pdf/renderer) */}
            {useInlinePreview && pdfData && (
                <div className="mt-6 bg-white rounded-lg overflow-hidden" style={{ height: '600px' }}>
                    {loading ? (
                        <div className="flex justify-center items-center h-full bg-gray-100">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <PDFViewer width="100%" height="100%" className="border-none">
                            <PDFTemplate data={pdfData} />
                        </PDFViewer>
                    )}
                </div>
            )}

            {/* PDF 공유/다운로드 버튼 */}
            {pdfUrl && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors text-white"
                        onClick={sharePdf}
                    >
                        모바일에서 공유
                    </button>
                    <button
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors text-white"
                        onClick={downloadPdf}
                    >
                        PDF 다운로드
                    </button>
                </div>
            )}

            {/* 안내 메시지 */}
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
                <p className="text-blue-300">
                    이 테스트는 <strong>@react-pdf/renderer로 PDF를 생성</strong>하고, 안드로이드 PWA에서 PDF.js로
                    렌더링하는 기능을 검증합니다.
                </p>
            </div>
        </div>
    );
};

export default PdfTest;

/* 
 * 서비스 워커 예시 (별도 파일: service-worker.js)
 * PWA에서 PDF 리소스 캐싱을 위해 추가하세요
const CACHE_NAME = 'pdf-cache-v1';
const urlsToCache = [
    '/',
    '/fonts/PretendardVariable.ttf',
    // 필요 시 추가 리소스
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
*/
