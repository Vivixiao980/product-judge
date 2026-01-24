import Link from 'next/link';
import { MessageSquare, Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center max-w-4xl mx-auto">
      <div className="mb-8 p-3 bg-gray-100/50 rounded-2xl border border-gray-100">
        <Sparkles className="w-8 h-8 text-black" />
      </div>

      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
        打磨你的产品思维
      </h1>

      <p className="text-xl text-gray-500 mb-12 max-w-2xl leading-relaxed">
        用 AI 产品顾问挑战你的想法，或从全球顶尖产品领袖的智慧中获取灵感。
      </p>

      <div className="grid md:grid-cols-2 gap-4 w-full max-w-lg">
        <Link
          href="/chat"
          className="group relative flex flex-col items-start p-6 rounded-2xl border border-gray-200 hover:border-black transition-all hover:shadow-lg bg-white"
        >
          <div className="mb-4 bg-black text-white p-2.5 rounded-lg">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center w-full justify-between">
            深度对话
            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
          </h3>
          <p className="text-sm text-gray-500 text-left">
            通过灵魂拷问，验证你的产品战略
          </p>
        </Link>

        <Link
          href="/explore"
          className="group relative flex flex-col items-start p-6 rounded-2xl border border-gray-200 hover:border-blue-600 transition-all hover:shadow-lg bg-white"
        >
          <div className="mb-4 bg-blue-50 text-blue-600 p-2.5 rounded-lg">
            <Sparkles size={20} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center w-full justify-between group-hover:text-blue-600 transition-colors">
            灵感火花
            <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
          </h3>
          <p className="text-sm text-gray-500 text-left">
            来自 Lenny&apos;s Podcast 的精华心智模型
          </p>
        </Link>
      </div>
    </div>
  );
}
