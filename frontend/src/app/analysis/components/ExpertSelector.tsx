'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { EXPERTS, getRecommendedExperts, EXPERT_CATEGORIES } from '@/data/experts';
import { ExpertCard } from './ExpertCard';
import { PRODUCT_TYPES, ProductType, USER_GOALS, UserGoal } from '../types';
import { Summary } from '@/app/chat/types';

interface ExpertSelectorProps {
  summary: Summary;
  onStartAnalysis: (selectedExperts: string[], productType: string, userGoal: UserGoal) => void;
}

export function ExpertSelector({ summary, onStartAnalysis }: ExpertSelectorProps) {
  const [productType, setProductType] = useState<ProductType>('B2C消费品');
  const [userGoal, setUserGoal] = useState<UserGoal>('validate');
  const [selectedExperts, setSelectedExperts] = useState<string[]>(() => {
    const recommended = getRecommendedExperts('B2C消费品');
    return recommended.slice(0, 3);
  });
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const recommendedExperts = getRecommendedExperts(productType);

  const handleProductTypeChange = (type: ProductType) => {
    setProductType(type);
    setShowTypeDropdown(false);
    const recommended = getRecommendedExperts(type);
    setSelectedExperts(recommended.slice(0, 3));
  };

  const toggleExpert = (expertId: string) => {
    setSelectedExperts((prev) =>
      prev.includes(expertId)
        ? prev.filter((id) => id !== expertId)
        : [...prev, expertId]
    );
  };

  const handleStart = () => {
    if (selectedExperts.length === 0) return;
    onStartAnalysis(selectedExperts, productType, userGoal);
  };

  // 按类别分组专家
  const expertsByCategory = EXPERT_CATEGORIES.map((category) => ({
    ...category,
    experts: EXPERTS.filter((e) => e.category === category.id),
  }));

  return (
    <div className="max-w-4xl mx-auto">
      {/* 产品概要 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-4">产品概要</h2>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-gray-700 whitespace-pre-wrap">{summary.product || '暂无产品描述'}</p>
        </div>
      </div>

      {/* 用户目标选择 - 新增 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-2">你现在最想解决什么问题？</h2>
        <p className="text-sm text-gray-500 mb-4">选择你的目标，专家会给出更有针对性的落地建议</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {USER_GOALS.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setUserGoal(goal.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                userGoal === goal.id
                  ? 'border-black bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{goal.label}</span>
                    {userGoal === goal.id && (
                      <Check size={16} className="text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 产品类型选择 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-4">产品类型</h2>
        <p className="text-sm text-gray-500 mb-3">选择产品类型，我们会为你推荐最合适的专家</p>

        <div className="relative">
          <button
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span>{productType}</span>
            <ChevronDown size={20} className={`text-gray-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTypeDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {PRODUCT_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleProductTypeChange(type)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    type === productType ? 'bg-gray-50 font-medium' : ''
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 专家选择 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-2">选择专家</h2>
        <p className="text-sm text-gray-500 mb-6">
          已选择 {selectedExperts.length} 位专家，带有"推荐"标签的专家最适合分析你的产品类型
        </p>

        {expertsByCategory.map((category) => (
          <div key={category.id} className="mb-6 last:mb-0">
            <h3 className="text-sm font-medium text-gray-400 mb-3">{category.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {category.experts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  isSelected={selectedExperts.includes(expert.id)}
                  isRecommended={recommendedExperts.includes(expert.id)}
                  onToggle={() => toggleExpert(expert.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 开始分析按钮 */}
      <div className="sticky bottom-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              已选择 {selectedExperts.length} 位专家
            </p>
            <p className="text-sm text-gray-500">
              目标：{USER_GOALS.find(g => g.id === userGoal)?.label}
            </p>
          </div>
          <button
            onClick={handleStart}
            disabled={selectedExperts.length === 0}
            className="px-6 py-3 bg-black text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            开始多视角分析
          </button>
        </div>
      </div>
    </div>
  );
}
