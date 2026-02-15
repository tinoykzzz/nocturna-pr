# Configuración de Supabase para NOCTURNA PR

## 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Clic en **New Project**
3. Nombre: `nocturna-pr` (o el que prefieras)
4. Crea una contraseña para la base de datos (guárdala)
5. Elige la región más cercana (ej: South America)
6. Clic en **Create new project** (tarda 1-2 min)

## 2. Crear la tabla de pedidos

1. En el dashboard, ve a **SQL Editor**
2. Clic en **New Query**
3. Copia y pega todo el contenido de `supabase-setup.sql`
4. Clic en **Run** (o Ctrl+Enter)

## 3. Obtener las credenciales

1. Ve a **Settings** (icono engranaje) → **API**
2. Copia:
   - **Project URL** → será tu `VITE_SUPABASE_URL`
   - **anon public** (bajo Project API keys) → será tu `VITE_SUPABASE_ANON_KEY`

## 4. Configurar el proyecto local

1. Copia `.env.example` a `.env`:
   ```
   cp .env.example .env
   ```
   (En Windows: `copy .env.example .env`)

2. Edita `.env` y pega tus credenciales:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Reinicia el servidor de desarrollo: `npm run dev`

## 5. Ver pedidos y suscriptores

- **Pedidos:** Table Editor → tabla `orders`
- **Newsletter:** Table Editor → tabla `newsletter_subscribers`
- Cada pedido incluye: cliente, productos, total, estado, número de orden
- Puedes filtrar, exportar a CSV, cambiar estado (pendiente → enviado → entregado)

## 6. Políticas de seguridad (RLS)

- La web puede **insertar** pedidos (clientes completan el checkout)
- Solo tú (autenticado en Supabase) puedes **leer** los pedidos
- Los clientes no pueden ver pedidos de otros
