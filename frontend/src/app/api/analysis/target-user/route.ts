import { NextRequest, NextResponse } from 'next/server';

function extractJson(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  return text;
}

export async function POST(req: NextRequest) {
  const { summary, productType } = await req.json();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const productDescription = `
## 产品概要
${summary?.product || '暂无产品描述'}

## AI 之前的建议
${summary?.aiAdvice || '暂无'}

## 用户补充的信息
${summary?.userNotes || '暂无'}

## 相关案例
${summary?.cases?.map((c: { name: string; reason: string }) => `- ${c.name}: ${c.reason}`).join('\n') || '暂无'}

## 产品类型
${productType || '未指定'}
`.trim();

  const system = `你是一位产品研究员，擅长构建目标用户画像。请基于产品描述生成 3 个不同的目标用户画像。

要求：
1) 画像要具体，有真实场景与痛点
2) 覆盖不同人群/使用情境
3) 输出为 JSON 数组

输出格式：
\`\`\`json
[
  {
    "id": "persona_1",
    "name": "姓名或代号",
    "role": "职业/身份",
    "scenario": "典型使用场景",
    "painPoints": ["痛点1", "痛点2"],
    "motivations": ["动机1", "动机2"],
    "willingnessToPay": "付费意愿/价格敏感度",
    "shortBio": "一句话画像"
  }
]
\`\`\``;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'ProductThink',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `请根据以下产品生成目标用户画像：\n\n${productDescription}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Target user error:', errorBody);
      return NextResponse.json({ error: 'Failed to generate target users' }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonText = extractJson(content);

    try {
      const personas = JSON.parse(jsonText);
      return NextResponse.json({ personas });
    } catch {
      return NextResponse.json({ error: 'Invalid persona JSON' }, { status: 500 });
    }
  } catch (error) {
    console.error('Target user API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
