'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

interface CmsItem {
    id: string;
    title: string;
    category: string;
    content: string;
    source?: string;
    tags: string[];
    fullArticle?: string;
    status: 'pending' | 'published';
    createdAt: string;
    updatedAt: string;
}

interface UsageData {
    keyInfo: {
        label?: string;
        usage?: number;
        limit?: number;
        is_free_tier?: boolean;
        rate_limit?: {
            requests: number;
            interval: string;
        };
    };
    recentActivity?: unknown;
    timestamp: string;
}

const STATUS_LABELS: Record<CmsItem['status'], string> = {
    pending: '待发布',
    published: '已发布',
};

const EMPTY_FORM: Omit<CmsItem, 'id' | 'createdAt' | 'updatedAt'> = {
    title: '',
    category: '其他',
    content: '',
    source: '',
    tags: [],
    fullArticle: '',
    status: 'pending',
};

export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState('');
    const [items, setItems] = useState<CmsItem[]>([]);
    const [filter, setFilter] = useState<'all' | CmsItem['status']>('all');
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [bulkJson, setBulkJson] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [lastImageUrls, setLastImageUrls] = useState<string[]>([]);
    const [insertMode, setInsertMode] = useState<'cursor' | 'append'>('cursor');
    const fullArticleRef = useRef<HTMLTextAreaElement | null>(null);
    const [activeAction, setActiveAction] = useState<{ id: string; type: 'edit' | 'publish' | 'retract' } | null>(null);
    const [usageData, setUsageData] = useState<UsageData | null>(null);
    const [usageLoading, setUsageLoading] = useState(false);
    const [usageError, setUsageError] = useState('');
    const [fullscreenEdit, setFullscreenEdit] = useState(false);

    const fetchUsage = async () => {
        setUsageLoading(true);
        setUsageError('');
        try {
            const res = await fetch('/api/admin/usage');
            if (res.ok) {
                const data = await res.json();
                setUsageData(data);
            } else {
                const err = await res.json().catch(() => ({}));
                setUsageError(err.error || '获取用量失败');
            }
        } catch {
            setUsageError('获取用量失败');
        } finally {
            setUsageLoading(false);
        }
    };

    const fetchItems = async () => {
        const res = await fetch('/api/admin/sparks');
        if (res.ok) {
            const data = await res.json();
            setItems(data.items || []);
            setAuthed(true);
        } else {
            setAuthed(false);
        }
    };

    useEffect(() => {
        void fetchItems();
    }, []);

    // 登录后获取用量数据
    useEffect(() => {
        if (authed) {
            void fetchUsage();
        }
    }, [authed]);

    const filteredItems = useMemo(() => {
        if (filter === 'all') return items;
        return items.filter(item => item.status === filter);
    }, [filter, items]);

    const login = async () => {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        if (res.ok) {
            setAuthed(true);
            setPassword('');
            await fetchItems();
        } else {
            alert('密码错误');
        }
    };

    const logout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        setAuthed(false);
    };

    const submitForm = async (overrideStatus?: CmsItem['status']) => {
        const payload = {
            ...form,
            tags: form.tags.filter(Boolean),
            status: overrideStatus || form.status,
        };
        if (editingId) {
            await fetch(`/api/admin/sparks/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            await fetch('/api/admin/sparks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }
        setForm(EMPTY_FORM);
        setEditingId(null);
        await fetchItems();
    };

    const publishItem = async (id: string, status: CmsItem['status']) => {
        const type = status === 'published' ? 'publish' : 'retract';
        setActiveAction({ id, type });
        await fetch('/api/admin/sparks/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        await fetchItems();
        setActiveAction(null);
    };

    const deleteItem = async (id: string) => {
        if (!confirm('确定删除这条卡片吗？')) return;
        await fetch(`/api/admin/sparks/${id}`, { method: 'DELETE' });
        await fetchItems();
    };

    const startEdit = (item: CmsItem) => {
        setActiveAction({ id: item.id, type: 'edit' });
        setEditingId(item.id);
        setForm({
            title: item.title,
            category: item.category,
            content: item.content,
            source: item.source || '',
            tags: item.tags || [],
            fullArticle: item.fullArticle || '',
            status: item.status,
        });
        setTimeout(() => {
            setActiveAction(prev => (prev?.id === item.id && prev.type === 'edit' ? null : prev));
        }, 600);
    };

    const handleBulkImport = async () => {
        let parsed: any[];
        try {
            parsed = JSON.parse(bulkJson);
        } catch {
            alert('JSON 格式不正确');
            return;
        }
        if (!Array.isArray(parsed)) {
            alert('请提供数组格式');
            return;
        }
        for (const entry of parsed) {
            await fetch('/api/admin/sparks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: entry.title || '未命名',
                    category: entry.category || '其他',
                    content: entry.content || '',
                    source: entry.source || '',
                    tags: Array.isArray(entry.tags) ? entry.tags : [],
                    fullArticle: entry.fullArticle || '',
                    status: entry.status === 'approved' || entry.status === 'draft' ? 'pending' : (entry.status || 'pending'),
                }),
            });
        }
        setBulkJson('');
        await fetchItems();
    };

    const syncCards = async () => {
        setSyncError('');
        setSyncing(true);
        try {
            const res = await fetch('/api/admin/sparks/sync', { method: 'POST' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || '同步失败');
            }
            await fetchItems();
        } catch (error) {
            setSyncError(error instanceof Error ? error.message : '同步失败');
        } finally {
            setSyncing(false);
        }
    };

    // 批量修改分类
    const bulkUpdateCategory = async (oldCategory: string, newCategory: string) => {
        const toUpdate = items.filter(item => item.category === oldCategory);
        if (toUpdate.length === 0) {
            alert(`没有找到分类为"${oldCategory}"的卡片`);
            return;
        }
        if (!confirm(`确定将 ${toUpdate.length} 张"${oldCategory}"卡片的分类改为"${newCategory}"吗？`)) {
            return;
        }
        for (const item of toUpdate) {
            await fetch(`/api/admin/sparks/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item, category: newCategory }),
            });
        }
        await fetchItems();
        alert(`已更新 ${toUpdate.length} 张卡片`);
    };

    const insertIntoFullArticle = (text: string) => {
        setForm(prev => {
            const current = prev.fullArticle || '';
            if (insertMode === 'cursor' && fullArticleRef.current) {
                const textarea = fullArticleRef.current;
                const start = textarea.selectionStart ?? current.length;
                const end = textarea.selectionEnd ?? start;
                const next = `${current.slice(0, start)}${text}${current.slice(end)}`;
                requestAnimationFrame(() => {
                    const pos = start + text.length;
                    textarea.focus();
                    textarea.setSelectionRange(pos, pos);
                });
                return { ...prev, fullArticle: next };
            }
            const next = current ? `${current}\n\n${text}` : text;
            return { ...prev, fullArticle: next };
        });
    };

    const handleImageUpload = async (files: File[]) => {
        setUploadError('');
        setUploading(true);
        const uploaded: string[] = [];
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/admin/upload-image', {
                    method: 'POST',
                    body: formData,
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data?.error || '上传失败');
                }
                const data = await res.json();
                const url = data.url as string;
                if (url) {
                    const markdown = `![image](${url})`;
                    insertIntoFullArticle(markdown);
                    uploaded.push(url);
                }
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : '上传失败');
        } finally {
            if (uploaded.length) {
                setLastImageUrls(prev => [...uploaded, ...prev].slice(0, 5));
            }
            setUploading(false);
        }
    };

    if (!authed) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h1 className="text-xl font-semibold text-gray-900 mb-4">Sparks 管理后台</h1>
                    <label className="text-sm text-gray-600">管理员密码</label>
                    <input
                        type="password"
                        className="mt-2 w-full border rounded-lg px-3 py-2"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                    />
                    <button
                        onClick={login}
                        className="mt-4 w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-semibold"
                    >
                        登录
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Sparks 管理后台</h1>
                    <p className="text-sm text-gray-500">上传、编辑、发布</p>
                </div>
                <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">
                    退出登录
                </button>
            </header>

            {/* AI API 用量监控 */}
            <section className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">AI API 用量</h2>
                    </div>
                    <button
                        onClick={fetchUsage}
                        disabled={usageLoading}
                        className="text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50"
                    >
                        {usageLoading ? '刷新中...' : '刷新'}
                    </button>
                </div>

                {usageError && (
                    <div className="text-sm text-red-500 mb-4">{usageError}</div>
                )}

                {usageData ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-purple-100">
                            <div className="text-xs text-gray-500 mb-1">服务商</div>
                            <div className="text-sm font-semibold text-gray-900">OpenRouter</div>
                            <div className="text-xs text-gray-400 mt-1">Claude 3.5 Sonnet</div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-purple-100">
                            <div className="text-xs text-gray-500 mb-1">API Key</div>
                            <div className="text-sm font-semibold text-gray-900">
                                {usageData.keyInfo.label || '默认'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                {usageData.keyInfo.is_free_tier ? '免费版' : '付费版'}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-purple-100">
                            <div className="text-xs text-gray-500 mb-1">已用额度</div>
                            <div className="text-sm font-semibold text-gray-900">
                                ${(usageData.keyInfo.usage || 0).toFixed(4)}
                            </div>
                            {usageData.keyInfo.limit && usageData.keyInfo.limit > 0 && (
                                <div className="mt-2">
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 rounded-full"
                                            style={{
                                                width: `${Math.min(100, ((usageData.keyInfo.usage || 0) / usageData.keyInfo.limit) * 100)}%`
                                            }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        限额 ${usageData.keyInfo.limit}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-purple-100">
                            <div className="text-xs text-gray-500 mb-1">速率限制</div>
                            <div className="text-sm font-semibold text-gray-900">
                                {usageData.keyInfo.rate_limit?.requests || '-'} 次
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                / {usageData.keyInfo.rate_limit?.interval || '-'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">
                        {usageLoading ? '加载中...' : '点击刷新获取用量数据'}
                    </div>
                )}

                {usageData && (
                    <div className="mt-4 text-xs text-gray-400">
                        更新时间: {new Date(usageData.timestamp).toLocaleString('zh-CN')}
                    </div>
                )}
            </section>

            <section className="grid lg:grid-cols-[1fr_320px] gap-6 mb-10">
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">新建 / 编辑卡片</h2>
                    <div className="grid gap-3">
                        <input
                            className="border rounded-lg px-3 py-2"
                            placeholder="标题"
                            value={form.title}
                            onChange={event => setForm({ ...form, title: event.target.value })}
                        />
                        <input
                            className="border rounded-lg px-3 py-2"
                            placeholder="分类"
                            value={form.category}
                            onChange={event => setForm({ ...form, category: event.target.value })}
                        />
                        <input
                            className="border rounded-lg px-3 py-2"
                            placeholder="来源（可空）"
                            value={form.source}
                            onChange={event => setForm({ ...form, source: event.target.value })}
                        />
                        <input
                            className="border rounded-lg px-3 py-2"
                            placeholder="标签（用逗号分隔）"
                            value={form.tags.join(',')}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean),
                                })
                            }
                        />
                        <textarea
                            className="border rounded-lg px-3 py-2 min-h-[100px]"
                            placeholder="一句话总结"
                            value={form.content}
                            onChange={event => setForm({ ...form, content: event.target.value })}
                        />
                        <div className="relative">
                            <textarea
                                className="border rounded-lg px-3 py-2 min-h-[160px] w-full pr-10"
                                placeholder="全文（可选）"
                                value={form.fullArticle}
                                onChange={event => setForm({ ...form, fullArticle: event.target.value })}
                                ref={fullArticleRef}
                            />
                            <button
                                type="button"
                                onClick={() => setFullscreenEdit(true)}
                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                title="全屏编辑"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div className="border rounded-lg px-3 py-3">
                            <div className="text-sm text-gray-600 mb-2">上传图片（支持多张，插入到全文）</div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-500">插入位置</span>
                                {(['cursor', 'append'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setInsertMode(mode)}
                                        className={`text-xs px-2 py-1 rounded-full border ${
                                            insertMode === mode
                                                ? 'bg-gray-900 text-white border-gray-900'
                                                : 'border-gray-200 text-gray-600'
                                        }`}
                                    >
                                        {mode === 'cursor' ? '光标处' : '末尾追加'}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={uploading}
                                onChange={(event) => {
                                    const fileList = event.target.files;
                                    if (fileList && fileList.length) void handleImageUpload(Array.from(fileList));
                                    event.currentTarget.value = '';
                                }}
                            />
                            {uploading ? (
                                <p className="text-xs text-gray-500 mt-2">上传中…</p>
                            ) : null}
                            {uploadError ? (
                                <p className="text-xs text-red-500 mt-2">{uploadError}</p>
                            ) : null}
                            {lastImageUrls.length ? (
                                <div className="mt-2 text-xs text-gray-500">
                                    最近插入:
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {lastImageUrls.map(url => (
                                            <span key={url} className="px-2 py-1 bg-gray-100 rounded">
                                                已上传
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <select
                            className="border rounded-lg px-3 py-2"
                            value={form.status}
                            onChange={event => setForm({ ...form, status: event.target.value as CmsItem['status'] })}
                        >
                            <option value="pending">待发布</option>
                            <option value="published">已发布</option>
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => submitForm()}
                                className="bg-gray-900 text-white rounded-lg py-2 text-sm font-semibold"
                            >
                                {editingId ? '保存修改' : '创建卡片'}
                            </button>
                            <button
                                onClick={() => submitForm('published')}
                                className="border border-gray-900 text-gray-900 rounded-lg py-2 text-sm font-semibold"
                            >
                                {editingId ? '保存并发布' : '创建并发布'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">批量导入</h2>
                    <textarea
                        className="border rounded-lg px-3 py-2 min-h-[200px] w-full"
                        placeholder='JSON 数组格式，例如：[{"title":"...","content":"..."}]'
                        value={bulkJson}
                        onChange={event => setBulkJson(event.target.value)}
                    />
                    <button
                        type="button"
                        onClick={handleBulkImport}
                        className="mt-3 w-full border border-gray-200 rounded-lg py-2 text-sm"
                    >
                        导入
                    </button>
                    <button
                        type="button"
                        onClick={syncCards}
                        className="mt-3 w-full border border-gray-200 rounded-lg py-2 text-sm"
                        disabled={syncing}
                    >
                        {syncing ? '同步中…' : '同步待发布 + 已发布'}
                    </button>
                    {syncError ? (
                        <p className="mt-2 text-xs text-red-500">{syncError}</p>
                    ) : null}

                    <div className="mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-600 mb-2">快捷操作</div>
                        <button
                            type="button"
                            onClick={() => bulkUpdateCategory('组织进化论', '产品沉思录')}
                            className="w-full border border-amber-200 text-amber-700 bg-amber-50 rounded-lg py-2 text-sm hover:bg-amber-100"
                        >
                            组织进化论 → 产品沉思录
                        </button>
                    </div>
                </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold">卡片列表</h2>
                    <div className="flex gap-2">
                        {['all', 'pending', 'published'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status as any)}
                                className={`px-3 py-1.5 text-xs rounded-full border ${
                                    filter === status
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'border-gray-200 text-gray-600'
                                }`}
                            >
                                {status === 'all' ? '全部' : STATUS_LABELS[status as CmsItem['status']]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y">
                    {filteredItems.map(item => (
                        <div key={item.id} className="py-4 flex flex-col lg:flex-row lg:items-center gap-3">
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                                <div className="text-xs text-gray-500 mt-1">{item.content}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {item.category} · {item.source || '无来源'} · {STATUS_LABELS[item.status]}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                {item.status === 'pending' && (
                                    <>
                                        <button
                                            type="button"
                                            className={`border border-gray-200 rounded-full px-3 py-1 transition ${
                                                activeAction?.id === item.id && activeAction.type === 'edit'
                                                    ? 'ring-2 ring-gray-400 bg-gray-100'
                                                    : 'hover:border-gray-400'
                                            }`}
                                            onClick={() => startEdit(item)}
                                        >
                                            编辑
                                        </button>
                                        <button
                                            type="button"
                                            className={`border border-gray-200 rounded-full px-3 py-1 transition ${
                                                activeAction?.id === item.id && activeAction.type === 'publish'
                                                    ? 'ring-2 ring-green-400 bg-green-50'
                                                    : 'hover:border-gray-400'
                                            }`}
                                            onClick={() => publishItem(item.id, 'published')}
                                            disabled={activeAction?.id === item.id && activeAction.type === 'publish'}
                                        >
                                            发布
                                        </button>
                                    </>
                                )}
                                {item.status === 'published' && (
                                    <>
                                        <button
                                            type="button"
                                            className={`border border-gray-200 rounded-full px-3 py-1 transition ${
                                                activeAction?.id === item.id && activeAction.type === 'edit'
                                                    ? 'ring-2 ring-gray-400 bg-gray-100'
                                                    : 'hover:border-gray-400'
                                            }`}
                                            onClick={() => startEdit(item)}
                                        >
                                            编辑
                                        </button>
                                        <button
                                            type="button"
                                            className={`border border-gray-200 rounded-full px-3 py-1 transition ${
                                                activeAction?.id === item.id && activeAction.type === 'retract'
                                                    ? 'ring-2 ring-amber-400 bg-amber-50'
                                                    : 'hover:border-gray-400'
                                            }`}
                                            onClick={() => publishItem(item.id, 'pending')}
                                            disabled={activeAction?.id === item.id && activeAction.type === 'retract'}
                                        >
                                            撤回到待发布
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="border border-red-200 text-red-500 rounded-full px-3 py-1"
                                    onClick={() => deleteItem(item.id)}
                                >
                                    删除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 全屏编辑模态框 */}
            {fullscreenEdit && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold">全文编辑</h3>
                            <button
                                type="button"
                                onClick={() => setFullscreenEdit(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 overflow-hidden">
                            <textarea
                                className="w-full h-full border rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
                                placeholder="全文内容..."
                                value={form.fullArticle}
                                onChange={event => setForm({ ...form, fullArticle: event.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setFullscreenEdit(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={() => setFullscreenEdit(false)}
                                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg"
                            >
                                完成
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
