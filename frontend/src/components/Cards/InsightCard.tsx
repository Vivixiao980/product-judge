'use client';

import { Sparkles, Quote } from 'lucide-react';

export interface CardData {
    id: string;
    title: string;
    category: string;
    content: string;
    author: string;
    source?: string;
    tags: string[];
    fullArticle?: string;
}

interface InsightCardProps {
    card: CardData;
    onClick?: (card: CardData) => void;
}

export default function InsightCard({ card, onClick }: InsightCardProps) {
    return (
        <button
            type="button"
            onClick={() => onClick?.(card)}
            className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden text-left"
        >
            {/* Category Tag */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">
                    {card.category}
                </span>
                <Sparkles size={16} className="text-gray-300 group-hover:text-yellow-400 transition-colors" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {card.title}
            </h3>

            {/* Content */}
            <div className="mb-6 relative">
                <Quote className="absolute -top-2 -left-2 text-gray-100 fill-gray-50 h-8 w-8 -z-10" />
                <p className="text-gray-800 font-medium leading-relaxed">
                    &quot;{card.content}&quot;
                </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className="text-xs text-gray-500 max-w-[55%] truncate">
                    {card.source ? `来源：${card.source}` : `— ${card.author}`}
                </div>
                <div className="flex gap-2">
                    {card.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </button>
    );
}
