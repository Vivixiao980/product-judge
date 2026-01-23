import { NextRequest } from 'next/server';
import { readCms, requireAdmin, writeCms, writePublishedCards } from '../../_lib';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const { id } = await params;
    const payload = await req.json();
    const data = readCms();
    const idx = data.items.findIndex(item => item.id === id);
    if (idx === -1) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    const existing = data.items[idx];
    const updated = {
        ...existing,
        ...payload,
        tags: Array.isArray(payload.tags) ? payload.tags : existing.tags,
        updatedAt: new Date().toISOString(),
    };
    data.items[idx] = updated;
    writeCms(data);
    writePublishedCards(data.items);
    return new Response(JSON.stringify(updated), { status: 200 });
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const { id } = await params;
    const data = readCms();
    data.items = data.items.filter(item => item.id !== id);
    writeCms(data);
    writePublishedCards(data.items);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
