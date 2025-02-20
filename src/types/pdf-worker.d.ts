declare module 'pdfjs-dist/build/pdf' {
    // PDF.js의 핵심 모듈 타입 정의
    export interface PDFDocumentProxy {
        numPages: number;
        getPage(pageNumber: number): Promise<PDFPageProxy>;
        destroy(): void;
    }

    export interface PDFPageProxy {
        pageNumber: number;
        getViewport(params: { scale: number }): Viewport;
        render(params: RenderParameters): RenderTask;
    }

    export interface Viewport {
        width: number;
        height: number;
    }

    export interface RenderParameters {
        canvasContext: CanvasRenderingContext2D;
        viewport: Viewport;
    }

    export interface RenderTask {
        promise: Promise<void>;
    }

    export interface GetDocumentParameters {
        url?: string;
        data?: Uint8Array | ArrayBuffer | string;
    }

    export const GlobalWorkerOptions: {
        workerSrc: string;
    };

    export function getDocument(
        source: string | Uint8Array | ArrayBuffer | GetDocumentParameters
    ): { promise: Promise<PDFDocumentProxy> };
}

declare module 'pdfjs-dist/build/pdf.worker.entry' {
    // pdf.worker.entry는 단순히 워커 스크립트 경로로 사용되므로 문자열로 정의
    const workerSrc: string;
    export default workerSrc;
}

// pdfjsLib를 전역에서 사용할 수 있도록 타입 추가 (선택 사항)
declare global {
    interface Window {
        pdfjsLib?: typeof import('pdfjs-dist/build/pdf');
    }
}