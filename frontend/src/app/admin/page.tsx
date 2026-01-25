'use client';

import { useEffect, useMemo, useState } from 'react';

interface CmsItem {
    id: string;
    title: string;
    category: string;
    content: string;
    source?: string;
    tags: string[];
    fullArticle?: string;
    status: 'draft' | 'pending' | 'published';
    createdAt: string;
    updatedAt: string;
}

const STATUS_LABELS: Record<CmsItem['status'], string> = {
    draft: '草稿',
    pending: '待审核',
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
    const [lastImageUrl, setLastImageUrl] = useState('');
    const [activeAction, setActiveAction] = useState<{ id: string; type: 'edit' | 'publish' | 'retract' } | null>(null);

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

    const submitForm = async () => {
        const payload = {
            ...form,
            tags: form.tags.filter(Boolean),
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
            status: entry.status === 'approved' ? 'pending' : (entry.status || 'pending'),
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

    const handleImageUpload = async (file: File) => {
        setUploadError('');
        setUploading(true);
        try {
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
                setForm(prev => ({
                    ...prev,
                    fullArticle: prev.fullArticle ? `${prev.fullArticle}\n\n${markdown}` : markdown,
                }));
                setLastImageUrl(url);
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : '上传失败');
        } finally {
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
                    <p className="text-sm text-gray-500">上传、编辑、审核、发布</p>
                </div>
                <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">
                    退出登录
                </button>
            </header>

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
                        <textarea
                            className="border rounded-lg px-3 py-2 min-h-[160px]"
                            placeholder="全文（可选）"
                            value={form.fullArticle}
                            onChange={event => setForm({ ...form, fullArticle: event.target.value })}
                        />
                        <div className="border rounded-lg px-3 py-3">
                            <div className="text-sm text-gray-600 mb-2">上传图片（将插入到全文）</div>
                            <input
                                type="file"
                                accept="image/*"
                                disabled={uploading}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) void handleImageUpload(file);
                                    event.currentTarget.value = '';
                                }}
                            />
                            {uploading ? (
                                <p className="text-xs text-gray-500 mt-2">上传中…</p>
                            ) : null}
                            {uploadError ? (
                                <p className="text-xs text-red-500 mt-2">{uploadError}</p>
                            ) : null}
                            {lastImageUrl ? (
                                <p className="text-xs text-gray-500 mt-2">已插入图片链接</p>
                            ) : null}
                        </div>
                        <select
                            className="border rounded-lg px-3 py-2"
                            value={form.status}
                            onChange={event => setForm({ ...form, status: event.target.value as CmsItem['status'] })}
                        >
                            <option value="draft">草稿</option>
                            <option value="pending">待审核</option>
                            <option value="published">已发布</option>
                        </select>
                        <button
                            onClick={submitForm}
                            className="bg-gray-900 text-white rounded-lg py-2 text-sm font-semibold"
                        >
                            {editingId ? '保存修改' : '创建卡片'}
                        </button>
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
                        {syncing ? '同步中…' : '同步待审核 + 已发布'}
                    </button>
                    {syncError ? (
                        <p className="mt-2 text-xs text-red-500">{syncError}</p>
                    ) : null}
                </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold">卡片列表</h2>
                    <div className="flex gap-2">
                        {['all', 'draft', 'pending', 'published'].map(status => (
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
                                {(item.status === 'draft' || item.status === 'pending') && (
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
                                            撤回到待审核
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
        </div>
    );
}
