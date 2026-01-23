import { NextRequest } from 'next/server';
import { setAdminSession } from '../_lib';

export async function POST(req: NextRequest) {
    const { password } = await req.json();
    const secret = process.env.ADMIN_PASSWORD || '';
    if (!secret || password !== secret) {
        return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401 });
    }
    await setAdminSession();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
