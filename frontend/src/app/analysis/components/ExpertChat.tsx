'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ExpertAnalysis } from '../types';
import { getExpertById } from '@/data/experts';

interface ExpertChatProps {
  analysis: ExpertAnalysis;
}

export function ExpertChat({ analysis }: ExpertChatProps) {
  const expert = getExpertById(analysis.expertId);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysis.status === 'analyzing' && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [analysis.analysis, analysis.status]);

  if (!expert) return null;

  const statusIcon = {
    pending: <div className="w-5 h-5 rounded-full bg-gray-200" />,
    analyzing: <Loader2 size={20} className="text-blue-500 animate-spin" />,
    completed: <CheckCircle size={20} className="text-green-500" />,
    error: <AlertCircle size={20} className="text-red-500" />,
  };

  const displayText = analysis.analysis
    ? analysis.analysis.replace(/```json[\s\S]*?```/g, '').trim()
    : '';

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all ${
      analysis.status === 'pending' ? 'opacity-50' : ''
    }`}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: expert.color }}
          >
            {expert.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold">{expert.name}</h3>
            <p className="text-sm text-gray-500">{expert.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {analysis.status === 'completed' && analysis.score > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-bold">{analysis.score.toFixed(1)}</span>
              <span className="text-gray-400">/10</span>
            </div>
          )}
          {statusIcon[analysis.status]}
        </div>
      </div>

      {/* 内容 */}
      <div ref={contentRef} className="p-4 max-h-96 overflow-y-auto">
        {analysis.status === 'pending' && (
          <p className="text-gray-400 text-center py-8">等待分析...</p>
        )}

        {analysis.status === 'error' && (
          <p className="text-red-500 text-center py-8">分析失败，请重试</p>
        )}

        {(analysis.status === 'analyzing' || analysis.status === 'completed') && (
          <div className="prose prose-sm max-w-none prose-pre:whitespace-pre-wrap prose-pre:break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                pre: ({ children }) => (
                  <pre className="whitespace-pre-wrap break-words overflow-x-auto bg-black/5 p-3 rounded">
                    {children}
                  </pre>
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <code className="font-mono text-[0.85em] whitespace-pre-wrap break-words">
                      {children}
                    </code>
                  ) : (
                    <code className="px-1 py-0.5 rounded bg-black/5 font-mono text-[0.85em]">
                      {children}
                    </code>
                  );
                },
              }}
            >
              {displayText || '正在思考中...'}
            </ReactMarkdown>
          </div>
        )}

        {/* 结构化结果 */}
        {analysis.status === 'completed' && (
          <div className="mt-4 space-y-3">
            {analysis.strengths.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-700 mb-2">✅ 优势</h4>
                <ul className="text-sm text-green-600 space-y-1">
                  {analysis.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.risks.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-yellow-700 mb-2">⚠️ 风险</h4>
                <ul className="text-sm text-yellow-600 space-y-1">
                  {analysis.risks.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.suggestions.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-700 mb-2">💡 建议</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
