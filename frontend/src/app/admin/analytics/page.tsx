'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MessageSquare, Users, Activity, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface DailyStat {
  date: string;
  total_events: number;
  unique_sessions: number;
  page_views: number;
  messages_sent: number;
}

interface Conversation {
  id: string;
  session_id: string;
  messages: Array<{ role: string; content: string }>;
  summary: Record<string, unknown>;
  stage: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface Overview {
  totalEvents: number;
  totalConversations: number;
  dailyStats: DailyStat[];
}

export default function AnalyticsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations'>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const fetchData = useCallback(async (view: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin?view=${view}`, {
        headers: { Authorization: `Bearer ${password}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          setError('密码错误或已过期');
          return null;
        }
        throw new Error('请求失败');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await fetchData('overview');
    if (data) {
      setIsAuthenticated(true);
      setOverview(data);
      localStorage.setItem('admin_password', password);
    }
  };

  const loadOverview = useCallback(async () => {
    const data = await fetchData('overview');
    if (data) setOverview(data);
  }, [fetchData]);

  const loadConversations = useCallback(async () => {
    const data = await fetchData('conversations');
    if (data) setConversations(data.conversations || []);
  }, [fetchData]);

  const viewConversation = async (id: string) => {
    const data = await fetchData(`conversation&id=${id}`);
    if (data) setSelectedConversation(data.conversation);
  };

  // 尝试自动登录（从 localStorage 恢复）
  useEffect(() => {
    const savedPassword = localStorage.getItem('admin_password');
    if (savedPassword && !isAuthenticated) {
      setPassword(savedPassword);
      // 使用保存的密码尝试登录
      const tryAutoLogin = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/admin?view=overview', {
            headers: { Authorization: `Bearer ${savedPassword}` },
          });
          if (response.ok) {
            const data = await response.json();
            setIsAuthenticated(true);
            setOverview(data);
          }
        } catch {
          // 自动登录失败，用户需要手动登录
        } finally {
          setIsLoading(false);
        }
      };
      tryAutoLogin();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'overview') {
      loadOverview();
    } else if (isAuthenticated && activeTab === 'conversations') {
      loadConversations();
    }
  }, [isAuthenticated, activeTab, loadOverview, loadConversations]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">数据分析后台</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理密码"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-black text-white py-3 rounded-lg disabled:opacity-50"
            >
              {isLoading ? '验证中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setSelectedConversation(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
          >
            <ArrowLeft size={20} />
            返回列表
          </button>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">对话详情</h2>
                <p className="text-sm text-gray-500 mt-1">
                  会话 ID: {selectedConversation.session_id}
                </p>
                <p className="text-sm text-gray-500">
                  创建时间: {new Date(selectedConversation.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                selectedConversation.stage === 'analysis' ? 'bg-green-100 text-green-700' :
                selectedConversation.stage === 'deep' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {selectedConversation.stage === 'analysis' ? '多视角分析' :
                 selectedConversation.stage === 'deep' ? '深度追问' : '信息收集'}
              </span>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedConversation.messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    msg.role === 'user' ? 'bg-black text-white ml-12' : 'bg-gray-100 mr-12'
                  }`}
                >
                  <p className="text-xs opacity-60 mb-1">
                    {msg.role === 'user' ? '用户' : 'AI'}
                  </p>
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-black">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold">数据分析</h1>
          </div>
          <button
            onClick={() => activeTab === 'overview' ? loadOverview() : loadConversations()}
            disabled={isLoading}
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>
      </div>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 border-b-2 ${
                activeTab === 'overview' ? 'border-black text-black' : 'border-transparent text-gray-500'
              }`}
            >
              数据概览
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`py-4 border-b-2 ${
                activeTab === 'conversations' ? 'border-black text-black' : 'border-transparent text-gray-500'
              }`}
            >
              对话记录
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="text-blue-500" size={24} />
                  <span className="text-gray-500">总事件数</span>
                </div>
                <p className="text-3xl font-bold">{overview.totalEvents}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="text-green-500" size={24} />
                  <span className="text-gray-500">总对话数</span>
                </div>
                <p className="text-3xl font-bold">{overview.totalConversations}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-purple-500" size={24} />
                  <span className="text-gray-500">今日会话</span>
                </div>
                <p className="text-3xl font-bold">{overview.dailyStats[0]?.unique_sessions || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">每日统计</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">日期</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">独立会话</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">页面访问</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">消息发送</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">总事件</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {overview.dailyStats.map((stat) => (
                      <tr key={stat.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{stat.date}</td>
                        <td className="px-6 py-4 text-sm">{stat.unique_sessions}</td>
                        <td className="px-6 py-4 text-sm">{stat.page_views}</td>
                        <td className="px-6 py-4 text-sm">{stat.messages_sent}</td>
                        <td className="px-6 py-4 text-sm">{stat.total_events}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'conversations' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold">对话记录</h2>
              <p className="text-sm text-gray-500 mt-1">共 {conversations.length} 条对话</p>
            </div>
            {conversations.length === 0 ? (
              <div className="p-12 text-center text-gray-500">暂无对话记录</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => viewConversation(conv.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            conv.stage === 'analysis' ? 'bg-green-100 text-green-700' :
                            conv.stage === 'deep' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {conv.stage === 'analysis' ? '多视角分析' :
                             conv.stage === 'deep' ? '深度追问' : '信息收集'}
                          </span>
                          <span className="text-sm text-gray-500">{conv.message_count} 条消息</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.messages[1]?.content || '无内容'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conv.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <Eye size={20} className="text-gray-400 ml-4 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
