import { NextRequest } from 'next/server';
import { ensurePublishedCards, readCms, requireAdmin, writeCms, writePublishedCards } from '../_lib';
import crypto from 'crypto';

export async function GET() {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    ensurePublishedCards();
    const data = readCms();
    return new Response(JSON.stringify(data), { status: 200 });
}

export async function POST(req: NextRequest) {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const payload = await req.json();
    const now = new Date().toISOString();
    const data = readCms();
    const item = {
        id: crypto.randomUUID(),
        title: payload.title || '未命名',
        category: payload.category || '其他',
        content: payload.content || '',
        source: payload.source || '',
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        fullArticle: payload.fullArticle || '',
        status: payload.status || 'pending',
        createdAt: now,
        updatedAt: now,
    };
    data.items.unshift(item);
    writeCms(data);
    writePublishedCards(data.items);
    return new Response(JSON.stringify(item), { status: 200 });
}
