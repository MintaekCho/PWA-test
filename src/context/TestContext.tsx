// src/context/TestContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { TestResults, TestResult } from '../types';

interface TestContextType {
    testResults: TestResults;
    updateTestResult: (testName: keyof TestResults, result: TestResult) => void;
    generateSummary: () => { totalTests: number; testedCount: number; successCount: number; successRate: number };
    shareResults: () => Promise<void>;
}

const defaultTestResults: TestResults = {
    pdf: { tested: false, success: false, details: '' },
    signature: { tested: false, success: false, details: '' },
    phone: { tested: false, success: false, details: '' },
    fileIO: { tested: false, success: false, details: '' },
    location: { tested: false, success: false, details: '' },
    photo: { tested: false, success: false, details: '' },
};

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [testResults, setTestResults] = useState<TestResults>(defaultTestResults);

    const updateTestResult = (testName: keyof TestResults, result: TestResult) => {
        setTestResults((prev) => ({
            ...prev,
            [testName]: result,
        }));
    };

    const generateSummary = () => {
        const successCount = Object.values(testResults).filter((test) => test.success).length;
        const testedCount = Object.values(testResults).filter((test) => test.tested).length;

        return {
            totalTests: 6,
            testedCount,
            successCount,
            successRate: testedCount > 0 ? Math.round((successCount / testedCount) * 100) : 0,
        };
    };

    const shareResults = async () => {
        const summary = generateSummary();
        const shareText = `
            PWA 테스트 결과 (${new Date().toLocaleString()})
            기기: ${navigator.userAgent}
            총 테스트: ${summary.testedCount}/${summary.totalTests}
            성공률: ${summary.successRate}%

            세부 결과:
            ${Object.entries(testResults)
                .map(
                    ([key, value]) =>
                        `- ${key}: ${value.tested ? (value.success ? '✅ 성공' : '❌ 실패') : '⬜ 미테스트'}`
                )
                .join('\n')}
                `;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'PWA 테스트 결과',
                    text: shareText,
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                alert('테스트 결과가 클립보드에 복사되었습니다');
            }
        } catch (error) {
            console.error('결과 공유 중 오류:', error);
            alert('결과 공유 중 오류가 발생했습니다');
        }
    };

    return (
        <TestContext.Provider
            value={{
                testResults,
                updateTestResult,
                generateSummary,
                shareResults,
            }}
        >
            {children}
        </TestContext.Provider>
    );
};

export const useTestContext = () => {
    const context = useContext(TestContext);
    if (context === undefined) {
        throw new Error('useTestContext must be used within a TestProvider');
    }
    return context;
};
