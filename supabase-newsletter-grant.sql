-- Si el formulario de newsletter devuelve error de permisos, ejecuta esto en
-- Supabase → SQL Editor (una vez por proyecto).

GRANT INSERT ON newsletter_subscribers TO anon;
