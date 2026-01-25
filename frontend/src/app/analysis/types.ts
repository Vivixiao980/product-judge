// 多视角分析类型定义

import { Summary } from '../chat/types';

// 用户目标类型
export const USER_GOALS = [
  {
    id: 'validate',
    label: '验证需求 (0→0.1)',
    description: '我想验证产品是否有真实需求，找到第一批用户',
    icon: '🔬',
  },
  {
    id: 'positioning',
    label: '产品定位与营销',
    description: '我想找到独特的市场定位，制定营销策略',
    icon: '🎯',
  },
  {
    id: 'monetize',
    label: '商业化变现',
    description: '我想探索盈利模式，实现产品商业化',
    icon: '💰',
  },
  {
    id: 'scale',
    label: '规模化增长',
    description: '我已验证需求，想要快速扩大用户规模',
    icon: '🚀',
  },
] as const;

export type UserGoal = typeof USER_GOALS[number]['id'];

export interface ExpertAnalysis {
  expertId: string;
  expertName: string;
  score: number;
  analysis: string;
  strengths: string[];
  risks: string[];
  suggestions: string[];
  // 新增：针对用户目标的具体行动建议
  actionItems?: string[];
  status: 'pending' | 'analyzing' | 'completed' | 'error';
}

export interface AnalysisState {
  step: 'select' | 'analyzing' | 'report';
  productType: string;
  userGoal: UserGoal;
  selectedExperts: string[];
  targetUserDescription?: string;
  analyses: ExpertAnalysis[];
  overallScore: number;
  isLoading: boolean;
  error: string | null;
}

export interface AnalysisRequest {
  summary: Summary;
  expertId: string;
  productType: string;
  userGoal: UserGoal;
  targetUserDescription?: string;
}

export interface AnalysisResponse {
  expert: string;
  score: number;
  analysis: string;
  strengths: string[];
  risks: string[];
  suggestions: string[];
  actionItems: string[];
}

export const PRODUCT_TYPES = [
  'B2C消费品',
  'B2B SaaS',
  'AI产品',
  '社交/社区',
  '电商/零售',
  '工具类',
  '内容/媒体',
  '金融科技',
] as const;

export type ProductType = typeof PRODUCT_TYPES[number];
