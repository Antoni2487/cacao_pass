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

## 3. Wallet para sellar en Polygon

**No hay que crear ninguna cuenta en la blockchain.** Una wallet es solo un par de claves que se genera
en tu computadora. Lo único que necesita es un poco de POL para pagar el gas de cada sello.

1. **Elige la red** en `.env.local`:

   ```env
   NEXT_PUBLIC_RED_BLOCKCHAIN=polygon   # red principal (POL real). Usa "amoy" para la red de prueba.
   ```

   No la cambies después de sellar etapas: sus sellos quedan en la red anterior.

2. **Genera la wallet** desde la carpeta del proyecto (si ya tienes una, sáltate este paso):

   ```bash
   npm run wallet:nueva
   ```

   Muestra una **dirección pública** (`0x…`, se puede compartir) y una **clave privada** (secreta).
   Copia la clave privada en `.env.local`:

   ```env
   WALLET_PRIVATE_KEY=0x…
   ```

   No se guarda en ningún otro lado: si la pierdes, pierdes también el POL que tenga. Guárdala en un
   lugar seguro (por ejemplo, un gestor de contraseñas). **Quien tenga la clave privada controla el
   saldo:** nunca la pegues en una web, la compartas ni la subas a GitHub. Mantén en esta wallet solo
   unos pocos POL.

3. **RPC (conexión con la red): no hace falta configurarlo.** Si `RPC_URL` está vacío se usa el RPC
   público gratuito de publicnode para la red elegida. Si algún día falla, crea una cuenta gratuita en
   [Alchemy](https://www.alchemy.com), una app en la misma red (**Polygon Mainnet** o **Polygon
   Amoy**), y pega su URL HTTPS en `RPC_URL`.

4. **Carga POL en tu dirección pública.**
   - **Red principal (`polygon`):** compra 1-2 POL en un exchange (Binance, por ejemplo) y retíralos a
     la dirección pública. **Al retirar, elige la red "Polygon" / "Polygon PoS"**, nunca "Ethereum
     (ERC-20)": por esa red el POL llega a otra blockchain y la app no lo ve. Cada sello cuesta unos
     0.006 POL (noviembre de 2026), así que 2 POL alcanzan para más de 150 etapas.
   - **Red de prueba (`amoy`):** pide POL de prueba en un faucet ([Polygon](https://faucet.polygon.technology),
     [Alchemy](https://www.alchemy.com/faucets/polygon-amoy),
     [QuickNode](https://faucet.quicknode.com/polygon/amoy)). Hoy la mayoría exige tener saldo en la
     red real de Ethereum.

5. **Comprueba el saldo:**

   ```bash
   npm run wallet:saldo
   ```

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
   Lo mismo con `NEXT_PUBLIC_RED_BLOCKCHAIN`: debe ser `polygon` en Vercel y se fija al compilar.

### Evitar que Supabase se pause

En el plan gratuito, Supabase pausa los proyectos que pasan ~7 días sin actividad. Para que la demo siga
en línea hasta la exposición, el Día 3 se agrega un cron de Vercel que hace una consulta liviana una vez
al día.
