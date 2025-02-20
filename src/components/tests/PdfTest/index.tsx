import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { pdf } from '@react-pdf/renderer';
import { Document as PDFDocument, Page as PDFPage, View, Text, StyleSheet, Font, PDFViewer } from '@react-pdf/renderer';
import { TestComponentProps } from '../../../types';

// PDF.js 워커 설정 - 안정적인 버전 사용
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.js`;

// 한글 폰트 등록 (필요시)
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
    flexRow: {
        flexDirection: 'row',
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
                    {/* 테이블 헤더 */}
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

                    {/* 테이블 데이터 */}
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

const PdfTest: React.FC<TestComponentProps> = ({ onClose, testResult, updateTestResult }) => {
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [pdfData, setPdfData] = useState<PdfData>({
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

    // PDF 생성 함수
    const generatePdf = async () => {
        setLoading(true);

        try {
            // @react-pdf/renderer로 PDF 생성
            const pdfDoc = <PDFTemplate data={pdfData} />;
            const asPdf = pdf();
            asPdf.updateContainer(pdfDoc);
            console.log(asPdf);
            const blob = await asPdf.toBlob();
            setPdfBlob(blob);

            // 이전 URL이 있다면 해제
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
            }

            const file = new File([blob], 'document.pdf', { type: 'application/pdf' });
            const url = URL.createObjectURL(file);

            // 새 URL 생성
            setPdfUrl(url);
            console.log(url);

            updateTestResult({
                tested: true,
                success: true,
                details: 'PDF 생성 완료. 렌더링 중...',
            });
            setLoading(false);
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

    // PDF 공유 함수 (모바일용)
    const sharePdf = async () => {
        if (!pdfBlob) return;

        try {
            // 웹 공유 API가 지원되는지 확인
            if (navigator.share && navigator.canShare) {
                const file = new File([pdfBlob], '테스트_리포트.pdf', { type: 'application/pdf' });

                // 파일 공유 가능한지 확인
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
                    // 다운로드 대체 로직
                    downloadPdf();
                }
            } else {
                // 공유 API를 지원하지 않는 경우 다운로드
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

    // PDF 로드 성공 핸들러
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        console.log('success');
        setNumPages(numPages);
        setPageNumber(1);
        setLoading(false);
        updateTestResult({
            tested: true,
            success: true,
            details: `PDF 렌더링 성공: ${numPages}페이지`,
        });
    };

    // 페이지 변경 핸들러
    const changePage = (offset: number) => {
        if (!numPages) return;
        const newPageNumber = pageNumber + offset;
        if (newPageNumber >= 1 && newPageNumber <= numPages) {
            setPageNumber(newPageNumber);
        }
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    const documentOptions = useMemo(
        () => ({
            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/',
        }),
        []
    );

    // PDF URL이 실제로 유효한지 확인
    useEffect(() => {
        if (pdfUrl) {
            console.log('PDF URL:', pdfUrl);
            console.log('PDF Blob 크기:', pdfBlob?.size, 'bytes');

            // 간단한 fetch로 URL 접근 가능한지 테스트
            fetch(pdfUrl)
                .then((response) => {
                    console.log('PDF URL 접근 가능:', response.ok, response.status);
                    return response.blob();
                })
                .then((blob) => {
                    console.log('PDF Blob 유효:', blob.size, 'bytes', blob.type);
                })
                .catch((error) => {
                    console.error('PDF URL 접근 오류:', error);
                });
        }
    }, [pdfUrl, pdfBlob]);

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

                        {/* 렌더링 방식 선택 */}
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

                        <div className="text-sm text-gray-300">
                            @react-pdf/renderer를 사용하여 React 컴포넌트로 PDF를 생성합니다. 렌더링은 선택한 방식으로
                            진행됩니다.
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
                            {useInlinePreview ? '@react-pdf/renderer' : `react-pdf ${pdfjs.version}`}
                        </p>
                        <p>
                            <span className="font-medium text-gray-300">페이지:</span>{' '}
                            {numPages ? `${pageNumber} / ${numPages}` : '생성되지 않음'}
                        </p>
                        <p>
                            <span className="font-medium text-gray-300">상태:</span>{' '}
                            {loading ? '처리 중' : pdfUrl ? '렌더링됨' : '대기 중'}
                        </p>
                    </div>
                </div>
            </div>

            {pdfUrl && !useInlinePreview && (
                <div className="mt-6 bg-white rounded-lg overflow-hidden p-2">
                    <div className="relative w-full" style={{ height: '600px' }}>
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : (
                            <>
                                <embed
                                    src={pdfUrl}
                                    type="application/pdf"
                                    className="absolute inset-0 w-full h-full"
                                    onLoad={() => {
                                        setLoading(false);
                                        updateTestResult({
                                            tested: true,
                                            success: true,
                                            details: 'PDF 렌더링 성공 (embed)',
                                        });
                                    }}
                                />
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                    <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
                                        브라우저 내장 PDF 뷰어로 표시됨
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

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
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <button
                        className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg transition-colors"
                        onClick={sharePdf}
                    >
                        모바일에서 공유
                    </button>
                    <button
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors"
                        onClick={downloadPdf}
                    >
                        PDF 다운로드
                    </button>
                </div>
            )}

            {/* 안내 메시지 */}
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
                <p className="text-blue-300">
                    이 테스트는 <strong>@react-pdf/renderer를 사용하여 리액트 컴포넌트로 PDF를 생성하고</strong> 모바일
                    브라우저에서 렌더링하는 기능을 검증합니다. 두 가지 렌더링 방식(react-pdf 또는 @react-pdf/renderer의
                    인라인 미리보기)을 선택할 수 있습니다.
                </p>
            </div>
        </div>
    );
};

export default PdfTest;
