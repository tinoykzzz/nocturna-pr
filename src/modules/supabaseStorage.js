/** Bucket por defecto; debe existir en Supabase Storage y ser público (o con políticas de lectura). */
export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'product-images';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function safeFileName(original) {
  const base = (original || 'imagen').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return base || 'imagen.jpg';
}

/**
 * Sube un archivo al bucket del catálogo y devuelve la URL pública.
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {File} file
 * @param {string} [subfolder='catalog']
 */
export async function uploadCatalogImage(client, file, subfolder = 'catalog') {
  if (!client) return { url: null, error: new Error('Supabase no configurado') };
  if (!file?.size) return { url: null, error: new Error('Archivo vacío') };
  if (file.size > MAX_BYTES) {
    return { url: null, error: new Error('La imagen supera 5 MB') };
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeFileName(file.name)}`;
  const path = `${subfolder.replace(/\/$/, '')}/${name}`;

  const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) return { url: null, error };

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data?.publicUrl || null, error: data?.publicUrl ? null : new Error('Sin URL pública') };
}

export function canUploadToSupabase(client) {
  return Boolean(client && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}
