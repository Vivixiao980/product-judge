'use client';

import { Send } from 'lucide-react';

interface ChatInputProps {
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    onSend: () => void;
    onQuickSend: (content: string) => void;
}

const quickActions = [
    { label: '直接给我结论', message: '直接给我结论与建议。' },
    { label: '给我验证方案', message: '给我一个可验证的最小实验方案。' },
    { label: '跳到多视角分析', message: '跳到多视角分析。' },
];

export function ChatInput({ input, setInput, isLoading, onSend, onQuickSend }: ChatInputProps) {
    return (
        <div className="p-4 bg-white border-t border-gray-100">
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
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
                产品顾问会从多个视角帮你审视产品，放轻松聊就好 😊
            </p>
        </div>
    );
}
