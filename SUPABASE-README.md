# Guía completa de Supabase — NOCTURNA PR

Configuración paso a paso para pedidos, newsletter, productos y panel admin.

---

## PASO 1: Crear proyecto en Supabase

1. Entra en [supabase.com](https://supabase.com) e inicia sesión.
2. **New Project**
3. **Name:** `nocturna-pr` (o el que prefieras)
4. **Database Password:** crea una contraseña y guárdala.
5. **Region:** South America (São Paulo) o la más cercana.
6. **Create new project** (puede tardar 1–2 minutos).

---

## PASO 2: Ejecutar SQL — Base de datos

### 2.1 Tablas principales (pedidos y newsletter)

1. En el dashboard: **SQL Editor** → **New Query**
2. Copia todo el contenido de `supabase-setup.sql`
3. **Run** (o Ctrl+Enter)
4. Debe aparecer: "Success. No rows returned"

### 2.2 Tablas de admin y productos

1. En **SQL Editor** → **New Query**
2. Copia todo el contenido de `supabase-admin-setup.sql`
3. **Antes de ejecutar:** cambia `'tu-email@ejemplo.com'` por tu email real (línea ~37)
4. **Run**
5. Debe aparecer: "Success"

---

## PASO 3: Obtener credenciales

1. **Settings** (engranaje) → **API**
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys** → **anon public** → `VITE_SUPABASE_ANON_KEY`

---

## PASO 4: Configurar el proyecto local

### 4.1 Crear archivo .env

En la carpeta `web`:

**Windows (PowerShell):**
```powershell
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

### 4.2 Editar .env

Abre `.env` y pega tus credenciales:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```

### 4.3 Reiniciar el servidor

```bash
npm run dev
```

---

## PASO 5: Crear usuario admin (para el panel)

1. **Authentication** → **Users** → **Add user**
2. **Create new user**
3. **Email:** el mismo que pusiste en `admin_emails`
4. **Password:** crea una contraseña segura
5. **Create user**

---

## PASO 6: Despliegue (Vercel, Netlify, etc.)

Añade las variables de entorno en tu plataforma:

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | https://tu-proyecto.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | tu anon key |

**Vercel:** Project → Settings → Environment Variables  
**Netlify:** Site settings → Build & deploy → Environment

---

## Resumen de tablas

| Tabla | Uso |
|-------|-----|
| `orders` | Pedidos del checkout (cliente, productos, total, estado) |
| `newsletter_subscribers` | Emails del newsletter |
| `products` | Catálogo e inventario (usado por la web y el admin) |
| `admin_emails` | Emails autorizados para el panel admin |

---

## Ver datos en Supabase

- **Pedidos:** Table Editor → `orders`
- **Newsletter:** Table Editor → `newsletter_subscribers`
- **Productos:** Table Editor → `products`

---

## Seguridad (RLS)

- **Pedidos:** solo insert desde la web (anon); lectura y actualización solo para admins autenticados.
- **Newsletter:** solo insert desde la web; lectura solo para usuarios autenticados.
- **Productos:** lectura pública; crear/editar/eliminar solo para admins.

---

## Solución de problemas

### "Error: relation 'products' does not exist"
→ Ejecuta `supabase-admin-setup.sql`.

### "Invalid login credentials" en el admin
→ Comprueba que el email esté en `admin_emails` y que el usuario exista en Authentication → Users.

### La web no guarda pedidos
→ Revisa que `.env` tenga las variables correctas y que hayas ejecutado `supabase-setup.sql`.
