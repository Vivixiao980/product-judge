'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Summary, Stage, StageConfig } from './types';
import { WELCOME_MESSAGE } from '@/data/prompts';
import {
    trackPageView,
    trackMessageSent,
    trackMessageReceived,
    trackStageChange,
    trackQuickAction,
    trackApiError,
} from '@/lib/tracking';

const normalizeSummary = (value: unknown): Summary => {
    const coerceText = (input: unknown): string => {
        if (typeof input === 'string') return input;
        if (Array.isArray(input)) return input.map(coerceText).filter(Boolean).join('\n');
        if (input && typeof input === 'object') {
            return Object.entries(input as Record<string, unknown>)
                .map(([key, val]) => `${key}：${coerceText(val)}`)
                .filter(Boolean)
                .join('\n');
        }
        if (input == null) return '';
        return String(input);
    };

    const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    const casesRaw = obj.cases ?? [];
    const cases = Array.isArray(casesRaw)
        ? casesRaw
              .map(item => {
                  if (item && typeof item === 'object') {
                      const record = item as Record<string, unknown>;
                      return {
                          name: coerceText(record.name),
                          reason: coerceText(record.reason),
                      };
                  }
                  return { name: coerceText(item), reason: '' };
              })
              .filter(item => item.name || item.reason)
        : [];

    return {
        product: coerceText(obj.product),
        aiAdvice: coerceText(obj.aiAdvice),
        userNotes: coerceText(obj.userNotes),
        cases,
    };
};

const isMeaningful = (text: unknown, minLines: number) => {
    const normalized = typeof text === 'string' ? text : text == null ? '' : String(text);
    if (!normalized) return false;
    if (normalized.includes('暂无') || normalized.includes('待用户补充')) return false;
    const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.length >= minLines;
};

// 计算当前阶段
const computeStage = (summary: Summary): Stage => {
    const productReady = isMeaningful(summary.product, 2);
    const adviceReady = isMeaningful(summary.aiAdvice, 2);
    const userNotesReady = isMeaningful(summary.userNotes, 1);

    if (!productReady) return 'info';
    if (!adviceReady || !userNotesReady) return 'deep';
    return 'analysis';
};

const stageConfigs: Record<Stage, Omit<StageConfig, 'checklist'> & { checklist: { label: string; condition: (s: Summary) => boolean }[] }> = {
    info: {
        label: '信息收集',
        goal: '产出一句话产品定义 + 关键用户/场景',
        checklist: [
            { label: '目标用户 & 场景', condition: (s) => isMeaningful(s.product, 2) },
            { label: '核心问题/价值主张', condition: (s) => isMeaningful(s.product, 2) },
            { label: '当前阶段/进展', condition: (s) => isMeaningful(s.product, 2) },
        ],
        takeaway: '你会得到：清晰的产品轮廓和核心假设。',
    },
    deep: {
        label: '深度追问',
        goal: '产出关键假设 + 可验证路径',
        checklist: [
            { label: '最关键不确定点', condition: (s) => isMeaningful(s.aiAdvice, 2) },
            { label: '验证方案/指标', condition: (s) => isMeaningful(s.aiAdvice, 2) },
            { label: '用户视角补充', condition: (s) => isMeaningful(s.userNotes, 1) },
        ],
        takeaway: '你会得到：验证方案与风险清单。',
    },
    analysis: {
        label: '多视角分析',
        goal: '产出优势/风险/机会 + 行动建议',
        checklist: [
            { label: '产品视角判断', condition: (s) => isMeaningful(s.aiAdvice, 2) },
            { label: '商业/技术可行性', condition: (s) => isMeaningful(s.aiAdvice, 2) },
            { label: '建议与行动清单', condition: (s) => isMeaningful(s.aiAdvice, 2) },
        ],
        takeaway: '你会得到：完整诊断 + 可执行建议。',
    },
};

export function useChat() {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: WELCOME_MESSAGE,
        },
    ]);
    const [summary, setSummary] = useState<Summary>({
        product: '等待你介绍产品后生成…',
        aiAdvice: '先聊聊你的产品背景，我会持续整理建议。',
        userNotes: '还没有记录到你的观点。',
        cases: [],
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevStageRef = useRef<Stage | null>(null);

    // 计算当前阶段（提前计算，供后续使用）
    const currentStage = computeStage(summary);

    // 页面访问埋点
    useEffect(() => {
        trackPageView('chat');
    }, []);

    // 阶段切换埋点
    useEffect(() => {
        if (prevStageRef.current && prevStageRef.current !== currentStage) {
            trackStageChange(prevStageRef.current, currentStage);
        }
        prevStageRef.current = currentStage;
    }, [currentStage]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const requestSummary = useCallback(async (snapshot: Message[]) => {
        setIsSummarizing(true);
        try {
            const response = await fetch('/api/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: snapshot.map(m => ({ role: m.role, content: m.content })) }),
            });

            if (!response.ok) {
                throw new Error('Summary request failed');
            }

            const data = await response.json();
            if (data?.summary) {
                setSummary(normalizeSummary(data.summary));
            }
        } catch (error) {
            console.error('Error calling summary API:', error);
        } finally {
            setIsSummarizing(false);
        }
    }, []);

    const sendMessage = useCallback(async (content: string, isQuickAction?: string) => {
        if (!content.trim() || isLoading) return;

        // 埋点：发送消息
        trackMessageSent(content.length, currentStage);
        if (isQuickAction) {
            trackQuickAction(isQuickAction);
        }

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
        const currentMessages = [...messages, userMsg];
        setMessages(currentMessages);
        setIsLoading(true);
        setIsThinking(true);
        void requestSummary(currentMessages);

        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                const data = await response.json();
                const finalMessages = currentMessages.concat({
                    id: assistantId,
                    role: 'assistant',
                    content: data.message,
                });
                setMessages(prev =>
                    prev.map(m => (m.id === assistantId ? { ...m, content: data.message } : m))
                );
                setIsThinking(false);
                void requestSummary(finalMessages);
                // 埋点：收到回复
                trackMessageReceived(data.message.length, currentStage);
                return;
            }

            const decoder = new TextDecoder();
            let done = false;
            let accumulated = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunk = decoder.decode(value || new Uint8Array(), { stream: !doneReading });
                if (!chunk) continue;
                setIsThinking(false);
                accumulated += chunk;
                setMessages(prev =>
                    prev.map(m => (m.id === assistantId ? { ...m, content: accumulated } : m))
                );
            }
            const finalMessages = currentMessages.concat({
                id: assistantId,
                role: 'assistant',
                content: accumulated,
            });
            void requestSummary(finalMessages);
            // 埋点：收到回复
            trackMessageReceived(accumulated.length, currentStage);
        } catch (error) {
            console.error('Error calling chat API:', error);
            // 埋点：API 错误
            trackApiError('chat', error instanceof Error ? error.message : 'Unknown error');
            const errorMsg: Message = {
                id: assistantId,
                role: 'assistant',
                content: "思考过程中遇到了问题。请确保 `.env.local` 文件中已正确设置 `OPENROUTER_API_KEY`。",
            };
            setMessages(prev => prev.map(m => (m.id === assistantId ? errorMsg : m)));
        } finally {
            setIsLoading(false);
            setIsThinking(false);
        }
    }, [isLoading, messages, requestSummary, currentStage]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        const content = input;
        setInput('');
        await sendMessage(content);
    }, [input, isLoading, sendMessage]);

    const handleQuickSend = useCallback(async (content: string) => {
        if (isLoading) return;
        await sendMessage(content, content);
    }, [isLoading, sendMessage]);

    const stageConfig: StageConfig = {
        ...stageConfigs[currentStage],
        checklist: stageConfigs[currentStage].checklist.map(item => ({
            label: item.label,
            done: item.condition(summary),
        })),
    };

    return {
        input,
        setInput,
        isLoading,
        isThinking,
        isSummarizing,
        messages,
        summary,
        messagesEndRef,
        currentStage,
        stageConfig,
        handleSend,
        handleQuickSend,
    };
}
