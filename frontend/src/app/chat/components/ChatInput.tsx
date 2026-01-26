'use client';

import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Summary, Stage } from '../types';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    onSend: () => void;
    onQuickSend: (content: string) => void;
    summary?: Summary;
    currentStage?: Stage;
}

const quickActions = [
    { label: '直接给我结论', message: '直接给我结论与建议。' },
    { label: '给我验证方案', message: '给我一个可验证的最小实验方案。' },
];

export function ChatInput({ input, setInput, isLoading, onSend, onQuickSend, summary, currentStage }: ChatInputProps) {
    const router = useRouter();

    const handleGoToAnalysis = () => {
        if (summary) {
            sessionStorage.setItem('analysis_summary', JSON.stringify(summary));
        }
        router.push('/analysis');
    };

    return (
        <div className="sticky bottom-0 z-10 border-t border-gray-100 bg-white/95 backdrop-blur p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="text-xs text-gray-500 mb-2">
                {currentStage === 'info' && 'Step 1：先帮我把产品轮廓讲清楚～'}
                {currentStage === 'deep' && 'Step 2：我会追问关键假设，一起把问题想清楚'}
                {currentStage === 'analysis' && 'Step 3 就绪啦：随时可以进入多视角分析'}
            </div>
            <div className="relative flex items-center">
                <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 px-5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                    placeholder="输入你的回答..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                    disabled={isLoading}
                />
                <button
                    onClick={onSend}
                    disabled={isLoading}
                    className="absolute right-2 p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    <Send size={16} />
                </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
                {quickActions.map((action) => (
                    <button
                        key={action.label}
                        onClick={() => onQuickSend(action.message)}
                        disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {action.label}
                    </button>
                ))}
                <button
                    onClick={handleGoToAnalysis}
                    disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    跳到多视角分析
                </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
                产品顾问会从多个视角帮你审视产品，放轻松聊就好 😊
            </p>
        </div>
    );
}
