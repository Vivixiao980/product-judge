import { cookies } from 'next/headers';
import crypto from 'crypto';

export type CmsStatus = 'draft' | 'pending' | 'published';

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
