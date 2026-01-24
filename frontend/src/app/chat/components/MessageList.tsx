'use client';

import { RefObject, useRef, useEffect, MutableRefObject } from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
    messages: Message[];
    messagesEndRef: RefObject<HTMLDivElement | null>;
    isUserScrollingRef?: MutableRefObject<boolean>;
}

export function MessageList({ messages, messagesEndRef, isUserScrollingRef }: MessageListProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isUserScrollingRef) return;

        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            // 检查用户是否在滚动（不在底部附近）
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

            // 如果用户向上滚动，标记为用户正在滚动
            if (!isNearBottom) {
                isUserScrollingRef.current = true;
            }

            // 如果用户滚动到底部附近，重置标记
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (isNearBottom) {
                    isUserScrollingRef.current = false;
                }
            }, 150);
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, [isUserScrollingRef]);

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}
