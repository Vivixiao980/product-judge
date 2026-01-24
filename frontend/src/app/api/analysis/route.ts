import { NextRequest } from 'next/server';
import { getExpertById, generateTargetUserPrompt } from '@/data/experts';

// 根据用户目标生成额外的提示词
function getGoalPrompt(userGoal: string): string {
  const goalPrompts: Record<string, string> = {
    validate: `
## 用户当前目标：验证需求 (0→0.1)
用户正处于产品早期阶段，想要验证产品是否有真实需求。

请特别关注并给出具体建议：
1. 如何用最小成本验证核心假设？
2. 第一批种子用户应该去哪里找？具体渠道和方法
3. 什么样的信号能证明产品有需求？（具体指标）
4. MVP 应该包含哪些核心功能？哪些可以先不做？
5. 推荐 1-2 个可以立即执行的验证实验

在 actionItems 中给出 3-5 个本周就能执行的具体行动，要���常具体可操作。`,

    positioning: `
## 用户当前目标：产品定位与营销
用户想要找到独特的市场定位，制定营销策略。

请特别关注并给出具体建议：
1. 产品的独特价值主张应该是什么？用一句话怎么说？
2. 目标用户画像应该如何精准定义？
3. 与竞品相比，应该强调哪些差异化优势？
4. 推荐的营销渠道和获客策略是什么？
5. 品牌调性和传播话术建议

在 actionItems 中给出 3-5 个具体的营销行动，包括渠道、内容方向、预算建议等。`,

    monetize: `
## 用户当前目标���商业化变现
用户想要探索盈利模式，实现产品商业化。

请特别关注并给出具体建议：
1. 推荐的商业模式是什么？为什么？
2. 定价策略建议（具体价格区间和依据）
3. 付费转化的关键节点在哪里？
4. 如何设计免费版和付费版的功能差异？
5. 潜在的 B 端或企业级变现机会

在 actionItems 中给出 3-5 个商业化的具体行动，包括定价测试、付费功能设计等。`,

    scale: `
## 用户当前目标：规模化增长
用户已验证需求，想要快速扩大用户规模。

请特别关注并给出具体建议：
1. 最适合的增长引擎是什么？（病毒传播/内容/付费/销售）
2. 如何设计增长飞轮？关键指标是什么？
3. 用户留存的关键动作是什么？如何优化？
4. 团队扩张建议（需要什么角色？）
5. 融资建议（是否需要？什么时机？）

在 actionItems 中给出 3-5 个增长相关的具体行动，包括实验设计、指标目标等。`,
  };

  return goalPrompts[userGoal] || '';
}

export async function POST(req: NextRequest) {
  const { summary, expertId, productType, userGoal, targetUserDescription } = await req.json();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
  }

  const expert = getExpertById(expertId);
  if (!expert) {
    return new Response(JSON.stringify({ error: 'Expert not found' }), { status: 404 });
  }

  // 构建产品描述
  const productDescription = `
## 产品概要
${summary.product || '暂无产品描述'}

## AI 之前的建议
${summary.aiAdvice || '暂无'}

## 用户补充的信息
${summary.userNotes || '暂无'}

## 相关案例
${summary.cases?.map((c: { name: string; reason: string }) => `- ${c.name}: ${c.reason}`).join('\n') || '暂无'}

## 产品类型
${productType}
`.trim();

  // 根据专家类型选择 prompt
  let systemPrompt = expert.systemPrompt;
  if (expertId === 'target_user' && targetUserDescription) {
    systemPrompt = generateTargetUserPrompt(targetUserDescription);
  }

  // 获取目标相关的提示词
  const goalPrompt = getGoalPrompt(userGoal || 'validate');

  const messages = [
    {
      role: 'system',
      content: `${systemPrompt}
${goalPrompt}

## 输出格式要求
请按以下格式输出你的分析：

1. 首先用 2-3 段话详细分析这个产品
2. 然后针对用户的目标，给出具体的落地建议
3. 给出评分（1-10分）
4. 最后用 JSON 格式总结：

\`\`\`json
{
  "score": 7.5,
  "strengths": ["优势1", "优势2", "优势3"],
  "risks": ["风险1", "风险2"],
  "suggestions": ["建议1", "建议2", "建议3"],
  "actionItems": ["本周行动1：具体描述", "本周行动2：具体描述", "本周行动3：具体描述"]
}
\`\`\`

注意：
- 评分要客观，不要太高也不要太低
- 优势、风险、建议各 2-4 条，每条简洁有力
- actionItems 是最重要的部分，要给出 3-5 个本周就能执行的具体行动
- 每个 actionItem 要非常具体，包含：做什么、怎么做、预期结果`,
    },
    {
      role: 'user',
      content: `请分析以下产品：\n\n${productDescription}`,
    },
  ];

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
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenRouter analysis error:', errorBody);
      return new Response(JSON.stringify({ error: 'Failed to get analysis' }), { status: response.status });
    }

    // 返回流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
