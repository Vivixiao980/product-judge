import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { requireAdmin } from './_lib';

// GET: 获取统计数据和对话列表
export async function GET(request: NextRequest) {
  const authed = await requireAdmin();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const url = new URL(request.url);
  const view = url.searchParams.get('view') || 'overview';

  try {
    switch (view) {
      case 'overview': {
        // 获取总体统计
        const [
          eventsResult,
          conversationsResult,
          dailyResult,
          ipTotalResult,
          ipDailyResult,
          ipRetentionResult,
          chatCompletionResult,
          stageStatsResult,
          feedbackStatsResult,
          totalMessagesResult,
          dailyConversationMetricsResult,
          feedbackItemsResult,
          messageFeedbackItemsResult,
        ] = await Promise.all([
          supabaseAdmin.from('events').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('conversations').select('id', { count: 'exact', head: true }),
          supabaseAdmin.from('daily_stats').select('*').limit(7),
          supabaseAdmin.from('total_unique_ips').select('*').single(),
          supabaseAdmin.from('daily_ip_stats').select('*').limit(7),
          supabaseAdmin.from('daily_ip_retention').select('*').limit(7),
          supabaseAdmin.from('daily_chat_completion_ip').select('*').limit(7),
          supabaseAdmin.from('stage_ip_stats').select('*'),
          supabaseAdmin.from('message_feedback_stats').select('*').single(),
          supabaseAdmin.from('total_conversation_messages').select('*').single(),
          supabaseAdmin.from('daily_conversation_metrics').select('*').limit(7),
          supabaseAdmin.from('feedback_items').select('*').order('created_at', { ascending: false }).limit(50),
          supabaseAdmin.from('message_feedback_items').select('*').order('created_at', { ascending: false }).limit(50),
        ]);

        return NextResponse.json({
          totalEvents: eventsResult.count || 0,
          totalConversations: conversationsResult.count || 0,
          dailyStats: dailyResult.data || [],
          totalUniqueIps: ipTotalResult.data?.total_unique_ips || 0,
          dailyIpStats: ipDailyResult.data || [],
          ipRetention: ipRetentionResult.data || [],
          chatCompletion: chatCompletionResult.data || [],
          stageStats: stageStatsResult.data || [],
          feedbackStats: feedbackStatsResult.data || { likes: 0, dislikes: 0 },
          totalConversationMessages: totalMessagesResult.data?.total_messages || 0,
          dailyConversationMetrics: dailyConversationMetricsResult.data || [],
          feedbackItems: feedbackItemsResult.data || [],
          messageFeedbackItems: messageFeedbackItemsResult.data || [],
        });
      }

      case 'conversations': {
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const { data, error, count } = await supabaseAdmin
          .from('conversations')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ conversations: data, total: count });
      }

      case 'conversation': {
        const id = url.searchParams.get('id');
        if (!id) {
          return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from('conversations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ conversation: data });
      }

      case 'events': {
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const { data, error } = await supabaseAdmin
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ events: data });
      }

      default:
        return NextResponse.json({ error: 'Invalid view' }, { status: 400 });
    }
  } catch (error) {
    console.error('[ADMIN] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
