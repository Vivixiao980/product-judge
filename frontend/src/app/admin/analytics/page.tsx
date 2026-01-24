'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, MessageSquare, Users, Activity, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface DailyStat {
  date: string;
  total_events: number;
  unique_sessions: number;
  page_views: number;
  messages_sent: number;
}

interface DailyIpStat {
  date: string;
  unique_ips: number;
  page_view_ips: number;
  active_ips: number;
}

interface IpRetentionStat {
  date: string;
  active_ips: number;
  retained_ips: number;
  retention_rate: number;
}

interface ChatCompletionStat {
  date: string;
  started_ips: number;
  completed_ips: number;
  completion_rate: number;
}

interface StageStat {
  stage: string;
  unique_ips: number;
  conversations: number;
}

interface FeedbackStats {
  likes: number;
  dislikes: number;
}

interface DailyConversationMetric {
  date: string;
  conversations: number;
  total_messages: number;
  avg_messages_per_conversation: number;
}

interface FeedbackItem {
  id: string;
  content: string;
  contact: string;
  source?: string;
  created_at: string;
}

interface MessageFeedbackItem {
  id: string;
  message_id: string;
  vote: string;
  comment: string;
  stage?: string;
  session_id?: string;
  ip_address?: string;
  created_at: string;
}

interface Conversation {
  id: string;
  session_id: string;
  ip_address?: string;
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
  totalUniqueIps: number;
  dailyIpStats: DailyIpStat[];
  ipRetention: IpRetentionStat[];
  chatCompletion: ChatCompletionStat[];
  stageStats: StageStat[];
  feedbackStats: FeedbackStats;
  totalConversationMessages: number;
  dailyConversationMetrics: DailyConversationMetric[];
  feedbackItems: FeedbackItem[];
  messageFeedbackItems: MessageFeedbackItem[];
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
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async (view: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin?view=${view}`);

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
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!loginRes.ok) {
        setError('密码错误或已过期');
        return;
      }
      const data = await fetchData('overview');
      if (data) {
        setIsAuthenticated(true);
        setOverview(data);
        setPassword('');
      }
    } finally {
      setIsLoading(false);
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

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((conv) =>
      conv.session_id.toLowerCase().includes(q) ||
      (conv.ip_address || '').toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // 尝试基于 cookie 自动登录
  useEffect(() => {
    if (isAuthenticated) return;
    const tryAutoLogin = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin?view=overview');
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
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setOverview(null);
    setConversations([]);
    setSelectedConversation(null);
  };

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
    const summary = selectedConversation.summary || {};
    const summaryItems = [
      { label: '产品定义', value: summary.product as string | undefined },
      { label: 'AI 建议', value: summary.aiAdvice as string | undefined },
      { label: '用户要点', value: summary.userNotes as string | undefined },
    ].filter(item => item.value);

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
                  {selectedConversation.ip_address ? (
                    <p className="text-sm text-gray-500">
                      IP: {selectedConversation.ip_address}
                    </p>
                  ) : null}
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
                {summaryItems.length ? (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">对话总结</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      {summaryItems.map(item => (
                        <div key={item.label}>
                          <span className="font-medium text-gray-700">{item.label}：</span>
                          <span className="whitespace-pre-wrap">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => activeTab === 'overview' ? loadOverview() : loadConversations()}
              disabled={isLoading}
              className="flex items-center gap-2 text-gray-600 hover:text-black"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              刷新
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-black"
            >
              退出
            </button>
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <span className="text-gray-500">总产品咨询数</span>
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
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-orange-500" size={24} />
                  <span className="text-gray-500">总独立 IP</span>
                </div>
                <p className="text-3xl font-bold">{overview.totalUniqueIps || 0}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="text-blue-500" size={24} />
                  <span className="text-gray-500">总对话量</span>
                </div>
                <p className="text-3xl font-bold">{overview.totalConversationMessages || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="text-indigo-500" size={24} />
                  <span className="text-gray-500">今日对话量</span>
                </div>
                <p className="text-3xl font-bold">{overview.dailyConversationMetrics?.[0]?.total_messages || 0}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="text-emerald-500" size={24} />
                  <span className="text-gray-500">有用反馈</span>
                </div>
                <p className="text-3xl font-bold">{overview.feedbackStats?.likes || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="text-rose-500" size={24} />
                  <span className="text-gray-500">不太有用</span>
                </div>
                <p className="text-3xl font-bold">{overview.feedbackStats?.dislikes || 0}</p>
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
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">单对话框平均对话次数</h2>
                <p className="text-sm text-gray-500 mt-1">按日统计：总消息数 / 对话框数</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">日期</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">对话框数</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">对话量</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">平均对话次数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(overview.dailyConversationMetrics || []).map((stat) => (
                      <tr key={stat.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{stat.date}</td>
                        <td className="px-6 py-4 text-sm">{stat.conversations}</td>
                        <td className="px-6 py-4 text-sm">{stat.total_messages}</td>
                        <td className="px-6 py-4 text-sm">{stat.avg_messages_per_conversation.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">IP 维度统计</h2>
                <p className="text-sm text-gray-500 mt-1">独立 IP、IP DAU 与访问 IP</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">日期</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">独立 IP</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">访问 IP</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">IP DAU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(overview.dailyIpStats || []).map((stat) => (
                      <tr key={stat.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{stat.date}</td>
                        <td className="px-6 py-4 text-sm">{stat.unique_ips}</td>
                        <td className="px-6 py-4 text-sm">{stat.page_view_ips}</td>
                        <td className="px-6 py-4 text-sm">{stat.active_ips}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">次日留存（IP）</h2>
                <p className="text-sm text-gray-500 mt-1">按 IP 计算，次日仍活跃的比例</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">日期</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">当日活跃 IP</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">次日留存 IP</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">留存率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(overview.ipRetention || []).map((stat) => (
                      <tr key={stat.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{stat.date}</td>
                        <td className="px-6 py-4 text-sm">{stat.active_ips}</td>
                        <td className="px-6 py-4 text-sm">{stat.retained_ips}</td>
                        <td className="px-6 py-4 text-sm">{(stat.retention_rate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">对话完成率（IP）</h2>
                <p className="text-sm text-gray-500 mt-1">进入聊天页并至少发送一条消息</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">日期</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">进入聊天 IP</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">发送消息 IP</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">完成率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(overview.chatCompletion || []).map((stat) => (
                      <tr key={stat.date} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{stat.date}</td>
                        <td className="px-6 py-4 text-sm">{stat.started_ips}</td>
                        <td className="px-6 py-4 text-sm">{stat.completed_ips}</td>
                        <td className="px-6 py-4 text-sm">{(stat.completion_rate * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">阶段分布（IP）</h2>
                <p className="text-sm text-gray-500 mt-1">info/深挖/多视角分析阶段的用户分布</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">阶段</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">独立 IP</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">对话数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(overview.stageStats || []).map((stat) => (
                      <tr key={stat.stage} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">
                          {stat.stage === 'info'
                            ? '信息收集'
                            : stat.stage === 'deep'
                              ? '深度追问'
                              : stat.stage === 'analysis'
                                ? '多视角分析'
                                : stat.stage || '未知'}
                        </td>
                        <td className="px-6 py-4 text-sm">{stat.unique_ips}</td>
                        <td className="px-6 py-4 text-sm">{stat.conversations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">用户反馈</h2>
                <p className="text-sm text-gray-500 mt-1">来自反馈页的留言</p>
              </div>
              <div className="divide-y">
                {(overview.feedbackItems || []).length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">暂无反馈</div>
                ) : (
                  (overview.feedbackItems || []).map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="text-sm text-gray-900 whitespace-pre-wrap">{item.content}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {item.contact ? `联系方式：${item.contact}` : '未留联系方式'} · {new Date(item.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold">消息评价</h2>
                <p className="text-sm text-gray-500 mt-1">点赞/踩 + 文字评论</p>
              </div>
              <div className="divide-y">
                {(overview.messageFeedbackItems || []).length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">暂无评价</div>
                ) : (
                  (overview.messageFeedbackItems || []).map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.vote === 'up' ? '👍 有用' : '👎 不太有用'}</span>
                        {item.stage ? <span>阶段：{item.stage}</span> : null}
                        {item.ip_address ? <span>IP：{item.ip_address}</span> : null}
                        {item.session_id ? <span>会话：{item.session_id}</span> : null}
                      </div>
                      {item.comment ? (
                        <div className="text-sm text-gray-900 mt-2 whitespace-pre-wrap">{item.comment}</div>
                      ) : (
                        <div className="text-sm text-gray-400 mt-2">（无文字评论）</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(item.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'conversations' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold">对话记录</h2>
              <p className="text-sm text-gray-500 mt-1">共 {filteredConversations.length} 条对话</p>
              <input
                className="mt-4 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="按 session_id 或 IP 搜索"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            {filteredConversations.length === 0 ? (
              <div className="p-12 text-center text-gray-500">暂无对话记录</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conv) => (
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
                        {conv.ip_address ? (
                          <p className="text-xs text-gray-400">IP: {conv.ip_address}</p>
                        ) : null}
                        {conv.summary?.product ? (
                          <p className="text-xs text-gray-500 mt-1">
                            总结：{String(conv.summary.product).slice(0, 80)}
                          </p>
                        ) : null}
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
