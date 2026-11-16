# Documentación técnica de CacaoPass

Léela en este orden. Si nunca trabajaste con blockchain, empieza por la 01: todo lo demás se apoya en
esos conceptos.

| #   | Documento                                                                | Para qué sirve                                                   |
| --- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| 01  | [Conceptos: hash, blockchain y verificación](01-conceptos-blockchain.md) | Entender qué hace el sistema y poder explicarlo en la exposición |
| 02  | [Base de datos](02-base-de-datos.md)                                     | Qué guarda cada tabla y cómo la protege RLS                      |
| 03  | [Guía de instalación](03-guia-de-instalacion.md)                         | Configurar Supabase, usuarios, wallet de Polygon y Vercel        |
| 04  | [Arquitectura y código](04-arquitectura-y-codigo.md)                     | Cómo está organizado el proyecto y por qué                       |
| 05  | [Flujo de trabajo con Git](05-flujo-git.md)                              | Ramas, commits y cómo integrar cambios                           |

## Estado del proyecto

| Día | Alcance                                                                                 | Estado    |
| --- | --------------------------------------------------------------------------------------- | --------- |
| 1   | Proyecto, base de datos con RLS, login, productores, parcelas, lotes y dashboard básico | ✅ Hecho  |
| 2   | Registro de etapas, hash + sellado en Polygon, QR, páginas públicas y verificación      | ✅ Hecho  |
| 3   | Dashboard completo, 3 lotes de ejemplo (uno alterado), deploy y prueba en celular       | Pendiente |
