// src/components/common/TestCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { TestResult } from '../../types';

interface TestCardProps {
  title: string;
  icon: LucideIcon;
  iconBgColor: string;
  testResult: TestResult;
  onClick: () => void;
}

const TestCard: React.FC<TestCardProps> = ({
  title,
  icon: Icon,
  iconBgColor,
  testResult,
  onClick
}) => {
  return (
    <div 
      className="bg-black/30 backdrop-blur p-4 rounded-lg hover:bg-black/40 transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className={`p-3 ${iconBgColor} rounded-full`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-medium">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          testResult.tested 
            ? (testResult.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300')
            : 'bg-gray-500/20 text-gray-300'
        }`}>
          {testResult.tested 
            ? (testResult.success ? '테스트 성공' : '테스트 실패')
            : '미테스트'}
        </span>
      </div>
    </div>
  );
};

export default TestCard;