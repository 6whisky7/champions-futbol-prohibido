# Champions Fútbol Prohibido

- Esta base usa Next.js con App Router, TypeScript, Tailwind CSS y Supabase SSR.
- Antes de cambiar APIs de Next.js, consulta la documentación de la versión instalada en `node_modules/next/dist/docs/`. Verifica también las APIs actuales de Supabase.
- Lee `docs/decisiones-del-torneo.md` antes de implementar reglas. Los cambios confirmados más recientes tienen prioridad. No conviertas sugerencias ni decisiones pendientes en reglas aprobadas.
- Usa exclusivamente el proyecto de Supabase `cvenqmszdmhqaeokzbnz`. No operes sobre otros proyectos.
- El rediseño autorizado se trabaja en una rama separada y puede desplegar una vista previa en Vercel. No incorporar a main antes de revisión. No se autorizan migraciones, cambios de esquema ni creación de usuarios.
- Consulta PRODUCT.md y DESIGN.md. Impeccable dirige el diseño; Taste es una segunda revisión y no sustituye el encargo ni la necesidad de lectura fácil. El estado de las siete skills está documentado en docs/skills.md.
- Conserva los 48 PNG originales y `public/escudos/catalogo.json`. Ejecuta `npm run check:assets` después de cambiar las referencias.
- Mantén las dependencias con versiones exactas y conserva `package-lock.json`. No subas `.env.local`, credenciales, `node_modules`, `.next` ni `.vercel`.
- La portada y los textos para participantes deben estar en español. No presentes formularios o funciones aún inexistentes como disponibles.
- Antes de entregar cambios de código, ejecuta `npm run typecheck`, `npm run lint`, `npm run check:assets` y `npm run build`. Informa el resultado real.
