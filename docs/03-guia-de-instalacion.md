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

## 3. Wallet de prueba en Polygon Amoy

**No hay que crear ninguna cuenta en la blockchain.** Una wallet es solo un par de claves que se genera
en tu computadora. Lo único que puede pedirte un registro es el _faucet_ que regala las monedas de
prueba.

1. **Genera la wallet** desde la carpeta del proyecto:

   ```bash
   npm run wallet:nueva
   ```

   Muestra una **dirección pública** (`0x…`, se puede compartir) y una **clave privada** (secreta).
   Copia la clave privada en `.env.local`:

   ```env
   WALLET_PRIVATE_KEY=0x…
   ```

   No se guarda en ningún otro lado: si la pierdes, generas otra y vuelves a pedir fondos. **Nunca
   uses una wallet con dinero real.**

2. **RPC (conexión con la red): no hace falta configurarlo.** Si `AMOY_RPC_URL` está vacío se usa el
   RPC público gratuito `https://polygon-amoy-bor-rpc.publicnode.com`. Si algún día falla, crea una
   cuenta gratuita en [Alchemy](https://www.alchemy.com), una app en la red **Polygon Amoy**, y pega
   su URL HTTPS en `AMOY_RPC_URL`.

3. **Pide POL de prueba** para tu **dirección pública** (nunca pegues la clave privada en una web) en
   alguno de estos faucets. Los requisitos cambian seguido (algunos piden iniciar sesión o tener un
   saldo mínimo en la red real); si uno no te deja, prueba el siguiente:
   - [Polygon](https://faucet.polygon.technology)
   - [Alchemy](https://www.alchemy.com/faucets/polygon-amoy)
   - [QuickNode](https://faucet.quicknode.com/polygon/amoy)
   - [Chainlink](https://faucets.chain.link/polygon-amoy)

4. **Comprueba el saldo:**

   ```bash
   npm run wallet:saldo
   ```

   Cada sellado cuesta unos 0.0007 POL de prueba, así que 0.1 POL alcanza para unas 150 etapas.

Si la wallet se queda sin saldo, el registro de la etapa no se pierde: queda guardada como pendiente
y el detalle del lote muestra el botón **Reintentar sellado**.

## 4. Despliegue en Vercel (Día 3)

1. Entra a [vercel.com](https://vercel.com) con tu cuenta de GitHub e importa el repositorio
   `cacao_pass`.
2. En **Settings → Environment Variables** agrega las mismas variables de `.env.local`, cambiando
   `NEXT_PUBLIC_SITE_URL` por la URL final (por ejemplo `https://cacaopass.vercel.app`).
3. En **Settings → Git**, la rama de producción es `main`. Cada push a `main` despliega
   automáticamente.
4. Importante: la URL que va dentro del QR sale de `NEXT_PUBLIC_SITE_URL` y **se fija al compilar**.
   Si la cambias en Vercel, vuelve a desplegar (Deployments → Redeploy) antes de imprimir los QR.

### Evitar que Supabase se pause

En el plan gratuito, Supabase pausa los proyectos que pasan ~7 días sin actividad. Para que la demo siga
en línea hasta la exposición, el Día 3 se agrega un cron de Vercel que hace una consulta liviana una vez
al día.
