/**
 * 多视角分析功能测试脚本
 *
 * 测试产品：AI模拟面试助手
 * - 根据用户上传的简历和公司JD快速进入模拟面试
 * - 调用摄像头记录并评分
 */
export {};

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// 模拟的产品信息（基于用户描述）
const mockSummary = {
  product: `【产品名称】AI模拟面试助手

【产品描述】
这是一款帮助求职者准备面试的AI工具。用户上传自己的简历和目标公司的职位描述（JD），系统会自动分析匹配度，并生成针对性的模拟面试。

【核心功能】
1. 简历与JD智能匹配分析
2. 基于岗位要求生成个性化面试问题
3. 实时视频面试模拟（调用摄像头）
4. AI面试官实时互动问答
5. 面试表现评分与反馈（表情、语速、内容质量）

【目标用户】
- 应届毕业生求职者
- 想要跳槽的职场人士
- 对面试感到紧张、需要练习的人

【商业模式】
- 免费版：每月3次模拟面试
- 付费版：无限次面试 + 详细报告，月费39元
- 企业版：批量培训员工面试技巧

【竞争对手】
- 牛客网的模拟面试
- 面试鸭
- ChatGPT直接对话练习

【当前阶段】
MVP开发中，已完成简历解析和问题生成模块`,

  aiAdvice: `根据你的描述，这个产品有几个值得深入思考的点：

1. **差异化价值**：摄像头评分是一个亮点，但需要验证用户是否真的在意"表情管理"
2. **冷启动问题**：如何获取第一批用户？建议从校园招聘季切入
3. **技术壁垒**：视频分析的准确性是关键，建议先用简单规则，再逐步引入AI
4. **定价策略**：39元/月可能偏低，建议做用户调研确认付费意愿`,

  userNotes: `用户补充：
- 我自己就是因为面试紧张错过了好几个offer，所以想做这个产品
- 目前团队2人，一个前端一个后端
- 已经有100个种子用户在等待内测
- 计划下个月上线MVP`,

  cases: [
    { name: 'Pramp', reason: '免费的真人模拟面试平台，可以学习其社区运营模式' },
    { name: 'Interviewing.io', reason: '匿名技术面试平台，已获得融资，验证了市场需求' },
    { name: 'HireVue', reason: 'B端视频面试评估工具，可参考其AI评分维度' },
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

// 要测试的专家列表
const expertsToTest = [
  'liang_ning',    // 梁宁 - 产品战略
  'lenny',         // Lenny - 增长
  'paul_graham',   // PG - 投资视角
];

async function testExpertAnalysis(
  expertId: string,
  userGoal: UserGoal
): Promise<{
  expertId: string;
  analysis: string;
  actionItems: string[];
  error?: string;
}> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`正在调用专家: ${expertId}`);
  console.log(`用户目标: ${USER_GOAL_LABELS[userGoal]}`);
  console.log('='.repeat(60));

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
      process.stdout.write(chunk); // 实时输出
    }

    // 提取 actionItems
    let actionItems: string[] = [];
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        actionItems = parsed.actionItems || parsed.action_items || [];
      } catch {
        // 忽略解析错误
      }
    }

    console.log('\n');
    return { expertId, analysis: fullText, actionItems };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`错误: ${errorMsg}`);
    return { expertId, analysis: '', actionItems: [], error: errorMsg };
  }
}

async function main() {
  // 从命令行参数获取目标，默认为 validate
  const userGoal = (process.argv[2] as UserGoal) || 'validate';

  console.log('🚀 开始多视角分析测试');
  console.log('📦 测试产品: AI模拟面试助手');
  console.log(`🎯 用户目标: ${USER_GOAL_LABELS[userGoal]}`);
  console.log(`👥 测试专家数量: ${expertsToTest.length}`);
  console.log('\n');

  const results: Array<{
    expertId: string;
    analysis: string;
    actionItems: string[];
    error?: string;
  }> = [];

  for (const expertId of expertsToTest) {
    const result = await testExpertAnalysis(expertId, userGoal);
    results.push(result);

    // 添加延迟避免API限流
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 输出汇总
  console.log('\n');
  console.log('='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));

  for (const result of results) {
    const status = result.error ? '❌ 失败' : '✅ 成功';
    const length = result.analysis.length;
    console.log(`${status} ${result.expertId}: ${length} 字符`);
  }

  // 汇总所有行动建议
  console.log('\n');
  console.log('='.repeat(60));
  console.log(`📋 本周行动清单 (目标: ${USER_GOAL_LABELS[userGoal]})`);
  console.log('='.repeat(60));

  const allActionItems = results.flatMap(r => r.actionItems);
  const uniqueActionItems = [...new Set(allActionItems)];

  if (uniqueActionItems.length > 0) {
    uniqueActionItems.forEach((item, i) => {
      console.log(`${i + 1}. ${item}`);
    });
  } else {
    console.log('未能提取到行动建议');
  }

  console.log('\n✅ 测试完成!');
  console.log('\n提示: 可以通过命令行参数指定不同目标:');
  console.log('  npx tsx scripts/test-analysis.ts validate    # 验证需求');
  console.log('  npx tsx scripts/test-analysis.ts positioning # 产品定位');
  console.log('  npx tsx scripts/test-analysis.ts monetize    # 商业化');
  console.log('  npx tsx scripts/test-analysis.ts scale       # 规模化增长');
}

main().catch(console.error);
