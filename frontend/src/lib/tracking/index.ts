'use client';

import { TrackEvent, TRACK_EVENTS } from './types';

// 生成或获取会话 ID（同一次访问使用同一个 ID）
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('track_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('track_session_id', sessionId);
  }
  return sessionId;
};

// 核心埋点函数
export async function track(event: string, data?: Record<string, unknown>): Promise<void> {
  try {
    const payload: TrackEvent = {
      event,
      data: data || {},
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
    };

    // 发送到埋点 API
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
      }),
    });
  } catch (error) {
    // 埋点失败不应影响用户体验，静默处理
    console.warn('[Track] Failed to send event:', event, error);
  }
}

// 便捷方法：页面访问
export function trackPageView(pageName: string, extra?: Record<string, unknown>) {
  track(TRACK_EVENTS.PAGE_VIEW, { page: pageName, ...extra });
}

// 便捷方法：对话开始
export function trackChatStart() {
  track(TRACK_EVENTS.CHAT_START);
}

// 便捷方法：发送消息
export function trackMessageSent(messageLength: number, stage: string) {
  track(TRACK_EVENTS.MESSAGE_SENT, { messageLength, stage });
}

// 便捷方法：收到回复
export function trackMessageReceived(responseLength: number, stage: string) {
  track(TRACK_EVENTS.MESSAGE_RECEIVED, { responseLength, stage });
}

// 便捷方法：消息反馈
export function trackMessageFeedback(messageId: string, vote: 'up' | 'down', stage?: string) {
  track(TRACK_EVENTS.MESSAGE_FEEDBACK, { messageId, vote, stage });
}

export async function submitMessageFeedback(payload: {
  messageId: string;
  vote: 'up' | 'down';
  comment?: string;
  stage?: string;
}): Promise<void> {
  try {
    await fetch('/api/message-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
      }),
    });
  } catch (error) {
    console.warn('[Feedback] Failed to submit message feedback', error);
  }
}

// 便捷方法：阶段切换
export function trackStageChange(fromStage: string, toStage: string) {
  track(TRACK_EVENTS.STAGE_CHANGE, { from: fromStage, to: toStage });
}

// 便捷方法：快捷操作点击
export function trackQuickAction(action: string) {
  track(TRACK_EVENTS.QUICK_ACTION_CLICK, { action });
}

// 便捷方法：卡片点击
export function trackCardClick(cardId: string, cardTitle: string) {
  track(TRACK_EVENTS.CARD_CLICK, { cardId, cardTitle });
}

// 便捷方法：API 错误
export function trackApiError(api: string, error: string) {
  track(TRACK_EVENTS.API_ERROR, { api, error });
}

// 导出事件常量供外部使用
export { TRACK_EVENTS };
