import React from 'react';
import { useTestContext } from '../../context/TestContext';

const TestSummary: React.FC = () => {
    const { generateSummary, shareResults } = useTestContext();
    const summary = generateSummary();

    return (
        <div className="bg-black/30 backdrop-blur p-6 rounded-lg mt-8">
            <h2 className="text-xl font-semibold mb-4">테스트 진행 상황</h2>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">진행된 테스트:</span>
                    <span className="font-medium">
                        {summary.testedCount}/{summary.totalTests}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">성공한 테스트:</span>
                    <span className="font-medium text-green-400">
                        {summary.successCount}/{summary.testedCount}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-gray-300">성공률:</span>
                    <span className="font-medium">{summary.successRate}%</span>
                </div>

                <div className="w-full bg-black/30 rounded-full h-2.5 mt-4">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full"
                        style={{ width: `${(summary.testedCount / summary.totalTests) * 100}%` }}
                    ></div>
                </div>
            </div>

            {summary.testedCount > 0 && (
                <button
                    onClick={shareResults}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors"
                >
                    테스트 결과 공유
                </button>
            )}
        </div>
    );
};

export default TestSummary;
