/**
 * 设计专家测试脚本
 * 单独测试原研哉的设计分析
 */
export {};

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// ProductThink 产品描述
const mockSummary = {
  product: `【产品名称】ProductThink 产品判官

【产品描述】
这是一款帮助产品经理和创业者进���产品思考的 AI 工具。用户通过对话描述自己的产品想法，系统会：
1. 引导用户完善产品描述（目标用户、核心功能、商业模式等）
2. 提供多位虚拟产品专家的分析视角（梁宁、俞军、Paul Graham、沈南鹏等）
3. 根据用户的目标（验证需求/定位营销/商业化/规模化）给出针对性建议
4. 生成可执行的本周行动清单

【当前设计风格】
- 主色调：黑白灰为主，紫色作为强调色
- 整体风格：简洁现代，卡片式布局
- 字体：系统默认字体
- 交互：对话式界面 + 报告展示

【目标用户】
- 0-1 阶段的创业者，需要验证产品想法
- 产品经理，需要多角度思考产品方向
- 独立开发者，想要快速获得产品反馈

【希望传递的感觉】
- 专业、可信赖
- 亲切、有温度
- 高效、不繁琐`,

  aiAdvice: `设计方面的初步想法：
- 希望给用户一种"专业顾问"的感觉
- 但又不想太冷冰冰，希望有一些温度
- 目前的黑白灰配色可能太过严肃`,

  userNotes: `补充信息：
- 目前 2 人团队，没有专职设计师
- 使用 Tailwind CSS 进行样式开发
- 参考过 Linear、Notion 的设计风格`,

  cases: [
    { name: 'Linear', reason: '现代 SaaS 产品设计标杆' },
    { name: 'Notion', reason: '简洁而有温度的工具设计' },
    { name: 'Vercel', reason: '开发者工具的设计典范' },
  ],
};

async function testDesignAnalysis() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║              原研哉 - 设计分析测试                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log('\n测试产品: ProductThink 产品判官');
  console.log('分析维度: 色彩、设计风格、竞品参考\n');

  try {
    const response = await fetch(`${API_BASE}/api/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: mockSummary,
        expertId: 'kenya_hara',
        productType: '工具/效率',
        userGoal: 'positioning',
        targetUserDescription: mockSummary.product,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullText = '';

    console.log('='.repeat(70));
    console.log('原研哉的设计分析：');
    console.log('='.repeat(70));
    console.log('');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      process.stdout.write(chunk);
    }

    // 提取 JSON 结果
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        console.log('\n\n');
        console.log('='.repeat(70));
        console.log('结构化结果：');
        console.log('='.repeat(70));
        console.log(`评分: ${parsed.score}/10`);
        console.log('\n优势:');
        parsed.strengths?.forEach((s: string, i: number) => console.log(`  ${i + 1}. ${s}`));
        console.log('\n风险:');
        parsed.risks?.forEach((r: string, i: number) => console.log(`  ${i + 1}. ${r}`));
        console.log('\n建议:');
        parsed.suggestions?.forEach((s: string, i: number) => console.log(`  ${i + 1}. ${s}`));
        console.log('\n本周行动:');
        (parsed.actionItems || []).forEach((a: string, i: number) => console.log(`  ${i + 1}. ${a}`));
      } catch {
        // 忽略解析错误
      }
    }

    console.log('\n\n测试完成!');
  } catch (error) {
    console.error('错误:', error instanceof Error ? error.message : String(error));
  }
}

testDesignAnalysis().catch(console.error);
