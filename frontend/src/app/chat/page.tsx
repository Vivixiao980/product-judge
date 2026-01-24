'use client';

import { useChat } from './useChat';
import { PhaseIndicator, MessageList, ChatInput, Sidebar } from './components';

export default function ChatPage() {
    const {
        input,
        setInput,
        isLoading,
        isSummarizing,
        messages,
        summary,
        messagesEndRef,
        isUserScrollingRef,
        currentStage,
        stageConfig,
        handleSend,
        handleQuickSend,
    } = useChat();

    return (
        <div className="h-[calc(100vh-64px)] w-full">
            <div className="grid h-full max-w-6xl mx-auto w-full lg:grid-cols-[1fr_320px] gap-6 px-4">
                <div className="flex flex-col">
                    <PhaseIndicator currentStage={currentStage} />
                    <MessageList
                        messages={messages}
                        messagesEndRef={messagesEndRef}
                        isUserScrollingRef={isUserScrollingRef}
                    />
                    <ChatInput
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        onSend={handleSend}
                        onQuickSend={handleQuickSend}
                    />
                </div>
                <Sidebar
                    stageConfig={stageConfig}
                    summary={summary}
                    isSummarizing={isSummarizing}
                />
            </div>
        </div>
    );
}
