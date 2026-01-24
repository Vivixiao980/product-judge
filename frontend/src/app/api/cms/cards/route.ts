import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

const mapCard = (row: any) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    author: 'Sparks',
    source: row.source || '',
    tags: row.tags || [],
    fullArticle: row.full_article || row.content,
    updatedAt: row.updated_at,
});

export async function GET() {
    if (!isSupabaseConfigured || !supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }
    const { data, error } = await supabaseAdmin
        .from('cms_items')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ cards: (data || []).map(mapCard) });
}
