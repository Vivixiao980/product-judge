import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { requireAdmin } from '../_lib';
import crypto from 'crypto';

const DEFAULT_BUCKET = process.env.CMS_IMAGE_BUCKET || 'cms-images';

function getExtension(filename: string) {
  const idx = filename.lastIndexOf('.');
  if (idx === -1) return '';
  return filename.slice(idx + 1).toLowerCase();
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const blob = file as Blob;
  const filename = (file as File).name || 'upload';
  const ext = getExtension(filename);
  const safeExt = ext ? `.${ext}` : '';
  const path = `sparks/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}${safeExt}`;

  const { error } = await supabaseAdmin.storage
    .from(DEFAULT_BUCKET)
    .upload(path, blob, {
      contentType: (file as File).type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from(DEFAULT_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
