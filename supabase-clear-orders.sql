-- =============================================================================
-- Vaciar todos los pedidos (Supabase SQL Editor)
-- =============================================================================
-- Borra filas de prueba o histórico; reinicia el contador order_number.
-- ¡Irreversible! Haz copia de seguridad si necesitas conservar datos.
-- =============================================================================

TRUNCATE TABLE orders RESTART IDENTITY;
