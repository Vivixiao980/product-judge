import { NextRequest } from 'next/server';
import { readCms, requireAdmin, writeCms, writePublishedCards } from '../../_lib';

export async function POST(req: NextRequest) {
    if (!(await requireAdmin())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const { id, status } = await req.json();
    const data = readCms();
    const idx = data.items.findIndex(item => item.id === id);
    if (idx === -1) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    }
    const nextStatus = status || 'published';
    data.items[idx] = {
        ...data.items[idx],
        status: nextStatus,
        updatedAt: new Date().toISOString(),
    };
    writeCms(data);
    writePublishedCards(data.items);
    return new Response(JSON.stringify(data.items[idx]), { status: 200 });
}
