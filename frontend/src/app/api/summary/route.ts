import { NextRequest } from 'next/server';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export async function POST(req: NextRequest) {
    const { messages } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    }

    const recentMessages = messages.slice(-10);
    const summaryPrompt = [
        {
            role: 'system',
            content: `你是对话纪要助手。请基于用户与 AI 的对话，输出严格 JSON 格式，不要额外解释或 markdown。

字段格式如下：
{
  "product": "用户产品情况（目标用户、关键点、阶段），用 2-4 行要点。",
  "aiAdvice": "AI 给出的建议，用 2-4 行要点。",
  "userNotes": "用户的观点/评论/补充，用 2-4 行要点。",
  "cases": [
    { "name": "案例或对标公司", "reason": "推荐原因，1-2 句" }
  ]
}

规则：
- 全部用中文
- 如果信息不足，写“暂无明确结论”或“待用户补充”
- cases 最多 3 条，可以为空数组
- 每个字段用简洁短句，避免长段落
- 只输出 JSON 对象，不要包含额外文字
- 所有 key 必须使用双引号
- 不要使用尾随逗号`,
        },
        ...recentMessages,
        {
            role: 'user',
            content: '请输出最新总结 JSON。',
        },
    ];

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
            messages: summaryPrompt,
            stream: false,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouter summary error:', errorBody);
        return new Response(JSON.stringify({ error: 'Failed to get summary response' }), { status: response.status });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    const coerceText = (value: unknown): string => {
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.map(coerceText).filter(Boolean).join('\n');
        if (value && typeof value === 'object') {
            return Object.entries(value as Record<string, unknown>)
                .map(([key, val]) => `${key}：${coerceText(val)}`)
                .filter(Boolean)
                .join('\n');
        }
        if (value == null) return '';
        return String(value);
    };

    const normalizeSummary = (value: unknown) => {
        const obj = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
        const casesRaw = (obj.cases ?? []) as unknown;
        const cases = Array.isArray(casesRaw)
            ? casesRaw
                  .map(item => {
                      if (item && typeof item === 'object') {
                          const record = item as Record<string, unknown>;
                          return {
                              name: coerceText(record.name),
                              reason: coerceText(record.reason),
                          };
                      }
                      return { name: coerceText(item), reason: '' };
                  })
                  .filter(item => item.name || item.reason)
            : [];

        return {
            product: coerceText(obj.product),
            aiAdvice: coerceText(obj.aiAdvice),
            userNotes: coerceText(obj.userNotes),
            cases,
        };
    };

    const sanitizeJson = (raw: string) => {
        let cleaned = raw.trim();
        cleaned = cleaned.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/m, '$1');
        cleaned = cleaned.replace(/([,{]\s*)([A-Za-z0-9_\\u4e00-\\u9fa5]+)\s*:/g, '$1"$2":');
        cleaned = cleaned.replace(/'([^']*)'/g, '"$1"');
        cleaned = cleaned.replace(/,(\s*[}\\]])/g, '$1');
        return cleaned;
    };

    try {
        const parsed = JSON.parse(text);
        return new Response(JSON.stringify({ summary: normalizeSummary(parsed) }), { status: 200 });
    } catch (error) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                const parsed = JSON.parse(sanitizeJson(match[0]));
                return new Response(JSON.stringify({ summary: normalizeSummary(parsed) }), { status: 200 });
            } catch (innerError) {
                console.error('Failed to parse extracted summary JSON:', innerError);
            }
        }
        console.error('Failed to parse summary JSON:', error);
        return new Response(
            JSON.stringify({
                summary: normalizeSummary({
                    product: '暂无明确结论',
                    aiAdvice: '暂无明确结论',
                    userNotes: '待用户补充',
                    cases: [],
                }),
            }),
            { status: 200 }
        );
    }
}
