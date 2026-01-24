'use client';

import { ExpertAnalysis } from '../types';
import { ExpertChat } from './ExpertChat';
import { getExpertById } from '@/data/experts';

interface AnalysisProgressProps {
  analyses: ExpertAnalysis[];
  onBack: () => void;
  onViewReport: () => void;
}

export function AnalysisProgress({ analyses, onBack, onViewReport }: AnalysisProgressProps) {
  const completedCount = analyses.filter((a) => a.status === 'completed').length;
  const totalCount = analyses.length;
  const allCompleted = completedCount === totalCount;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 进度条 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">多视角分析进行中</h2>
          <span className="text-sm text-gray-500">
            {completedCount}/{totalCount} 位专家已完成
          </span>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 专家头像列表 */}
        <div className="flex items-center gap-2 mt-4">
          {analyses.map((analysis) => {
            const expert = getExpertById(analysis.expertId);
            if (!expert) return null;

            return (
              <div
                key={analysis.expertId}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all ${
                  analysis.status === 'completed'
                    ? ''
                    : analysis.status === 'analyzing'
                    ? 'ring-2 ring-blue-400 ring-offset-2'
                    : 'opacity-40'
                }`}
                style={{ backgroundColor: expert.color }}
                title={expert.name}
              >
                {expert.name.charAt(0)}
              </div>
            );
          })}
        </div>
      </div>

      {/* 专家分析卡片 */}
      <div className="space-y-4">
        {analyses.map((analysis) => (
          <ExpertChat key={analysis.expertId} analysis={analysis} />
        ))}
      </div>

      {/* 底部操作 */}
      <div className="sticky bottom-4 mt-6 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
          >
            返回修改
          </button>

          <button
            onClick={onViewReport}
            disabled={!allCompleted}
            className="px-6 py-3 bg-black text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            {allCompleted ? '查看完整报告' : '分析中...'}
          </button>
        </div>
      </div>
    </div>
  );
}
