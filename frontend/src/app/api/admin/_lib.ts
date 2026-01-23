import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = '/Users/vivi/Documents/产品思考工具';
const CMS_FILE = path.join(ROOT, 'backend', 'sparks_cms.json');
const PUBLISHED_CARDS = path.join(ROOT, 'frontend', 'src', 'data', 'cards.cms.json');

export type CmsStatus = 'draft' | 'pending' | 'approved' | 'published';

export interface CmsItem {
    id: string;
    title: string;
    category: string;
    content: string;
    source?: string;
    tags: string[];
    fullArticle?: string;
    status: CmsStatus;
    createdAt: string;
    updatedAt: string;
}

const ADMIN_COOKIE = 'admin_session';

export async function requireAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value || '';
    if (!token) return false;
    const secret = process.env.ADMIN_PASSWORD || '';
    const expected = crypto.createHash('sha256').update(secret).digest('hex');
    return token === expected;
}

export async function setAdminSession() {
    const secret = process.env.ADMIN_PASSWORD || '';
    const token = crypto.createHash('sha256').update(secret).digest('hex');
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
    });
}

export async function clearAdminSession() {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
}

export function readCms(): { items: CmsItem[] } {
    if (!fs.existsSync(CMS_FILE)) {
        fs.writeFileSync(CMS_FILE, JSON.stringify({ items: [] }, null, 2));
    }
    const raw = fs.readFileSync(CMS_FILE, 'utf-8');
    return JSON.parse(raw || '{"items": []}');
}

export function writeCms(data: { items: CmsItem[] }) {
    fs.writeFileSync(CMS_FILE, JSON.stringify(data, null, 2));
}

export function writePublishedCards(items: CmsItem[]) {
    const published = items.filter(item => item.status === 'published');
    const cards = published.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        content: item.content,
        author: 'Sparks',
        source: item.source || '',
        tags: item.tags || [],
        fullArticle: item.fullArticle || item.content,
        updatedAt: item.updatedAt,
    }));
    fs.writeFileSync(PUBLISHED_CARDS, JSON.stringify(cards, null, 2));
}

export function ensurePublishedCards() {
    if (!fs.existsSync(PUBLISHED_CARDS)) {
        fs.writeFileSync(PUBLISHED_CARDS, '[]');
    }
}
