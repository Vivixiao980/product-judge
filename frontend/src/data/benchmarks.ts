export interface BenchmarkItem {
    name: string;
    category: 'b2b' | 'b2c' | 'creator' | 'ecommerce' | 'finance' | 'community';
    tags: string[];
    scenarios: string[];
}

export const BENCHMARKS: BenchmarkItem[] = [
    {
        name: 'Notion',
        category: 'b2b',
        tags: ['知识库', '协作', '文档', '项目管理', '模板'],
        scenarios: ['团队知识沉淀', '多文档协作', '信息组织'],
    },
    {
        name: 'Figma',
        category: 'b2b',
        tags: ['设计', '协作', '原型', '交付'],
        scenarios: ['产品设计协作', '原型评审'],
    },
    {
        name: 'Slack',
        category: 'b2b',
        tags: ['沟通', '团队', '协作', '消息'],
        scenarios: ['团队沟通', '跨部门协作'],
    },
    {
        name: 'Linear',
        category: 'b2b',
        tags: ['项目管理', '研发', '工单', '效率'],
        scenarios: ['研发管理', '问题追踪'],
    },
    {
        name: 'Trello',
        category: 'b2b',
        tags: ['看板', '任务管理', '团队'],
        scenarios: ['轻量任务管理', '小团队协作'],
    },
    {
        name: 'Miro',
        category: 'b2b',
        tags: ['白板', '协作', '头脑风暴', '会议'],
        scenarios: ['远程协作', '头脑风暴'],
    },
    {
        name: 'Duolingo',
        category: 'b2c',
        tags: ['学习', '激励', '习惯', '打卡'],
        scenarios: ['碎片化学习', '习惯养成'],
    },
    {
        name: 'Strava',
        category: 'community',
        tags: ['运动', '社区', '记录', '挑战'],
        scenarios: ['运动记录', '社群互动'],
    },
    {
        name: 'Canva',
        category: 'creator',
        tags: ['设计', '模板', '创作', '易用'],
        scenarios: ['轻量内容创作', '营销素材制作'],
    },
    {
        name: 'Shopify',
        category: 'ecommerce',
        tags: ['电商', '独立站', '支付', '商家'],
        scenarios: ['商家建站', '电商运营'],
    },
    {
        name: 'Stripe',
        category: 'finance',
        tags: ['支付', '金融', 'API', '结算'],
        scenarios: ['支付接入', '结算管理'],
    },
    {
        name: 'Airbnb',
        category: 'b2c',
        tags: ['交易平台', '双边市场', '供需撮合'],
        scenarios: ['供需撮合', '平台治理'],
    },
    {
        name: 'TikTok',
        category: 'b2c',
        tags: ['内容', '推荐', '短视频', '分发'],
        scenarios: ['内容分发', '算法推荐'],
    },
    {
        name: 'LinkedIn',
        category: 'b2b',
        tags: ['职业', '招聘', '人脉', '内容'],
        scenarios: ['职业社交', '人才匹配'],
    },
    {
        name: 'Pramp',
        category: 'b2c',
        tags: ['面试', '模拟面试', '求职', '技术面试', '练习'],
        scenarios: ['模拟面试', '技术面试练习', '求职准备'],
    },
    {
        name: 'InterviewBit',
        category: 'b2c',
        tags: ['面试', '题库', '刷题', '算法', '求职'],
        scenarios: ['面试题库', '算法面试准备', '求职准备'],
    },
    {
        name: 'HackerRank',
        category: 'b2c',
        tags: ['编程', '题库', '测评', '面试', '招聘'],
        scenarios: ['编程测评', '技术面试筛选', '求职准备'],
    },
    {
        name: 'LeetCode',
        category: 'b2c',
        tags: ['刷题', '算法', '面试', '题库', '编程'],
        scenarios: ['算法面试准备', '刷题训练'],
    },
    {
        name: 'interviewing.io',
        category: 'b2c',
        tags: ['面试', '模拟面试', '匿名面试', '技术面试', '反馈'],
        scenarios: ['模拟面试', '技术面试练习', '面试反馈'],
    },
    {
        name: 'Product Hunt',
        category: 'community',
        tags: ['产品发布', '社区', '增长', '冷启动'],
        scenarios: ['新品发布', '种子用户获取'],
    },
    {
        name: '小红书',
        category: 'community',
        tags: ['内容', '种草', '社区', '电商'],
        scenarios: ['内容社区', '消费决策'],
    },
];
