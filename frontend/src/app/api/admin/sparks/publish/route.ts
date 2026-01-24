import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../_lib';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

const normalizeStatus = (status: string) => (status === 'approved' ? 'pending' : status);

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

export async function POST(req: NextRequest) {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const { id, status } = await req.json();
    const nextStatus = normalizeStatus(status || 'published');
    const { data, error } = await supabaseAdmin
        .from('cms_items')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();
    if (error) {
        const statusCode = error.code === 'PGRST116' ? 404 : 500;
        return NextResponse.json({ error: error.message }, { status: statusCode });
    }
    if (!data) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(mapCmsItem(data));
}
