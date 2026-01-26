import { NextRequest, NextResponse } from 'next/server';
import { createAICompletionJson } from '@/lib/ai-client';

function extractJson(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) return match[1];
  return text;
}

export async function POST(req: NextRequest) {
  const { summary, productType } = await req.json();

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
    const { content, provider } = await createAICompletionJson({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `请根据以下产品生成目标用户画像：\n\n${productDescription}` },
      ],
    });

    console.log(`[Target User API] Using provider: ${provider}`);

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
