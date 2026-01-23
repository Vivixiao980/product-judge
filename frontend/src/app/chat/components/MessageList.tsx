'use client';

import { RefObject } from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
    messages: Message[];
    messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function MessageList({ messages, messagesEndRef }: MessageListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}
