# 03 · Guía de instalación y despliegue

Todo funciona con planes gratuitos. Sigue los pasos en orden.

## 1. Supabase (base de datos y login)

1. Crea una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo. Región sugerida:
   **South America (São Paulo)**. Guarda la contraseña de la base de datos.
2. Ve a **SQL Editor → New query**, pega todo el contenido de
   `supabase/migrations/20261115000000_esquema_inicial.sql` y presiona **Run**. Debe terminar sin
   errores.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secreta) → `SUPABASE_SERVICE_ROLE_KEY`
4. En **Authentication → Sign In / Providers → Email**, desactiva **"Allow new users to sign up"**. El
   panel no tiene registro público: los usuarios los creas tú.

### Crear los usuarios del panel

En **Authentication → Users → Add user → Create new user**:

- Escribe el correo y la contraseña, y marca **Auto Confirm User**.
- Después de crearlo, el perfil queda como **operador** por defecto. Para hacerlo administrador, en el
  **SQL Editor** ejecuta:

```sql
update public.usuarios
set nombre = 'Lucía Paredes', rol = 'admin'
where id = (select id from auth.users where email = 'lucia@ejemplo.com');
```

Para la demo, crea al menos un **admin** (registra productores y lotes) y un **operador** (registra
etapas).

## 2. Variables de entorno locales

```bash
cp .env.example .env.local
```

Completa los valores de Supabase. `NEXT_PUBLIC_SITE_URL` queda en `http://localhost:3000` en local.

Luego:

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>; te llevará al login.

> **Regla de seguridad:** las variables que empiezan con `NEXT_PUBLIC_` llegan al navegador. Por eso
> `SUPABASE_SERVICE_ROLE_KEY` y `WALLET_PRIVATE_KEY` **no** llevan ese prefijo. Nunca subas
> `.env.local` a GitHub (ya está en `.gitignore`).

## 3. Wallet de prueba en Polygon Amoy (preparar antes del Día 2)

Consigue los POL de prueba con anticipación: algunos faucets tienen requisitos o límites diarios.

1. **Crea una wallet nueva solo para este proyecto.** La forma más simple, desde la carpeta del proyecto
   una vez instalado ethers (Día 2):

   ```bash
   node -e "const {Wallet}=require('ethers');const w=Wallet.createRandom();console.log('Dirección:',w.address);console.log('Clave privada:',w.privateKey)"
   ```

   Guarda la clave privada en `WALLET_PRIVATE_KEY` de `.env.local`. **No uses nunca una wallet con
   dinero real.**

2. **RPC:** crea una cuenta gratuita en [Alchemy](https://www.alchemy.com), crea una app en la red
   **Polygon Amoy** y copia la URL HTTPS en `AMOY_RPC_URL`.
3. **Fondos de prueba:** pide POL de Amoy para la dirección de tu wallet en algún faucet, por ejemplo
   el [faucet oficial de Polygon](https://faucet.polygon.technology) o el de Alchemy. Cada sellado
   gasta una cantidad mínima; 0.1 POL de prueba alcanza para cientos de etapas.
4. Comprueba el saldo buscando tu dirección en [amoy.polygonscan.com](https://amoy.polygonscan.com).

## 4. Despliegue en Vercel (Día 3)

1. Entra a [vercel.com](https://vercel.com) con tu cuenta de GitHub e importa el repositorio
   `cacao_pass`.
2. En **Settings → Environment Variables** agrega las mismas variables de `.env.local`, cambiando
   `NEXT_PUBLIC_SITE_URL` por la URL final (por ejemplo `https://cacaopass.vercel.app`).
3. En **Settings → Git**, la rama de producción es `main`. Cada push a `main` despliega
   automáticamente.
4. Importante: **genera los QR después** de fijar `NEXT_PUBLIC_SITE_URL`, porque la URL va dentro del
   QR.

### Evitar que Supabase se pause

En el plan gratuito, Supabase pausa los proyectos que pasan ~7 días sin actividad. Para que la demo siga
en línea hasta la exposición, el Día 3 se agrega un cron de Vercel que hace una consulta liviana una vez
al día.
