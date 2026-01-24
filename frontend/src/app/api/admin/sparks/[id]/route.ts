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

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const { id } = await params;
    const payload = await req.json();
    const updatePayload: Record<string, unknown> = {
        title: payload.title,
        category: payload.category,
        content: payload.content,
        source: payload.source || '',
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        full_article: payload.fullArticle || '',
        updated_at: new Date().toISOString(),
    };
    if (payload.status) {
        updatePayload.status = normalizeStatus(payload.status);
    }
    const { data, error } = await supabaseAdmin
        .from('cms_items')
        .update(updatePayload)
        .eq('id', id)
        .select('*')
        .single();
    if (error) {
        const status = error.code === 'PGRST116' ? 404 : 500;
        return NextResponse.json({ error: error.message }, { status });
    }
    if (!data) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(mapCmsItem(data));
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const { id } = await params;
    const { error } = await supabaseAdmin.from('cms_items').delete().eq('id', id);
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}
