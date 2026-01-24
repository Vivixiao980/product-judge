import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

// POST: 保存或更新对话
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, messages, summary, stage } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // 输出到控制台
    console.log('[CONVERSATION] Save:', {
      sessionId,
      messageCount: messages?.length || 0,
      stage,
    });

    if (!isSupabaseConfigured || !supabaseAdmin) {
      console.warn('[CONVERSATION] Supabase not configured');
      return NextResponse.json({ success: true, storage: 'console' });
    }

    // 检查是否已存在该会话
    const { data: existing } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      // 更新现有对话
      const { error } = await supabaseAdmin
        .from('conversations')
        .update({
          messages,
          summary,
          stage,
          message_count: messages?.length || 0,
        })
        .eq('session_id', sessionId);

      if (error) {
        console.error('[CONVERSATION] Update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // 创建新对话
      const { error } = await supabaseAdmin
        .from('conversations')
        .insert({
          session_id: sessionId,
          messages,
          summary,
          stage,
          message_count: messages?.length || 0,
        });

      if (error) {
        console.error('[CONVERSATION] Insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, storage: 'supabase' });
  } catch (error) {
    console.error('[CONVERSATION] Error:', error);
    return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
  }
}
