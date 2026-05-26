import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for Supabase Storage`);
  return value;
}

let client;
let bucketReady;

function supabase() {
  if (!client) {
    client = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
      realtime: { transport: WebSocket }
    });
  }
  return client;
}

export function storageBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'passage-pdfs';
}

async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const bucket = storageBucket();
      const { error: getError } = await supabase().storage.getBucket(bucket);
      if (!getError) return;
      const { error: createError } = await supabase().storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 25 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf']
      });
      if (createError && !/already exists/i.test(createError.message)) {
        throw new Error(`Supabase bucket setup failed: ${createError.message}`);
      }
    })();
  }
  return bucketReady;
}

export function makeStoragePath(originalName) {
  const safeName = String(originalName || 'passage.pdf').replace(/[^a-zA-Z0-9_.-]/g, '-');
  return `pdfs/${Date.now()}-${safeName}`;
}

export async function uploadPdfBuffer({ path, buffer, contentType = 'application/pdf' }) {
  await ensureBucket();
  const { error } = await supabase().storage.from(storageBucket()).upload(path, buffer, {
    contentType,
    upsert: false
  });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  return path;
}

export async function signedPdfUrl(path) {
  await ensureBucket();
  const { data, error } = await supabase().storage.from(storageBucket()).createSignedUrl(path, 60 * 10, {
    download: true
  });
  if (error || !data?.signedUrl) throw new Error(`Supabase download failed: ${error?.message || 'Missing signed URL'}`);
  return data.signedUrl;
}

export async function removePdfObject(path) {
  if (!path) return;
  await ensureBucket();
  const { error } = await supabase().storage.from(storageBucket()).remove([path]);
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}
