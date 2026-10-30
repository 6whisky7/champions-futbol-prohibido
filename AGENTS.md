# Champions Fútbol Prohibido

- Esta base usa Next.js con App Router, TypeScript, Tailwind CSS y Supabase SSR.
- Antes de cambiar APIs de Next.js, consulta la documentación de la versión instalada en `node_modules/next/dist/docs/`. Verifica también las APIs actuales de Supabase.
- Lee `docs/decisiones-del-torneo.md` antes de implementar reglas. Los cambios confirmados más recientes tienen prioridad. No conviertas sugerencias ni decisiones pendientes en reglas aprobadas.
- Usa exclusivamente el proyecto de Supabase `cvenqmszdmhqaeokzbnz`. No operes sobre otros proyectos.
- La portada y el trofeo V03 están aprobados y publicados. La etapa actual incorpora inscripción pública sin cuentas, revisión de equipos y lista de espera, además de eventos y acceso exclusivo del propietario. Autoriza migraciones aditivas versionadas y publicación de cambios verificados. Trabaja en rama y PR antes de integrar main. Solo el proyecto indicado; preserva datos y prueba con fixtures transaccionales revertidos o un entorno aislado.
- La autorización exige usuario verificado por Supabase Auth y `cfp_is_owner()` en cada lectura o mutación administrativa. RLS también protege eventos. No uses metadatos editables, claves privilegiadas en la aplicación ni accesos de prueba en producción. `CFP_OWNER_EMAIL` es solo de servidor y debe coincidir con la configuración privada de la base.
- Los eventos nacen cerrados y las inscripciones reales deben conservarse cerradas en esta entrega hasta que el propietario las abra desde el panel. Publicar y abrir son acciones distintas. Las reservas se validan atómicamente bajo bloqueo de la fila del evento. Nunca permitas escrituras directas en las solicitudes privadas.
- Lee `docs/inscripciones.md` antes de cambiar reservas: pendientes y aprobadas reservan cupo, nombre, escudo y usuarios; espera no reserva. El cierre conserva vencimientos y fija plantillas. TikTok, notas e historial son privados; el público recibe una proyección explícita de Roblox.
- El trofeo carga automáticamente al entrar en pantalla; imagen inicial y alternativa ante fallo, reset frontal, teclado, pan-y táctil y trabajo reducido fuera de pantalla. Actualiza la medición móvil si cambia su carga.
- Consulta PRODUCT.md y DESIGN.md. Impeccable dirige el diseño; Taste es una segunda revisión y no sustituye el encargo ni la necesidad de lectura fácil. El estado de las siete skills está documentado en docs/skills.md.
- Conserva los 48 PNG originales y `public/escudos/catalogo.json`. Ejecuta `npm run check:assets` después de cambiar las referencias.
- Mantén las dependencias con versiones exactas y conserva `package-lock.json`. No subas `.env.local`, credenciales, `node_modules`, `.next` ni `.vercel`.
- La portada y los textos para participantes deben estar en español. No presentes formularios o funciones aún inexistentes como disponibles.
- Antes de entregar cambios de código, ejecuta `npm run typecheck`, `npm run lint`, `npm run check:assets` y `npm run build`. Informa el resultado real.
