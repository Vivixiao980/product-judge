'use client';

import { useRef, useState } from 'react';
import { Download, Share2, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { ExpertAnalysis, USER_GOALS, UserGoal } from '../types';
import { getExpertById } from '@/data/experts';
import { Summary } from '@/app/chat/types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReportViewProps {
  summary: Summary;
  analyses: ExpertAnalysis[];
  userGoal?: UserGoal;
  onBack: () => void;
  onContinueChat: () => void;
}

export function ReportView({ summary, analyses, userGoal = 'validate', onBack, onContinueChat }: ReportViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const completedAnalyses = analyses.filter((a) => a.status === 'completed');
  const overallScore =
    completedAnalyses.length > 0
      ? completedAnalyses.reduce((sum, a) => sum + a.score, 0) / completedAnalyses.length
      : 0;

  const stripJsonBlocks = (raw: string) => {
    if (!raw) return '';
    let cleaned = raw.replace(/```json[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
    cleaned = cleaned.replace(/\{[\s\S]*"score"[\s\S]*\}/g, '');
    return cleaned.trim();
  };

  // 汇总所有优势、风险、建议、行动项
  const allStrengths = [...new Set(completedAnalyses.flatMap((a) => a.strengths))];
  const allRisks = [...new Set(completedAnalyses.flatMap((a) => a.risks))];
  const allSuggestions = [...new Set(completedAnalyses.flatMap((a) => a.suggestions))];
  const allActionItems = [...new Set(completedAnalyses.flatMap((a) => a.actionItems || []))];

  // 获取当前目标信息
  const currentGoal = USER_GOALS.find(g => g.id === userGoal);

  const handleDownloadPDF = async () => {
    if (!reportRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      // 临时隐藏底部操作栏
      const actionBar = reportRef.current.querySelector('[data-action-bar]') as HTMLElement;
      if (actionBar) actionBar.style.display = 'none';

      // 临时增加底部留白，减少分页截断
      const previousPadding = reportRef.current.style.paddingBottom;
      reportRef.current.style.paddingBottom = '32px';

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f9fafb',
      });

      reportRef.current.style.paddingBottom = previousPadding;

      // 恢复底部操作栏
      if (actionBar) actionBar.style.display = '';

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const headerHeight = 12;
      const footerHeight = 10;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2 - headerHeight - footerHeight;

      const pxPerMm = canvas.width / usableWidth;
      const pageHeightPx = Math.floor(usableHeight * pxPerMm);
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      const logoUrl = '/bot-avatar.svg';
      const logoData = await fetch(logoUrl)
        .then((res) => res.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('logo load failed'));
              reader.readAsDataURL(blob);
            })
        )
        .catch(() => '');

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        if (pageIndex > 0) pdf.addPage();

        const sourceY = pageIndex * pageHeightPx;
        const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight
          );
        }

        const pageImg = pageCanvas.toDataURL('image/png');
        const imgHeight = (sourceHeight / pxPerMm);
        const contentY = margin + headerHeight;

        // 页眉
        if (logoData) {
          pdf.addImage(logoData, 'PNG', margin, margin, 8, 8);
          pdf.setFontSize(10);
          pdf.setTextColor(40);
          pdf.text('ProductThink 报告', margin + 12, margin + 6);
        }

        // 内容
        pdf.addImage(pageImg, 'PNG', margin, contentY, usableWidth, imgHeight);

        // 页脚
        const footerY = pageHeight - margin - 3;
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.textWithLink('productthink.vivi.wiki', margin, footerY, { url: 'https://productthink.vivi.wiki' });
        pdf.text(`${pageIndex + 1} / ${totalPages}`, pageWidth - margin - 10, footerY, { align: 'right' });
      }

      const fallbackName = `ProductThink报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`;
      const productName = summary?.product
        ? summary.product.split('\n').find(Boolean)?.replace(/[\\/:*?"<>|]/g, '').slice(0, 20)
        : '';
      const fileName = `${productName || fallbackName}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF 生成失败:', error);
      alert('PDF 生成失败，请重试');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShare = async () => {
    // TODO: 实现分享功能
    if (navigator.share) {
      await navigator.share({
        title: 'ProductThink 产品诊断报告',
        text: `综合评分: ${overallScore.toFixed(1)}/10`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  const getScoreColor = () => 'text-gray-900';

  return (
    <div ref={reportRef} className="max-w-4xl mx-auto px-4 md:px-6">
      {/* 报告头部 */}
      <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl p-8 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <img src="/bot-avatar.svg" alt="ProductThink" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ProductThink 产品诊断报告</h1>
            <p className="text-gray-500 mt-1">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="分享"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="下载 PDF"
            >
              {isGeneratingPDF ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            </button>
          </div>
        </div>

        {/* 用户目标 */}
        {currentGoal && (
          <div className="bg-gray-100 rounded-xl px-4 py-2 mb-6 inline-flex items-center gap-2 text-gray-700">
            <span className="text-xl">{currentGoal.icon}</span>
            <span className="text-sm">目标：{currentGoal.label}</span>
          </div>
        )}

        {/* 综合评分 */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">
              {overallScore.toFixed(1)}
            </div>
            <div className="text-gray-500 text-sm mt-1">综合评分</div>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all bg-gray-900"
                style={{ width: `${overallScore * 10}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </div>

      {/* 本周行动 - 新增重点板块 */}
      {allActionItems.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={24} className="text-gray-900" />
            <h2 className="text-xl font-bold">本周行动清单</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            根据你的目标「{currentGoal?.label}」，专家们建议你本周优先执行以下行动：
          </p>
          <div className="space-y-3">
            {allActionItems.slice(0, 5).map((item, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xl p-4 flex items-start gap-3"
              >
                <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-gray-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 产品概要 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-4">产品概要</h2>
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-gray-700 whitespace-pre-wrap">{summary.product || '暂无产品描述'}</p>
        </div>
      </div>

      {/* 访问链接 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-2">继续体验 ProductThink</h2>
        <p className="text-sm text-gray-600">
          点击进入：<span className="font-medium">productthink.vivi.wiki</span>
        </p>
      </div>

      {/* 专家评分 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-4">专家评分</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {completedAnalyses.map((analysis) => {
            const expert = getExpertById(analysis.expertId);
            if (!expert) return null;

            return (
              <div key={analysis.expertId} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: expert.color }}
                  >
                    {expert.name.charAt(0)}
                  </div>
                  <span className="font-medium">{expert.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-900"
                      style={{ width: `${analysis.score * 10}%` }}
                    />
                  </div>
                  <span className={`font-bold ${getScoreColor()}`}>
                    {analysis.score.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 核心洞察 */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* 优势 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">核心优势</h3>
          <ul className="space-y-2">
            {allStrengths.slice(0, 5).map((s, i) => (
              <li key={i} className="text-sm text-gray-700">
                • {s}
              </li>
            ))}
          </ul>
        </div>

        {/* 风险 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">主要风险</h3>
          <ul className="space-y-2">
            {allRisks.slice(0, 5).map((r, i) => (
              <li key={i} className="text-sm text-gray-700">
                • {r}
              </li>
            ))}
          </ul>
        </div>

        {/* 建议 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4">策略建议</h3>
          <ul className="space-y-2">
            {allSuggestions.slice(0, 5).map((s, i) => (
              <li key={i} className="text-sm text-gray-700">
                {i + 1}. {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 详细分析 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-4">详细分析</h2>
        <div className="space-y-6">
          {completedAnalyses.map((analysis) => {
            const expert = getExpertById(analysis.expertId);
            if (!expert) return null;

            return (
              <div key={analysis.expertId} className="border-b border-gray-100 pb-6 last:border-0">
                <div className="flex items-center gap-3 mb-3">
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
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-gray-400">★</span>
                    <span className="font-bold">{analysis.score.toFixed(1)}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {stripJsonBlocks(analysis.analysis)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部操作 */}
      <div data-action-bar className="sticky bottom-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-black transition-colors"
          >
            重新分析
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {isGeneratingPDF ? '生成中...' : '下载 PDF'}
            </button>
            <button
              onClick={onContinueChat}
              className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <MessageSquare size={18} />
              继续对话
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
