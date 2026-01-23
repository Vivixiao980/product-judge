'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import cardsData from '@/data/cards.json';
import cmsCardsData from '@/data/cards.cms.json';
import InsightCard, { CardData } from '@/components/Cards/InsightCard';

export default function ExplorePage() {
    const combinedCards = useMemo(() => [...cmsCardsData, ...cardsData] as CardData[], []);
    const categories = useMemo(() => {
        const unique = new Set(combinedCards.map(card => card.category).filter(Boolean));
        return ['全部', ...Array.from(unique)];
    }, [combinedCards]);

    const [activeCategory, setActiveCategory] = useState('全部');
    const [activeCard, setActiveCard] = useState<CardData | null>(null);

    const filteredCards = useMemo(() => {
        if (activeCategory === '全部') return combinedCards;
        return combinedCards.filter(card => card.category === activeCategory);
    }, [activeCategory, combinedCards]);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 w-full">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">灵感火花</h1>
                <p className="text-gray-500 max-w-xl mx-auto">
                    来自全球顶尖产品领袖的核心洞察与心智模型
                </p>
            </header>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                            activeCategory === category
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map((card) => (
                    <InsightCard key={card.id} card={card} onClick={setActiveCard} />
                ))}
            </div>

            {activeCard ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={() => setActiveCard(null)}
                >
                    <div
                        className="bg-white max-w-2xl w-full rounded-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <div className="text-xs font-semibold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase inline-block mb-3">
                                    {activeCard.category}
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900">{activeCard.title}</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {activeCard.source ? `来源：${activeCard.source}` : `— ${activeCard.author}`}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="text-sm text-gray-500 hover:text-gray-800"
                                onClick={() => setActiveCard(null)}
                            >
                                关闭
                            </button>
                        </div>

                        <div className="prose prose-sm max-w-none text-gray-700">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                {activeCard.fullArticle || activeCard.content}
                            </ReactMarkdown>
                        </div>

                        {activeCard.tags?.length ? (
                            <div className="flex flex-wrap gap-2 mt-6">
                                {activeCard.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
