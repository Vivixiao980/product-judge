import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../_lib';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import crypto from 'crypto';

const normalizeStatus = (status: string) => {
    if (status === 'approved' || status === 'draft') return 'pending';
    return status;
};

const mapCmsItem = (row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    source: row.source || '',
    tags: row.tags || [],
    fullArticle: row.full_article || '',
    status: normalizeStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export async function GET() {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const { data, error } = await supabaseAdmin
        .from('cms_items')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const items = (data || []).map(mapCmsItem);
    return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const payload = await req.json();
    const item = {
        id: crypto.randomUUID(),
        title: payload.title || '未命名',
        category: payload.category || '其他',
        content: payload.content || '',
        source: payload.source || '',
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        full_article: payload.fullArticle || '',
        status: normalizeStatus(payload.status || 'pending'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseAdmin
        .from('cms_items')
        .insert(item)
        .select('*')
        .single();
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(mapCmsItem(data));
}
