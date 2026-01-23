'use client';

import { useState } from 'react';

export default function FeedbackPage() {
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const submit = async () => {
        if (!content.trim()) {
            setStatus('error');
            setMessage('请填写意见内容');
            return;
        }
        setStatus('sending');
        setMessage('');
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, contact }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || '提交失败');
            }
            setStatus('success');
            setMessage('感谢反馈，我们会尽快联系你。');
            setContent('');
            setContact('');
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : '提交失败');
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <header className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900">把产品做得更好</h1>
                <p className="text-gray-500 mt-2">
                    你的每条反馈都会直接进入改进清单，我们会优先优化最有价值的体验。
                </p>
            </header>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <label className="text-sm text-gray-700">告诉我们：最希望改进的地方</label>
                <textarea
                    className="mt-2 w-full border rounded-lg px-3 py-2 min-h-[180px]"
                    placeholder="例如：某个功能用起来不顺手、你最想要的一个新功能、或一个困扰你的细节..."
                    value={content}
                    onChange={event => setContent(event.target.value)}
                />

                <label className="text-sm text-gray-700 mt-4 block">联系方式（邮箱或手机号，可选）</label>
                <input
                    className="mt-2 w-full border rounded-lg px-3 py-2"
                    placeholder="留下联系方式，我们可以把进展同步给你"
                    value={contact}
                    onChange={event => setContact(event.target.value)}
                />

                <button
                    type="button"
                    className="mt-6 bg-gray-900 text-white rounded-lg px-5 py-2 text-sm font-semibold"
                    onClick={submit}
                    disabled={status === 'sending'}
                >
                    {status === 'sending' ? '提交中…' : '提交反馈'}
                </button>

                {message ? (
                    <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                        {message}
                    </p>
                ) : null}
            </div>

            <div className="mt-6 text-sm text-gray-500">
                也可以直接邮件联系我：mengjie.xiao@outlook.com
            </div>
        </div>
    );
}
