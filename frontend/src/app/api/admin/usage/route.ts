import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // 验证管理员身份
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (token !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // 获取 OpenRouter API key 信息
    const keyInfoRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!keyInfoRes.ok) {
      throw new Error('Failed to fetch key info');
    }

    const keyInfo = await keyInfoRes.json();

    // 获取最近的使用记录（如果有的话）
    let recentActivity = null;
    try {
      const activityRes = await fetch('https://openrouter.ai/api/v1/activity', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      if (activityRes.ok) {
        recentActivity = await activityRes.json();
      }
    } catch {
      // 活动记录可能不可用，忽略错误
    }

    return NextResponse.json({
      keyInfo: keyInfo.data || keyInfo,
      recentActivity,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
