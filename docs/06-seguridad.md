# Seguridad

Qué protege a CacaoPass, cómo se probó y qué riesgos quedan conocidos.

## Capas de protección

| Riesgo                                     | Protección                                                                                                                                                     | Dónde                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Alguien entra al panel sin cuenta          | El middleware valida el JWT de Supabase (`getClaims`) y redirige al login. El registro público de usuarios está desactivado en Supabase.                       | `src/lib/supabase/middleware.ts`                                             |
| Alguien lee o cambia datos con la anon key | Row Level Security en todas las tablas: sin sesión no se lee nada; crear o editar productores, parcelas y lotes solo lo puede hacer un admin.                  | `supabase/migrations/…_esquema_inicial.sql`                                  |
| Alguien sella etapas y gasta el POL        | `POST /api/etapas` y `/sellar` exigen sesión (401 sin ella). La clave de la wallet solo existe en el servidor.                                                 | `src/app/api/etapas/`                                                        |
| Archivos maliciosos como evidencia         | Máximo 3 archivos y 4 MB; se revisan los primeros bytes de cada archivo, no solo el tipo que declara el navegador. El bucket solo acepta JPG, PNG, WEBP y PDF. | `src/lib/validaciones/etapa.ts`, migración `…_limitar_bucket_evidencias.sql` |
| Redirección a otro sitio tras el login     | El parámetro `siguiente` solo se acepta si empieza con `/panel`.                                                                                               | `src/app/login/actions.ts`                                                   |
| Inyección en la URL del lote               | El código se valida con una expresión regular antes de tocar la base de datos; las consultas usan el cliente de Supabase (parametrizadas).                     | `PATRON_CODIGO_LOTE` en `src/lib/qr.ts`                                      |
| Uso indebido del cron                      | Exige `Authorization: Bearer CRON_SECRET`, comparado en tiempo constante.                                                                                      | `src/app/api/cron/mantener-activo/route.ts`                                  |
| Clickjacking, XSS, sniffing                | Cabeceras HTTP en todas las respuestas: CSP, `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`.                                | `next.config.ts`                                                             |
| Fuga de información en errores             | Las API responden un mensaje genérico; el detalle solo va al log del servidor. La API de verificación solo expone hashes y estados.                            | `src/lib/api.ts`                                                             |

## Cómo se probó (24/11/2026)

Contra un build de producción (`npm run build && npm start`):

- **Cabeceras:** las 6 cabeceras de seguridad están presentes y no se envía `X-Powered-By`.
- **Control de acceso:** `/panel` sin sesión o con una cookie inventada redirige al login.
  `POST /api/etapas`, `/sellar` y el cron sin credenciales responden 401.
- **Entradas:** códigos de lote con inyección SQL, `<script>` o `../` responden 400 o 404, nunca 500.
- **Fugas:** la API de verificación no devuelve historia, coordenadas ni correos; los errores no muestran trazas.
- **Bundle del navegador:** se buscó la service role key, la clave de la wallet, `CRON_SECRET` y la URL de Alchemy en `.next/static`: no aparecen.
- **CSP:** las páginas públicas y el login cargan sin errores en consola (incluido el mapa de OpenStreetMap).
- **Pruebas automáticas:** `npm test` incluye casos de archivos falsificados (un HTML disfrazado de PNG es rechazado).

## Riesgos conocidos

- **`npm audit`** reporta una vulnerabilidad de PostCSS dentro de Next.js 15. Afecta el procesamiento de CSS
  en tiempo de compilación (solo se procesa nuestro propio CSS), no al sitio en producción. La corrección
  exige pasar a Next.js 16, que es un cambio mayor: queda para después de la entrega.
- **Sin límite de peticiones propio:** cada visita a un pasaporte consulta la blockchain y registra un
  escaneo. Vercel ya filtra ataques de volumen; si hiciera falta, se puede activar su Firewall con un
  límite por IP para `/lote/*`.
- **CSP con `'unsafe-inline'`:** Next.js lo necesita sin nonces. Pasar a nonces obligaría a renderizar
  todas las páginas en cada petición, incluida la portada que hoy se cachea.
