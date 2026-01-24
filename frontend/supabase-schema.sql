-- =============================================
-- ProductThink - Supabase 数据库初始化脚本
-- =============================================
-- 使用方法：
-- 1. 登录 Supabase Dashboard (https://supabase.com/dashboard)
-- 2. 选择你的项目
-- 3. 进入 SQL Editor
-- 4. 复制粘贴此脚本并执行
-- =============================================

-- 1. 创建事件表（埋点数据）
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为常用查询创建索引
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_device_type ON events(device_type);

-- 2. 创建对话记录表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL,
  messages JSONB DEFAULT '[]',
  summary JSONB,
  stage VARCHAR(50) DEFAULT 'info',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- 3. 创建会话统计视图（方便查询）
CREATE OR REPLACE VIEW session_stats AS
SELECT
  session_id,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen,
  COUNT(*) as event_count,
  COUNT(DISTINCT event_name) as unique_events,
  MAX(CASE WHEN event_name = 'page_view' THEN (event_data->>'page')::text END) as last_page,
  MAX(device_type) as device_type,
  MAX(browser) as browser,
  MAX(os) as os,
  MAX(ip_address) as ip_address
FROM events
GROUP BY session_id;

-- 4. 创建每日统计视图
CREATE OR REPLACE VIEW daily_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) FILTER (WHERE event_name = 'page_view') as page_views,
  COUNT(*) FILTER (WHERE event_name = 'message_sent') as messages_sent,
  COUNT(*) FILTER (WHERE event_name = 'api_error') as errors,
  COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_users,
  COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_users
FROM events
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 5. 创建事件统计视图
CREATE OR REPLACE VIEW event_stats AS
SELECT
  event_name,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as unique_sessions,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM events
GROUP BY event_name
ORDER BY count DESC;

-- 6. 设置 RLS（行级安全策略）
-- 启用 RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 允许服务端写入（使用 service_role key）
CREATE POLICY "Allow service role full access to events" ON events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to conversations" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

-- 7. 创建自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 完成！
--
-- 接下来需要在 .env.local 中配置：
-- NEXT_PUBLIC_SUPABASE_URL=你的项目URL
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
-- SUPABASE_SERVICE_ROLE_KEY=你的service role key
-- =============================================
