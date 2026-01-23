import { clearAdminSession } from '../_lib';

export async function POST() {
    await clearAdminSession();
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
