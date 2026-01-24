import { NextRequest } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    const payload = await req.json();
    const content = String(payload.content || '').trim();
    const contact = String(payload.contact || '').trim();

    if (!content) {
        return new Response(JSON.stringify({ error: '请填写意见内容' }), { status: 400 });
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
        return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 503 });
    }

    const { error } = await supabaseAdmin.from('feedback_items').insert({
        content,
        contact,
        source: 'site',
    });

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
