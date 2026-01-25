'use client';

import { useState, useCallback } from 'react';
import { ExpertAnalysis, AnalysisState, UserGoal } from '../types';
import { Summary } from '@/app/chat/types';
import { getExpertById } from '@/data/experts';

const initialState: AnalysisState = {
  step: 'select',
  productType: 'B2C消费品',
  userGoal: 'validate',
  selectedExperts: [],
  analyses: [],
  overallScore: 0,
  isLoading: false,
  error: null,
};

// 从分析文本中提取 JSON 结果
function extractAnalysisResult(text: string): {
  score: number;
  strengths: string[];
  risks: string[];
  suggestions: string[];
  actionItems: string[];
} {
  const defaultResult = {
    score: 7,
    strengths: [],
    risks: [],
    suggestions: [],
    actionItems: [],
  };

  // 尝试提取 JSON
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        score: parsed.score || 7,
        strengths: parsed.strengths || [],
        risks: parsed.risks || [],
        suggestions: parsed.suggestions || [],
        actionItems: parsed.actionItems || parsed.action_items || [],
      };
    } catch {
      // 解析失败，使用默认值
    }
  }

  // 尝试从文本中提取评分
  const scoreMatch = text.match(/评分[：:]\s*(\d+(?:\.\d+)?)/);
  if (scoreMatch) {
    defaultResult.score = parseFloat(scoreMatch[1]);
  }

  return defaultResult;
}

export function useAnalysis(summary: Summary) {
  const [state, setState] = useState<AnalysisState>(initialState);

  const startAnalysis = useCallback(
    async (selectedExperts: string[], productType: string, userGoal: UserGoal, targetUserDescription?: string) => {
      // 初始化分析状态
      const initialAnalyses: ExpertAnalysis[] = selectedExperts.map((expertId) => {
        const expert = getExpertById(expertId);
        return {
          expertId,
          expertName: expert?.name || expertId,
          score: 0,
          analysis: '',
          strengths: [],
          risks: [],
          suggestions: [],
          actionItems: [],
          status: 'pending',
        };
      });

      setState((prev) => ({
        ...prev,
        step: 'analyzing',
        productType,
        userGoal,
        selectedExperts,
        targetUserDescription,
        analyses: initialAnalyses,
        isLoading: true,
        error: null,
      }));

      // 依次调用每个专家的分析 API
      for (let i = 0; i < selectedExperts.length; i++) {
        const expertId = selectedExperts[i];

        // 更新当前专家状态为 analyzing
        setState((prev) => ({
          ...prev,
          analyses: prev.analyses.map((a) =>
            a.expertId === expertId ? { ...a, status: 'analyzing' } : a
          ),
        }));

        try {
          const response = await fetch('/api/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              summary,
              expertId,
              productType,
              userGoal,
              targetUserDescription: targetUserDescription || summary.product,
            }),
          });

          if (!response.ok) {
            throw new Error('Analysis failed');
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let fullText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            // 更新分析文本（流式）
            setState((prev) => ({
              ...prev,
              analyses: prev.analyses.map((a) =>
                a.expertId === expertId ? { ...a, analysis: fullText } : a
              ),
            }));
          }

          // 提取结构化结果
          const result = extractAnalysisResult(fullText);

          // 更新完成状态
          setState((prev) => ({
            ...prev,
            analyses: prev.analyses.map((a) =>
              a.expertId === expertId
                ? {
                    ...a,
                    status: 'completed',
                    score: result.score,
                    strengths: result.strengths,
                    risks: result.risks,
                    suggestions: result.suggestions,
                    actionItems: result.actionItems,
                  }
                : a
            ),
          }));
        } catch (error) {
          console.error(`Analysis error for ${expertId}:`, error);

          // 更新错误状态
          setState((prev) => ({
            ...prev,
            analyses: prev.analyses.map((a) =>
              a.expertId === expertId ? { ...a, status: 'error' } : a
            ),
          }));
        }
      }

      // 计算综合评分
      setState((prev) => {
        const completedAnalyses = prev.analyses.filter((a) => a.status === 'completed');
        const overallScore =
          completedAnalyses.length > 0
            ? completedAnalyses.reduce((sum, a) => sum + a.score, 0) / completedAnalyses.length
            : 0;

        return {
          ...prev,
          isLoading: false,
          overallScore,
        };
      });
    },
    [summary]
  );

  const goToReport = useCallback(() => {
    setState((prev) => ({ ...prev, step: 'report' }));
  }, []);

  const goToSelect = useCallback(() => {
    setState((prev) => ({ ...prev, step: 'select' }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    startAnalysis,
    goToReport,
    goToSelect,
    reset,
  };
}
