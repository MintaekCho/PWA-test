import { useState } from 'react';
import { TestResults, TestResult } from '../types';

interface UseTestResultsReturn {
    testResults: TestResults;
    updateTestResult: (testName: keyof TestResults, result: Partial<TestResult>) => void;
    resetTestResults: () => void;
    generateSummary: () => {
        totalTests: number;
        testedCount: number;
        successCount: number;
        successRate: number;
    };
}

const initialTestResults: TestResults = {
    pdf: { tested: false, success: false, details: '' },
    signature: { tested: false, success: false, details: '' },
    phone: { tested: false, success: false, details: '' },
    fileIO: { tested: false, success: false, details: '' },
    location: { tested: false, success: false, details: '' },
    photo: { tested: false, success: false, details: '' },
};

export function useTestResults(): UseTestResultsReturn {
    const [testResults, setTestResults] = useState<TestResults>(initialTestResults);

    const updateTestResult = (testName: keyof TestResults, result: Partial<TestResult>): void => {
        setTestResults((prev) => ({
            ...prev,
            [testName]: {
                ...prev[testName],
                ...result,
            },
        }));
    };

    const resetTestResults = (): void => {
        setTestResults(initialTestResults);
    };

    const generateSummary = () => {
        const successCount = Object.values(testResults).filter((test) => test.success).length;
        const testedCount = Object.values(testResults).filter((test) => test.tested).length;

        return {
            totalTests: Object.keys(testResults).length,
            testedCount,
            successCount,
            successRate: testedCount > 0 ? Math.round((successCount / testedCount) * 100) : 0,
        };
    };

    return {
        testResults,
        updateTestResult,
        resetTestResults,
        generateSummary,
    };
}
