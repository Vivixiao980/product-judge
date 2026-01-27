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
    score: 5,
    strengths: [],
    risks: [],
    suggestions: [],
    actionItems: [],
  };

  const sanitizeJson = (raw: string) => {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '');
    cleaned = cleaned.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/m, '$1');
    cleaned = cleaned.replace(/([,{]\s*)([A-Za-z0-9_\\u4e00-\\u9fa5]+)\s*:/g, '$1"$2":');
    cleaned = cleaned.replace(/'([^']*)'/g, '"$1"');
    cleaned = cleaned.replace(/,(\s*[}\\]])/g, '$1');
    return cleaned;
  };

  const parseJsonBlock = (raw: string) => {
    try {
      const parsed = JSON.parse(sanitizeJson(raw));
      return {
        score: parsed.score || 5,
        strengths: parsed.strengths || [],
        risks: parsed.risks || [],
        suggestions: parsed.suggestions || [],
        actionItems: parsed.actionItems || parsed.action_items || [],
      };
    } catch {
      return null;
    }
  };

  // 尝试提取 ```json``` 代码块
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    const result = parseJsonBlock(jsonMatch[1]);
    if (result) return result;
  }

  // 尝试提取任意 JSON 对象
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    const result = parseJsonBlock(objMatch[0]);
    if (result) return result;
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
  const ALLOWED_SCORES = [0, 2, 5, 8, 10];

  const snapScore = (score: number) => {
    if (Number.isNaN(score)) return 5;
    let closest = ALLOWED_SCORES[0];
    let minDiff = Math.abs(score - closest);
    for (const candidate of ALLOWED_SCORES) {
      const diff = Math.abs(score - candidate);
      if (diff < minDiff) {
        minDiff = diff;
        closest = candidate;
      }
    }
    return closest;
  };

  const clampScore = (score: number, cap: number) => {
    const snapped = snapScore(score);
    const limit = snapScore(cap);
    const allowedUnderCap = ALLOWED_SCORES.filter(value => value <= limit);
    return allowedUnderCap.length ? Math.min(snapped, allowedUnderCap[allowedUnderCap.length - 1]) : 0;
  };

  const snapOverallScore = (score: number) => snapScore(score);

  const detectCaseMention = (text: string) => {
    const normalized = text.replace(/\s+/g, '');
    return /案例|比如|例如|曾经|我做过|我们做过|投资过/.test(normalized);
  };

  const computeClarityCap = (summary: Summary) => {
    const scoreLineCount = (text: string) => text.split('\n').map(l => l.trim()).filter(Boolean).length;
    const productLines = scoreLineCount(summary.product || '');
    const adviceLines = scoreLineCount(summary.aiAdvice || '');
    const notesLines = scoreLineCount(summary.userNotes || '');
    const hasCases = (summary.cases || []).length > 0;

    let clarity = 0;
    if (productLines >= 2) clarity += 2;
    if (productLines >= 4) clarity += 1;
    if (notesLines >= 1) clarity += 1;
    if (adviceLines >= 2) clarity += 1;
    if (hasCases) clarity += 1;

    // 0-2: 极不清晰; 3-4: 较模糊; 5-6: 基本清晰
    if (clarity <= 2) return 2;
    if (clarity <= 4) return 5;
    if (clarity <= 6) return 8;
    return 10;
  };

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
          const cap = computeClarityCap(summary);
          const adjustedScore = clampScore(result.score, cap);
          const needsCaseSupplement = !detectCaseMention(fullText) && !(summary.cases || []).length;

          // 更新完成状态
          setState((prev) => ({
            ...prev,
            analyses: prev.analyses.map((a) =>
              a.expertId === expertId
                ? {
                    ...a,
                    status: 'completed',
                    score: adjustedScore,
                    strengths: result.strengths,
                    risks: result.risks,
                    suggestions: result.suggestions,
                    actionItems: result.actionItems,
                    needsCaseSupplement,
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
        const overallRaw =
          completedAnalyses.length > 0
            ? completedAnalyses.reduce((sum, a) => sum + a.score, 0) / completedAnalyses.length
            : 0;
        const overallScore = snapOverallScore(overallRaw);

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
