-- ============================================================
-- NOCTURNA PR - Admin Panel & Productos (Supabase)
-- ============================================================
-- Ejecuta este SQL DESPUÉS de supabase-setup.sql
-- En: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Tabla de productos (inventario)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  drop_name TEXT,
  new_item BOOLEAN DEFAULT false,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_drop ON products(drop_name);

-- Tabla de emails autorizados para admin (añade tu email aquí)
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IMPORTANTE: Reemplaza con tu email real para acceder al admin
INSERT INTO admin_emails (email) VALUES ('tu-email@ejemplo.com')
ON CONFLICT (email) DO NOTHING;

-- RLS para productos
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer productos (para la web pública)
CREATE POLICY "Productos visibles para todos"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Solo admins pueden insertar/actualizar/eliminar
CREATE POLICY "Solo admins pueden insertar productos"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admin_emails)
  );

CREATE POLICY "Solo admins pueden actualizar productos"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_emails));

CREATE POLICY "Solo admins pueden eliminar productos"
  ON products FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_emails));

-- Permitir que admins actualicen estado de pedidos
CREATE POLICY "Admins pueden actualizar pedidos"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admin_emails));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- IMPORTAR PRODUCTOS EXISTENTES (solo si la tabla está vacía)
-- ============================================================
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM products) = 0 THEN
INSERT INTO products (name, price, image, images, category, stock, drop_name, new_item, sort_order) VALUES
('SUPRA BEIGE', 45, '/segundo-drop/supra-beige.jpeg', ARRAY['/segundo-drop/supra-beige.jpeg','/segundo-drop/supra2-beige.jpeg'], 'polo', 5, 'segundo', false, 1),
('GODZILLA GTR', 50, '/segundo-drop/godzilla.jpeg', ARRAY['/segundo-drop/godzilla.jpeg','/segundo-drop/godzilla-2.jpeg'], 'polo', 7, 'segundo', false, 2),
('SILVIA S15', 45, '/segundo-drop/silvias15-1.jpeg', ARRAY['/segundo-drop/silvias15-1.jpeg','/segundo-drop/silvias15-2.jpeg'], 'polo', 10, 'segundo', false, 3),
('NISSAN 180SX', 48, '/segundo-drop/nissanlust-1.jpeg', ARRAY['/segundo-drop/nissanlust-1.jpeg','/segundo-drop/nissanlust-2.jpeg'], 'polo', 4, 'segundo', false, 4),
('MAZDA RX7', 50, '/segundo-drop/mazdarx7-1.jpeg', ARRAY['/segundo-drop/mazdarx7-1.jpeg','/segundo-drop/mazdarx7-2.jpeg'], 'polo', 6, 'segundo', false, 5),
('FUTURE BLACK', 55, '/tercer-drop/blackfuture-1.jpeg', '{}', 'polo', 8, 'tercer', true, 6),
('FUTURE GRAY', 55, '/tercer-drop/grayfuture-1.jpeg', '{}', 'polo', 10, 'tercer', true, 7),
('FUTURE WHITE', 55, '/tercer-drop/whitefuture-1.jpeg', '{}', 'polo', 12, 'tercer', true, 8),
('GTR R35 NISMO', 55, '/tercer-drop/gt35-1.jpeg', '{}', 'polo', 5, 'tercer', true, 9),
('SUPRA MK4', 55, '/tercer-drop/supramk4-1.jpeg', '{}', 'polo', 6, 'tercer', true, 10),
('MAZDA RX7 V2', 55, '/tercer-drop/mazdarx7-1.jpeg', '{}', 'polo', 7, 'tercer', true, 11),
('WEST COAST CHOPPERS', 50, '/primer-drop/producto-principal.jpeg', '{}', 'polo', 3, 'primer', false, 12),
('KHAMRA', 89, '/perfumes-drop/perfume-khamra/product-khamra.png', ARRAY['/perfumes-drop/perfume-khamra/product-khamra.png','/perfumes-drop/perfume-khamra/khamra.png'], 'perfume', 15, NULL, false, 13),
('SCEPTRE', 95, '/perfumes-drop/perfume-sceptre/product-sceptre.png', ARRAY['/perfumes-drop/perfume-sceptre/product-sceptre.png','/perfumes-drop/perfume-sceptre/sceptre.png'], 'perfume', 8, NULL, false, 14),
('WANTED', 78, '/perfumes-drop/perfume-mostwanted/product-mostwanted.png', ARRAY['/perfumes-drop/perfume-mostwanted/product-mostwanted.png','/perfumes-drop/perfume-mostwanted/azzaro.png'], 'perfume', 20, NULL, false, 15),
('NUIT', 85, '/perfumes-drop/perfume-nuit/product-nuit.png', ARRAY['/perfumes-drop/perfume-nuit/product-nuit.png','/perfumes-drop/perfume-nuit/nuit.png'], 'perfume', 11, NULL, false, 16),
('AQUA', 72, '/perfumes-drop/perfume-aqua/product-aqua.png', ARRAY['/perfumes-drop/perfume-aqua/product-aqua.png','/perfumes-drop/perfume-aqua/aqua.png'], 'perfume', 25, NULL, false, 17),
('WITH YOU', 82, '/perfumes-drop/perfume-with/product-with.png', ARRAY['/perfumes-drop/perfume-with/product-with.png','/perfumes-drop/perfume-with/with.png'], 'perfume', 6, NULL, false, 18),
('MANGO', 68, '/perfumes-drop/perfume-mango/product-mango.png', ARRAY['/perfumes-drop/perfume-mango/product-mango.png','/perfumes-drop/perfume-mango/mango.png'], 'perfume', 30, NULL, false, 19),
('HARAMAIN', 98, '/perfumes-drop/perfume-haramain/producto-haramain.png', ARRAY['/perfumes-drop/perfume-haramain/producto-haramain.png','/perfumes-drop/perfume-haramain/haramain.png'], 'perfume', 5, NULL, false, 20),
('BIVIDI BLANCO', 35, '/quinto-drop/bividi-blanco.jpeg', '{}', 'bividi', 12, NULL, true, 21),
('BIVIDI GRIS', 35, '/quinto-drop/bividi-gris.jpeg', '{}', 'bividi', 15, NULL, true, 22),
('BIVIDI NEGRO', 35, '/quinto-drop/bividi-negro.jpeg', '{}', 'bividi', 10, NULL, true, 23),
('BLANCO V2', 38, '/quinto-drop/blanco-2.jpeg', '{}', 'bividi', 8, NULL, true, 24),
('GRIS V2', 38, '/quinto-drop/gris-2.jpeg', '{}', 'bividi', 9, NULL, true, 25),
('NEGRO V2', 38, '/quinto-drop/negro-2.jpeg', '{}', 'bividi', 14, NULL, true, 26),
('TRES EDICIÓN', 40, '/quinto-drop/tres.jpeg', '{}', 'bividi', 5, NULL, true, 27),
('BERMUDAS BAGGY BLANCO', 42, '/cuarto-drop/short-blanco.jpeg', '{}', 'short', 18, 'cuarto', true, 28),
('BERMUDAS BAGGY CAFÉ', 42, '/cuarto-drop/short-cafe.jpeg', '{}', 'short', 16, 'cuarto', true, 29),
('BERMUDAS BAGGY NEGRO', 42, '/cuarto-drop/short-negro.jpeg', '{}', 'short', 20, 'cuarto', true, 30),
('SPACE BLACK', 48, '/drop-space/black-space.jpeg', '{}', 'polo', 10, 'space', false, 31),
('SPACE WHITE', 48, '/drop-space/white-space.jpeg', '{}', 'polo', 12, 'space', false, 32),
('SPACE RED', 48, '/drop-space/red-space.jpeg', '{}', 'polo', 8, 'space', false, 33),
('BLACK POLERA', 99, '/drop-poleras/blackpolera-1.jpeg', '{}', 'polera', 5, 'poleras', false, 34);
  END IF;
END $$;
