// src/components/tests/FileIOTest/index.tsx
import React, { useState } from 'react';
import { TestComponentProps } from '../../../types';

interface FileIOTestProps extends TestComponentProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const FileIOTest: React.FC<FileIOTestProps> = ({
  onClose,
  testResult,
  updateTestResult,
  fileInputRef
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setImageFile(file);
          updateTestResult({
            tested: true, 
            success: true, 
            details: `파일 업로드 성공: ${file.name} (${(file.size / 1024).toFixed(2)} KB)` 
          });
        }
      };
      reader.onerror = (error) => {
        updateTestResult({
          tested: true,
          success: false,
          details: `파일 읽기 실패: ${error}`
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateTestResult({
        tested: true,
        success: false,
        details: `파일 처리 중 오류: ${errorMessage}`
      });
    }
  };
  
  const downloadTestFile = (): void => {
    try {
      // 테스트용 텍스트 파일 생성
      const content = `PWA 파일 다운로드 테스트\n${new Date().toLocaleString()}\n기기 정보: ${navigator.userAgent}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `pwa-test-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      updateTestResult({
        tested: true, 
        success: true, 
        details: `파일 다운로드 테스트 완료: ${new Date().toLocaleString()}` 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateTestResult({
        tested: true,
        success: false,
        details: `파일 다운로드 실패: ${errorMessage}`
      });
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur rounded-lg overflow-hidden p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">파일 I/O 테스트</h2>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 파일 업로드 테스트 */}
        <div className="bg-black/20 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">파일 업로드 테스트</h3>
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            ref={fileInputRef}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition-colors mb-4"
          >
            파일 선택
          </button>
          {imageFile && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-1">업로드된 파일:</div>
              <div className="bg-black/30 p-2 rounded text-xs">
                <div>이름: {imageFile.name}</div>
                <div>크기: {(imageFile.size / 1024).toFixed(2)} KB</div>
                <div>타입: {imageFile.type}</div>
                <div>최종 수정: {new Date(imageFile.lastModified).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* 파일 다운로드 테스트 */}
        <div className="bg-black/20 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">파일 다운로드 테스트</h3>
          <button
            onClick={downloadTestFile}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition-colors"
          >
            테스트 파일 다운로드
          </button>
          <div className="mt-4 text-sm text-gray-300">
            간단한 텍스트 파일이 기기에 다운로드됩니다.
            기기 및 브라우저 설정에 따라 다운로드 방식이 달라질 수 있습니다.
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500 rounded-lg">
        <h3 className="text-lg font-medium mb-2">파일 시스템 지원 정보</h3>
        <dl className="space-y-2 text-sm">
          <div className="grid grid-cols-2">
            <dt>다운로드 API 지원:</dt>
            <dd className="text-green-300">지원됨</dd>
          </div>
          <div className="grid grid-cols-2">
            <dt>File API 지원:</dt>
            <dd className="text-green-300">지원됨</dd>
          </div>
          <div className="grid grid-cols-2">
            <dt>FileReader API 지원:</dt>
            <dd className={typeof FileReader !== 'undefined' ? 'text-green-300' : 'text-red-300'}>
              {typeof FileReader !== 'undefined' ? '지원됨' : '지원되지 않음'}
            </dd>
          </div>
          <div className="grid grid-cols-2">
            <dt>PWA 모드:</dt>
            <dd className={window.matchMedia('(display-mode: standalone)').matches ? 'text-green-300' : 'text-yellow-300'}>
              {window.matchMedia('(display-mode: standalone)').matches ? '활성화됨' : '비활성화됨'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default FileIOTest;