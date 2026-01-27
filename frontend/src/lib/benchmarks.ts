import { BENCHMARKS } from '@/data/benchmarks';

export interface BenchmarkRecommendation {
    name: string;
    reason: string;
}

interface CategorySuggestion {
    name: string;
    keywords: string[];
    reason: string;
}

const tokenize = (text: string) =>
    text
        .toLowerCase()
        .replace(/[，。！？、,.!?/\\-]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

const extractKeywordHits = (text: string, tags: string[]) => {
    const normalized = text.toLowerCase();
    return tags.filter(tag => normalized.includes(tag.toLowerCase()));
};

export const recommendBenchmarks = (summaryText: string, limit = 3): BenchmarkRecommendation[] => {
    if (!summaryText.trim()) return [];
    const keywords = new Set(tokenize(summaryText));
    const scored = BENCHMARKS.map(item => {
        const tagHits = extractKeywordHits(summaryText, item.tags);
        const scenarioHits = extractKeywordHits(summaryText, item.scenarios);
        const score = tagHits.length * 2 + scenarioHits.length;
        const reasonParts = [];
        if (tagHits.length) reasonParts.push(`匹配关键词：${tagHits.slice(0, 3).join('、')}`);
        if (scenarioHits.length) reasonParts.push(`场景相似：${scenarioHits.slice(0, 2).join('、')}`);
        if (!reasonParts.length && keywords.size > 0) {
            reasonParts.push('与当前产品定位相近');
        }
        return {
            name: item.name,
            reason: reasonParts.join('；'),
            score,
        };
    })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, limit);
    return top.map(item => ({ name: item.name, reason: item.reason }));
};

export const isKnownBenchmark = (name: string) =>
    BENCHMARKS.some(item => item.name.toLowerCase() === name.toLowerCase());

export const extractMentionedBenchmarks = (text: string, limit = 3): BenchmarkRecommendation[] => {
    if (!text.trim()) return [];
    const normalized = text.toLowerCase();
    const matches = BENCHMARKS.filter(item => normalized.includes(item.name.toLowerCase()))
        .slice(0, limit)
        .map(item => ({
            name: item.name,
            reason: '在对话中被明确提及',
        }));
    return matches;
};

const GENERIC_KEYWORDS = new Set([
    '设计',
    '协作',
    '效率',
    '工具',
    '模板',
    '内容',
    '用户',
    '体验',
    '平台',
    '创作',
    '团队',
    '流程',
]);

const getBenchmarkMeta = (name: string) =>
    BENCHMARKS.find(item => item.name.toLowerCase() === name.toLowerCase());

export const filterBenchmarksByRelevance = (cases: BenchmarkRecommendation[], summaryText: string) => {
    if (!summaryText.trim()) return cases;
    const normalized = summaryText.toLowerCase();

    return cases.filter(item => {
        const meta = getBenchmarkMeta(item.name);
        if (!meta) return true;
        if (normalized.includes(meta.name.toLowerCase())) return true;

        const tagHits = meta.tags.filter(tag => normalized.includes(tag.toLowerCase()));
        const scenarioHits = meta.scenarios.filter(scene => normalized.includes(scene.toLowerCase()));

        if (!tagHits.length && !scenarioHits.length) return false;

        const tagScore = tagHits.reduce((score, tag) => {
            return score + (GENERIC_KEYWORDS.has(tag) ? 1 : 2);
        }, 0);
        const scenarioScore = scenarioHits.length * 3;
        const totalScore = tagScore + scenarioScore;

        return totalScore >= 3;
    });
};

const CATEGORY_SUGGESTIONS: CategorySuggestion[] = [
    {
        name: '品类：模拟面试 / 求职训练工具',
        keywords: ['面试', '模拟面试', '求职', '题库', '评分', '面试官', '复盘', '岗位', 'jd'],
        reason: '当前需求更像面试训练与能力评估工具',
    },
    {
        name: '品类：在线学习 / 训练平台',
        keywords: ['学习', '训练', '课程', '练习', '作业', '题库', '打卡', '反馈'],
        reason: '核心价值是结构化训练与反馈',
    },
    {
        name: '品类：企业协作 / 生产力工具',
        keywords: ['团队', '协作', '项目', '文档', '办公', '流程', '审批'],
        reason: '面向组织效率或协作流程优化',
    },
    {
        name: '品类：开发者工具 / 工程效率',
        keywords: ['开发', '代码', '编程', 'API', '部署', '调试', '测试', '工程师'],
        reason: '主要服务开发与工程流程',
    },
    {
        name: '品类：内容创作 / 媒体工具',
        keywords: ['内容', '创作', '视频', '剪辑', '脚本', '音频', '设计'],
        reason: '以内容生产与编辑为核心价值',
    },
    {
        name: '品类：健康 / 医疗服务',
        keywords: ['健康', '医疗', '诊断', '康复', '心理', '睡眠', '运动'],
        reason: '以健康管理或医疗支持为主',
    },
    {
        name: '品类：电商 / 零售工具',
        keywords: ['电商', '商品', '订单', '支付', '物流', '店铺', '运营'],
        reason: '面向交易与零售运营场景',
    },
    {
        name: '品类：社交 / 社区平台',
        keywords: ['社交', '社区', '匹配', '关系', '聊天', '群组', '互动'],
        reason: '核心价值来自关系与社区互动',
    },
    {
        name: '品类：金融 / 资产管理',
        keywords: ['金融', '理财', '投资', '风控', '贷款', '信用', '保险'],
        reason: '核心问题与资金、风险相关',
    },
];

export const suggestCategories = (summaryText: string, limit = 3): BenchmarkRecommendation[] => {
    if (!summaryText.trim()) return [];
    const normalized = summaryText.toLowerCase();
    const scored = CATEGORY_SUGGESTIONS.map(item => {
        const hits = item.keywords.filter(keyword => normalized.includes(keyword.toLowerCase()));
        return {
            name: item.name,
            reason: hits.length ? `${item.reason}（命中：${hits.slice(0, 3).join('、')}）` : item.reason,
            score: hits.length,
        };
    })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(item => ({ name: item.name, reason: item.reason }));
};
