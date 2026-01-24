import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env.local');
const SOURCE_PATH = path.join(ROOT, '..', 'backend', 'sparks_cms.json');

function loadEnvFromFile() {
    if (!fs.existsSync(ENV_PATH)) return;
    const raw = fs.readFileSync(ENV_PATH, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

async function main() {
    loadEnvFromFile();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    if (!fs.existsSync(SOURCE_PATH)) {
        throw new Error(`Missing source file: ${SOURCE_PATH}`);
    }
    const raw = fs.readFileSync(SOURCE_PATH, 'utf-8');
    const parsed = JSON.parse(raw || '{"items": []}');
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const now = new Date().toISOString();

    const rows = items.map((item) => ({
        id: item.id,
        title: item.title || '未命名',
        category: item.category || '其他',
        content: item.content || '',
        source: item.source || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        full_article: item.fullArticle || '',
        status: item.status || 'pending',
        created_at: item.createdAt || now,
        updated_at: item.updatedAt || now,
    }));

    const supabase = createClient(supabaseUrl, serviceKey);
    const batches = chunkArray(rows, 200);
    let inserted = 0;

    for (const batch of batches) {
        const { error } = await supabase
            .from('cms_items')
            .upsert(batch, { onConflict: 'id' });
        if (error) {
            throw new Error(error.message);
        }
        inserted += batch.length;
    }

    console.log(`Imported ${inserted} CMS items into Supabase.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
