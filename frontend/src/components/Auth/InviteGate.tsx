'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Lock } from 'lucide-react';

const INVITE_CODE = process.env.NEXT_PUBLIC_INVITE_CODE || 'productthink';
const STORAGE_KEY = 'invite_verified';

interface InviteGateProps {
  children: ReactNode;
}

export default function InviteGate({ children }: InviteGateProps) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const verified = localStorage.getItem(STORAGE_KEY);
    setIsVerified(verified === 'true');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toLowerCase() === INVITE_CODE.toLowerCase()) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsVerified(true);
      setError('');
    } else {
      setError('邀请码不正确，请重试');
    }
  };

  // 加载中
  if (isVerified === null) {
    return null;
  }

  // 已验证
  if (isVerified) {
    return <>{children}</>;
  }

  // 未验证，显示输入框
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">内测邀请</h1>
          <p className="text-gray-500">请输入邀请码以访问深度对话功能</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="请输入邀请码"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-center text-lg"
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            验证
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          没有邀请码？可以先去 <a href="/explore" className="text-black underline">灵感火花</a> 看看
        </p>
      </div>
    </div>
  );
}
