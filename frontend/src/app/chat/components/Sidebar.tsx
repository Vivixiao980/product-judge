'use client';

import clsx from 'clsx';
import { Summary, StageConfig } from '../types';

interface SidebarProps {
    stageConfig: StageConfig;
    summary: Summary;
    isSummarizing: boolean;
}

export function Sidebar({ stageConfig, summary, isSummarizing }: SidebarProps) {
    return (
        <aside className="hidden lg:flex flex-col gap-4 py-4">
            {/* Stage Progress */}
            <div className="border border-gray-100 bg-white rounded-2xl p-4 sticky top-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900">阶段进度</span>
                    <span className="text-xs text-gray-400">{stageConfig.label}</span>
                </div>
                <div className="text-xs text-gray-600 mb-3">{stageConfig.goal}</div>
                <div className="space-y-2 text-xs text-gray-700">
                    {stageConfig.checklist.map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                            <span className={clsx(
                                "inline-flex h-2 w-2 rounded-full",
                                item.done ? "bg-green-500" : "bg-gray-300"
                            )} />
                            <span className={item.done ? "text-gray-900" : "text-gray-500"}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">{stageConfig.takeaway}</div>
            </div>

            {/* Summary */}
            <div className="border border-gray-100 bg-white rounded-2xl p-4 sticky top-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-900">对话实时总结</span>
                    <span className="text-xs text-gray-400">{isSummarizing ? '更新中...' : '已同步'}</span>
                </div>

                <div className="space-y-4 text-xs text-gray-700">
                    <div>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1">产品情况</div>
                        <div className="whitespace-pre-wrap leading-relaxed">{summary.product}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1">AI 的建议</div>
                        <div className="whitespace-pre-wrap leading-relaxed">{summary.aiAdvice}</div>
                    </div>
                    <div>
                        <div className="text-[11px] font-semibold text-gray-500 mb-1">用户的评论</div>
                        <div className="whitespace-pre-wrap leading-relaxed">{summary.userNotes}</div>
                    </div>
                </div>
            </div>

            {/* Cases */}
            <div className="border border-gray-100 bg-white rounded-2xl p-4">
                <div className="text-sm font-semibold text-gray-900 mb-3">案例/对标推荐</div>
                {summary.cases.length === 0 ? (
                    <div className="text-xs text-gray-400">暂时没有推荐，聊得更具体后会补充。</div>
                ) : (
                    <div className="space-y-3 text-xs text-gray-700">
                        {summary.cases.map((item, index) => (
                            <div key={`${item.name}-${index}`} className="border-l-2 border-gray-200 pl-3">
                                <div className="font-semibold text-gray-800">{item.name}</div>
                                <div className="text-gray-500 mt-1">{item.reason}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}
