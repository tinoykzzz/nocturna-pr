# Panel de Admin - NOCTURNA PR

Panel para empleados: control de inventario y gestión de productos.

## Configuración

### 1. Ejecutar SQL en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) → tu proyecto → **SQL Editor**
2. Ejecuta el contenido de `supabase-admin-setup.sql`
3. **Importante:** En el SQL, reemplaza `'tu-email@ejemplo.com'` por tu email real (el que usarás para iniciar sesión)

### 2. Crear usuario admin en Supabase Auth

1. Supabase Dashboard → **Authentication** → **Users**
2. Clic en **Add user** → **Create new user**
3. Ingresa tu email y contraseña
4. Clic en **Create user**

### 3. Añadir tu email a admin_emails

Si no lo cambiaste en el SQL, ejecuta en SQL Editor:

```sql
INSERT INTO admin_emails (email) VALUES ('tu-email@ejemplo.com')
ON CONFLICT (email) DO NOTHING;
```

### 4. Acceder al panel

- URL: `https://tudominio.com/admin.html` (o `http://localhost:5173/admin.html` en desarrollo)
- **No enlaces esta URL** desde la web pública para mayor seguridad

## Funcionalidades

- **Productos:** Ver inventario, actualizar stock, agregar productos, eliminar
- **Pedidos:** Ver pedidos recientes, cambiar estado (pendiente → confirmado → enviado → entregado)

## Agregar productos

Al agregar un producto, la **imagen** debe ser una ruta a un archivo en `/public`. Por ejemplo:
- `/segundo-drop/nuevo-polo.jpeg` — sube el archivo a `public/segundo-drop/`

Las imágenes adicionales se separan por coma: `/img1.jpeg, /img2.jpeg`
