-- =============================================================================
-- Supabase Storage — políticas para el bucket de imágenes del catálogo
-- =============================================================================
-- 1) En el Dashboard: Storage → Create bucket
--    - Name: product-images  (o el valor de VITE_SUPABASE_STORAGE_BUCKET)
--    - Public bucket: ON  (para que la tienda cargue imágenes sin firmar URLs)
--    - File size limit: 5 MB (opcional)
--    - Allowed MIME: image/jpeg, image/png, image/webp, image/gif
--
-- 2) Ejecuta este script en SQL Editor (ajusta el id del bucket si cambiaste el nombre)

-- Lectura pública de objetos del bucket
DROP POLICY IF EXISTS "Lectura pública imágenes catálogo" ON storage.objects;
CREATE POLICY "Lectura pública imágenes catálogo"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Subida solo usuarios autenticados (recomendado con Supabase Auth en la intranet)
DROP POLICY IF EXISTS "Subida autenticados catálogo" ON storage.objects;
CREATE POLICY "Subida autenticados catálogo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- -----------------------------------------------------------------------------
-- Desarrollo: si entras a la intranet en modo demo SIN sesión Supabase Auth,
-- la subida fallará hasta que añadas UNA de estas opciones:
-- a) Iniciar sesión con email/contraseña real (modo production + Auth), o
-- b) Política temporal para anon (NO en producción):
--
-- CREATE POLICY "Dev anon upload catalog" ON storage.objects FOR INSERT TO anon
--   WITH CHECK (bucket_id = 'product-images');
-- -----------------------------------------------------------------------------
