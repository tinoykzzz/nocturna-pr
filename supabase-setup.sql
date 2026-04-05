-- ============================================================
-- NOCTURNA PR - Configuración de Supabase
-- ============================================================
-- Ejecuta este SQL en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Datos del cliente
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  customer_postal TEXT,
  
  -- Pedido
  items JSONB NOT NULL,           -- [{name, price, quantity, size}, ...]
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_code TEXT,
  
  -- Estado
  status TEXT DEFAULT 'pendiente',  -- pendiente, confirmado, enviado, entregado
  notes TEXT,
  
  -- Referencia para WhatsApp
  order_number SERIAL UNIQUE
);

-- Índice para buscar por fecha
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Índice para buscar por estado
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Seguridad: solo la función create_order inserta (vía RPC)
-- Tú ves los pedidos en el Dashboard (usa service role)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo usuarios autenticados pueden leer"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo usuarios autenticados pueden actualizar estado"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Función para insertar pedido y devolver el número (evita problemas de RLS con SELECT)
CREATE OR REPLACE FUNCTION create_order(
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_customer_address TEXT,
  p_customer_city TEXT,
  p_customer_postal TEXT,
  p_items JSONB,
  p_subtotal DECIMAL,
  p_discount DECIMAL,
  p_total DECIMAL,
  p_coupon_code TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_number INTEGER;
BEGIN
  INSERT INTO orders (
    customer_name, customer_phone, customer_email,
    customer_address, customer_city, customer_postal,
    items, subtotal, discount, total, coupon_code
  ) VALUES (
    p_customer_name, p_customer_phone, p_customer_email,
    p_customer_address, p_customer_city, p_customer_postal,
    p_items, p_subtotal, p_discount, p_total, p_coupon_code
  )
  RETURNING order_number INTO v_order_number;
  RETURN v_order_number;
END;
$$;

-- Permitir que la web llame a la función
GRANT EXECUTE ON FUNCTION create_order(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB,DECIMAL,DECIMAL,DECIMAL,TEXT) TO anon;

-- ============================================================
-- NEWSLETTER - Suscriptores
-- ============================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- La API usa la clave anon: hace falta INSERT explícito además de la política RLS
GRANT INSERT ON newsletter_subscribers TO anon;

-- Solo permitir insert (anon puede suscribirse)
CREATE POLICY "Permitir suscripciones"
  ON newsletter_subscribers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Solo autenticados pueden leer (tú en el Dashboard)
CREATE POLICY "Solo auth puede leer newsletter"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (true);
