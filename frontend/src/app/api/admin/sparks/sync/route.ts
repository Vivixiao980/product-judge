import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { readCms, requireAdmin, writeCms, writePublishedCards } from '../../_lib';

const ROOT = '/Users/vivi/Documents/产品思考工具';
const AUTO_CARDS = path.join(ROOT, 'frontend', 'src', 'data', 'cards.auto.json');
const SOURCES = path.join(ROOT, 'backend', 'sparks_sources.json');
const KB_DIR = path.join(ROOT, '产品知识库');

const CATEGORY_MAP: Record<string, string> = {
    '01-产品与设计': '产品与设计',
    '02-商业与战略': '商业与战略',
    '03-思维与认知': '思维与认知',
    '04-成长与效能': '成长与效能',
    '05-技术与AI': '技术与AI',
    '06-其他': '其他',
};

const headingRe = /^\s*#{1,6}\s+(.*)$/;

function firstHeading(text: string) {
    for (const line of text.split(/\r?\n/)) {
        const match = headingRe.exec(line);
        if (match) return match[1].trim();
    }
    return '';
}

function shortSummary(text: string) {
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('来源')) continue;
        if (trimmed.startsWith('#')) continue;
        return trimmed.slice(0, 120);
    }
    return '';
}

export async function POST() {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const data = readCms();
    const existing = new Set(data.items.map(item => item.id));
    const now = new Date().toISOString();

    if (fs.existsSync(AUTO_CARDS)) {
        const auto = JSON.parse(fs.readFileSync(AUTO_CARDS, 'utf-8') || '[]');
        for (const card of auto) {
            if (!card?.id || existing.has(card.id)) continue;
            data.items.unshift({
                id: card.id,
                title: card.title || '未命名',
                category: card.category || '其他',
                content: card.content || '',
                source: card.source || '',
                tags: Array.isArray(card.tags) ? card.tags : [],
                fullArticle: card.fullArticle || '',
                status: 'published',
                createdAt: now,
                updatedAt: now,
            });
            existing.add(card.id);
        }
    }

    if (fs.existsSync(SOURCES)) {
        const sources = JSON.parse(fs.readFileSync(SOURCES, 'utf-8') || '{}');
        const pending: string[] = sources.pending || [];
        for (const rel of pending) {
            const id = crypto.createHash('md5').update(`pending:${rel}`).digest('hex').slice(0, 12);
            if (existing.has(id)) continue;
            const filePath = path.join(KB_DIR, rel);
            if (!fs.existsSync(filePath)) continue;
            const text = fs.readFileSync(filePath, 'utf-8');
            const title = firstHeading(text) || path.basename(rel, path.extname(rel));
            const categoryKey = rel.split('/')[0];
            const category = CATEGORY_MAP[categoryKey] || '其他';
            data.items.unshift({
                id,
                title,
                category,
                content: shortSummary(text),
                source: '',
                tags: [category],
                fullArticle: text.slice(0, 4000),
                status: 'pending',
                createdAt: now,
                updatedAt: now,
            });
            existing.add(id);
        }
    }

    writeCms(data);
    writePublishedCards(data.items);
    return new Response(JSON.stringify({ ok: true, count: data.items.length }), { status: 200 });
}
