import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = '/Users/vivi/Documents/产品思考工具';
const FEEDBACK_FILE = path.join(ROOT, 'backend', 'feedback.json');

function readFeedback(): { items: any[] } {
    if (!fs.existsSync(FEEDBACK_FILE)) {
        fs.writeFileSync(FEEDBACK_FILE, JSON.stringify({ items: [] }, null, 2));
    }
    const raw = fs.readFileSync(FEEDBACK_FILE, 'utf-8');
    return JSON.parse(raw || '{"items": []}');
}

function writeFeedback(data: { items: any[] }) {
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
    const payload = await req.json();
    const content = String(payload.content || '').trim();
    const contact = String(payload.contact || '').trim();

    if (!content) {
        return new Response(JSON.stringify({ error: '请填写意见内容' }), { status: 400 });
    }

    const data = readFeedback();
    data.items.unshift({
        id: crypto.randomUUID(),
        content,
        contact,
        createdAt: new Date().toISOString(),
    });
    writeFeedback(data);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
