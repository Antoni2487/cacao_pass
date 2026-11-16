# 05 · Flujo de trabajo con Git (Git Flow)

## Ramas

| Rama               | Para qué                                                  | Se crea desde | Se fusiona en        |
| ------------------ | --------------------------------------------------------- | ------------- | -------------------- |
| `main`             | Versión estable, la que se presenta y despliega en Vercel | —             | —                    |
| `develop`          | Integración del trabajo terminado                         | `main`        | `main` (al publicar) |
| `feature/<nombre>` | Una funcionalidad                                         | `develop`     | `develop`            |
| `hotfix/<nombre>`  | Arreglo urgente en producción                             | `main`        | `main` y `develop`   |

Ramas creadas hasta ahora, todas fusionadas en `develop`:

```text
feature/setup-proyecto
feature/base-de-datos
feature/autenticacion
feature/productores-parcelas
feature/lotes
feature/dashboard-basico
feature/documentacion-tecnica
feature/formato-config
feature/hash-canonico          # Día 2
feature/sellado-blockchain
fix/tsconfig-es2020
feature/registro-etapas
feature/qr-lotes
feature/verificacion-publica
feature/documentacion-dia-2
```

## Ciclo de una funcionalidad

```bash
git checkout develop
git pull
git checkout -b feature/registro-etapas

# … trabajar y hacer commits …
npm run lint && npm run typecheck && npm test && npm run build

git checkout develop
git merge --no-ff feature/registro-etapas   # --no-ff deja visible la rama en el historial
git push origin develop
```

## Publicar una versión

Cuando `develop` está listo para la exposición:

```bash
git checkout main
git merge --no-ff develop
git tag -a v1.0.0 -m "Versión para la exposición"
git push origin main --tags
```

## Mensajes de commit (Conventional Commits)

```text
<tipo>(<alcance opcional>): <resumen en minúsculas>

<detalle opcional en viñetas>
```

| Tipo       | Cuándo                                           |
| ---------- | ------------------------------------------------ |
| `feat`     | Nueva funcionalidad                              |
| `fix`      | Corrección de un error                           |
| `docs`     | Solo documentación                               |
| `refactor` | Cambio de código que no altera el comportamiento |
| `chore`    | Configuración, dependencias, herramientas        |

Ejemplo: `feat(etapas): sellar hash en Polygon Amoy`.
