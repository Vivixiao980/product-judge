'use client';

import { ThumbsUp, ThumbsDown, Copy, Check, User } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Message } from '../types';
import { trackMessageFeedback, submitMessageFeedback } from '@/lib/tracking';
import { useState } from 'react';

interface ChatMessageProps {
    message: Message;
    currentStage?: string;
}

export function ChatMessage({ message, currentStage }: ChatMessageProps) {
    const isUser = message.role === 'user';
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
    const [comment, setComment] = useState('');
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [copied, setCopied] = useState(false);

    const sendFeedback = (vote: 'up' | 'down') => {
        if (feedback === vote) return;
        setFeedback(vote);
        trackMessageFeedback(message.id, vote, currentStage);
        setShowCommentBox(true);
    };

    const submitFeedbackComment = async () => {
        if (!feedback) return;
        await submitMessageFeedback({
            messageId: message.id,
            vote: feedback,
            comment: comment.trim(),
            stage: currentStage,
        });
        setComment('');
        setShowCommentBox(false);
    };

    const copyMessage = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch {
            // fallback: silently ignore
        }
    };

    return (
        <div
            className={clsx(
                "flex gap-4 max-w-2xl",
                isUser ? "ml-auto flex-row-reverse" : ""
            )}
        >
            <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                isUser ? "bg-black text-white" : "bg-blue-100 text-blue-600"
            )}>
                {isUser ? (
                    <User size={16} />
                ) : (
                    <img
                        src="/bot-avatar.svg"
                        alt="产品顾问"
                        className="w-5 h-5"
                    />
                )}
            </div>

            <div>
                <div className={clsx(
                    "p-4 rounded-2xl text-sm leading-[1.55] whitespace-normal break-words",
                    isUser
                        ? "bg-black text-white rounded-tr-none"
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                )}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="pl-5 my-2 list-disc space-y-1">{children}</ul>,
                            ol: ({ children, start }) => (
                                <ol className="pl-5 my-2 list-decimal space-y-1" start={start}>
                                    {children}
                                </ol>
                            ),
                            li: ({ children }) => (
                                <li className="mb-0.5">
                                    {children}
                                </li>
                            ),
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children, className }) => {
                                const isBlock = className?.includes('language-');
                                return isBlock ? (
                                    <code className="font-mono text-[0.85em]">{children}</code>
                                ) : (
                                    <code className="px-1 py-0.5 rounded bg-black/5 font-mono text-[0.85em]">
                                        {children}
                                    </code>
                                );
                            },
                            pre: ({ children }) => (
                                <pre className="p-3 rounded bg-black/5 overflow-x-auto">{children}</pre>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-2 pl-3 text-gray-500">{children}</blockquote>
                            ),
                            a: ({ children, href }) => (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-2"
                                >
                                    {children}
                                </a>
                            ),
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                </div>
                {!isUser ? (
                    <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <button
                                type="button"
                                title="有用"
                                className={clsx(
                                    "rounded-full border p-1 transition",
                                    feedback === 'up' ? "border-green-400 text-green-600" : "border-gray-200 hover:border-gray-300 hover:text-gray-600"
                                )}
                                onClick={() => sendFeedback('up')}
                            >
                                <ThumbsUp size={12} />
                            </button>
                            <button
                                type="button"
                                title="不太有用"
                                className={clsx(
                                    "rounded-full border p-1 transition",
                                    feedback === 'down' ? "border-red-400 text-red-600" : "border-gray-200 hover:border-gray-300 hover:text-gray-600"
                                )}
                                onClick={() => sendFeedback('down')}
                            >
                                <ThumbsDown size={12} />
                            </button>
                        <button
                            type="button"
                            title="复制"
                            className="rounded-full border border-gray-200 p-1 transition hover:border-gray-300 hover:text-gray-600"
                            onClick={copyMessage}
                        >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                            {feedback ? (
                                <button
                                    type="button"
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowCommentBox((prev) => !prev)}
                                >
                                    {showCommentBox ? '收起评价' : '写点评'}
                                </button>
                            ) : null}
                        </div>
                        {feedback && showCommentBox ? (
                            <div className="flex flex-col gap-2">
                                <textarea
                                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700"
                                    rows={2}
                                    placeholder="写点具体建议（可选）"
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:border-gray-300"
                                        onClick={submitFeedbackComment}
                                    >
                                        提交
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs text-gray-400 hover:text-gray-600"
                                        onClick={() => {
                                            setShowCommentBox(false);
                                            setComment('');
                                        }}
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
