/**
 * ProductThink 自测脚本
 *
 * 使用本产品（ProductThink）作为测试案例
 * 测试所有专家视角的分析结果
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// ProductThink 产品描述
const mockSummary = {
  product: `【产品名称】ProductThink 产品判官

【产品描述】
这是一款帮助产品经理和创业者进行产品思考的 AI 工具。用户通过对话描述自己的产品想法，系统会：
1. 引导用户完善产品描述（目标用户、核心功能、商业模式等）
2. 提供多位虚拟产品专家的分析视角（梁宁、俞军、Paul Graham、沈南鹏等）
3. 根据用户的目标（验证需求/定位营销/商业化/规模化）给出针对性建议
4. 生成可执行的本周行动清单

【核心功能】
1. AI 对话引导：通过对话帮助用户梳理产品思路
2. 多视角分析：8位虚拟专家从不同角度分析产品
3. 目标导向建议：根据用户当前阶段给出落地建议
4. 行动清单生成：输出具体可执行的本周任务

【目标用户】
- 0-1 阶段的创业者，需要验证产品想法
- 产品经理，需要多角度思考产品方向
- 独立开发者，想要快速获得产品反馈

【商业模式】
- 免费版：每天 3 次对话 + 1 次多视角分析
- Pro 版：无限对话 + 分析，月费 29 元
- 团队版：多人协作 + 历史记录，按席位收费

【竞争对手】
- ChatGPT 直接对话
- 各类产品分析模板
- 产品社区（人人都是产品经理等）

【当前阶段】
MVP 已完成，正在进行内测`,

  aiAdvice: `这个产品有几个值得思考的点：
1. 差异化：多专家视角是亮点，但需要验证用户是否真的需要"多个专家"还是"一个好建议"
2. 付费意愿：产品经理群体付费意愿较强，但需要验证 29 元/月的定价
3. 留存问题：产品分析是低频需求，如何提高用户粘性？`,

  userNotes: `补充信息：
- 创始人本身是产品经理，做这个产品是因为自己需要
- 目前 2 人团队，一个全栈一个设计
- 已有 50 个内测用户
- 技术栈：Next.js + OpenRouter API`,

  cases: [
    { name: 'Notion AI', reason: '在工具中嵌入 AI 能力的成功案例' },
    { name: 'Gamma', reason: 'AI 生成 PPT，验证了 AI 辅助创作的市场' },
    { name: 'Copy.ai', reason: 'AI 写作工具，可参考其商业化路径' },
  ],
};

// 用户目标
type UserGoal = 'validate' | 'positioning' | 'monetize' | 'scale';

const USER_GOAL_LABELS: Record<UserGoal, string> = {
  validate: '验证需求 (0→0.1)',
  positioning: '产品定位与营销',
  monetize: '商业化变现',
  scale: '规模化增长',
};

// 要测试的专家列表 - 产品专家 + 目标用户
const expertsToTest = [
  'liang_ning',    // 梁宁 - 产品战略
  'yu_jun',        // 俞军 - 产品方法论
  'lenny',         // Lenny - 增长
  'paul_graham',   // PG - 投资视角
  'target_user',   // 目标用户
];

interface AnalysisResult {
  expertId: string;
  expertName: string;
  analysis: string;
  score: number;
  strengths: string[];
  risks: string[];
  suggestions: string[];
  actionItems: string[];
  error?: string;
}

async function testExpertAnalysis(
  expertId: string,
  userGoal: UserGoal
): Promise<AnalysisResult> {
  const expertNames: Record<string, string> = {
    liang_ning: '梁宁',
    yu_jun: '俞军',
    lenny: 'Lenny Rachitsky',
    paul_graham: 'Paul Graham',
    shen_nanpeng: '沈南鹏',
    zhang_yiming: '张一鸣',
    tech_architect: '技术架构师',
    target_user: '目标用户',
  };

  console.log(`\n${'='.repeat(70)}`);
  console.log(`专家: ${expertNames[expertId] || expertId}`);
  console.log(`目标: ${USER_GOAL_LABELS[userGoal]}`);
  console.log('='.repeat(70));

  try {
    const response = await fetch(`${API_BASE}/api/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: mockSummary,
        expertId,
        productType: '工具/效率',
        userGoal,
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      process.stdout.write(chunk);
    }

    // 提取 JSON 结果
    let score = 7;
    let strengths: string[] = [];
    let risks: string[] = [];
    let suggestions: string[] = [];
    let actionItems: string[] = [];

    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        score = parsed.score || 7;
        strengths = parsed.strengths || [];
        risks = parsed.risks || [];
        suggestions = parsed.suggestions || [];
        actionItems = parsed.actionItems || parsed.action_items || [];
      } catch {
        // 忽略解析错误
      }
    }

    console.log('\n');
    return {
      expertId,
      expertName: expertNames[expertId] || expertId,
      analysis: fullText,
      score,
      strengths,
      risks,
      suggestions,
      actionItems,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`错误: ${errorMsg}`);
    return {
      expertId,
      expertName: expertNames[expertId] || expertId,
      analysis: '',
      score: 0,
      strengths: [],
      risks: [],
      suggestions: [],
      actionItems: [],
      error: errorMsg,
    };
  }
}

async function main() {
  const userGoal = (process.argv[2] as UserGoal) || 'validate';

  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           ProductThink 产品自测 - 多视角分析                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');
  console.log(`\n测试产品: ProductThink 产品判官`);
  console.log(`用户目标: ${USER_GOAL_LABELS[userGoal]}`);
  console.log(`测试专家: ${expertsToTest.length} 位`);
  console.log('\n');

  const results: AnalysisResult[] = [];

  for (const expertId of expertsToTest) {
    const result = await testExpertAnalysis(expertId, userGoal);
    results.push(result);

    // 添加延迟避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 输出汇总报告
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                         测试结果汇总                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  // 评分汇总
  console.log('\n【专家评分】');
  const completedResults = results.filter(r => !r.error);
  for (const result of completedResults) {
    const bar = '█'.repeat(Math.round(result.score));
    const empty = '░'.repeat(10 - Math.round(result.score));
    console.log(`  ${result.expertName.padEnd(20)} ${bar}${empty} ${result.score.toFixed(1)}/10`);
  }

  if (completedResults.length > 0) {
    const avgScore = completedResults.reduce((sum, r) => sum + r.score, 0) / completedResults.length;
    console.log(`\n  综合评分: ${avgScore.toFixed(1)}/10`);
  }

  // 核心优势
  const allStrengths = [...new Set(completedResults.flatMap(r => r.strengths))];
  if (allStrengths.length > 0) {
    console.log('\n【核心优势】');
    allStrengths.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s}`);
    });
  }

  // 主要风险
  const allRisks = [...new Set(completedResults.flatMap(r => r.risks))];
  if (allRisks.length > 0) {
    console.log('\n【主要风险】');
    allRisks.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r}`);
    });
  }

  // 策略建议
  const allSuggestions = [...new Set(completedResults.flatMap(r => r.suggestions))];
  if (allSuggestions.length > 0) {
    console.log('\n【策略建议】');
    allSuggestions.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s}`);
    });
  }

  // 本周行动清单
  const allActionItems = [...new Set(completedResults.flatMap(r => r.actionItems))];
  if (allActionItems.length > 0) {
    console.log('\n【本周行动清单】');
    allActionItems.slice(0, 7).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });
  }

  // 错误汇总
  const errorResults = results.filter(r => r.error);
  if (errorResults.length > 0) {
    console.log('\n【错误】');
    errorResults.forEach(r => {
      console.log(`  ${r.expertName}: ${r.error}`);
    });
  }

  console.log('\n测试完成!');
  console.log('\n使用方法:');
  console.log('  npx tsx scripts/test-productthink.ts validate    # 验证需求');
  console.log('  npx tsx scripts/test-productthink.ts positioning # 产品定位');
  console.log('  npx tsx scripts/test-productthink.ts monetize    # 商业化');
  console.log('  npx tsx scripts/test-productthink.ts scale       # 规模化增长');
}

main().catch(console.error);
