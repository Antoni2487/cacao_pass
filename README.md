# CacaoPass

Trazabilidad verificable del cacao peruano. Cada lote de exportación recibe un **QR** que abre su
"pasaporte digital": origen, productor, parcela y recorrido hasta el puerto. Cada etapa del recorrido
se **sella en blockchain** (Polygon Amoy) para demostrar que los datos no fueron alterados.

Demo para el curso _Innovación y Desarrollo Tecnológico_ (caso Machu Picchu Foods).

## Stack

| Pieza | Tecnología |
| --- | --- |
| Web + API | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos, login y archivos | Supabase (PostgreSQL + Auth + Storage) |
| Blockchain | Polygon Amoy (testnet) con ethers.js v6 |
| Despliegue | Vercel |

## Instalación local

Requisitos: Node.js 20 o superior y una cuenta gratuita en [Supabase](https://supabase.com).

```bash
git clone https://github.com/Antoni2487/cacao_pass.git
cd cacao_pass
npm install
cp .env.example .env.local   # y completa los valores
npm run dev                  # http://localhost:3000
```

La configuración de Supabase (tablas, usuarios y roles) está en
[docs/03-guia-de-instalacion.md](docs/03-guia-de-instalacion.md).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Revisión de tipos de TypeScript |
| `npm run format` | Formatea el código con Prettier |

## Flujo de trabajo (Git Flow)

- `main`: solo versiones estables (lo que se presenta).
- `develop`: integración del trabajo terminado.
- `feature/<nombre>`: una rama por funcionalidad, creada desde `develop` y fusionada de vuelta con
  `git merge --no-ff`.

Los mensajes de commit siguen [Conventional Commits](https://www.conventionalcommits.org/es/):
`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`.

## Documentación

La documentación técnica está en [docs/](docs/README.md).
