'use client';

import { User } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Message } from '../types';

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

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
                        alt="产品判官"
                        className="w-5 h-5"
                    />
                )}
            </div>

            <div className={clsx(
                "p-4 rounded-2xl text-sm leading-[1.55] whitespace-normal break-words",
                isUser
                    ? "bg-black text-white rounded-tr-none"
                    : "bg-gray-100 text-gray-800 rounded-tl-none"
            )}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="pl-5 my-1 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="pl-5 my-1 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-0">{children}</li>,
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
        </div>
    );
}
