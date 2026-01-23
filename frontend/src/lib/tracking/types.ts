// 埋点事件类型定义
export interface TrackEvent {
  event: string;
  data?: Record<string, unknown>;
  url?: string;
  timestamp?: number;
}

export interface TrackRecord {
  id: string;
  event: string;
  data: Record<string, unknown>;
  ip: string;
  userAgent: string;
  url: string;
  timestamp: string;
  sessionId: string;
}

// 常用事件名称常量
export const TRACK_EVENTS = {
  // 页面访问
  PAGE_VIEW: 'page_view',

  // 对话相关
  CHAT_START: 'chat_start',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',

  // 阶段切换
  STAGE_CHANGE: 'stage_change',

  // 快捷操作
  QUICK_ACTION_CLICK: 'quick_action_click',

  // 灵感卡片
  CARD_VIEW: 'card_view',
  CARD_CLICK: 'card_click',

  // 错误
  API_ERROR: 'api_error',
} as const;
