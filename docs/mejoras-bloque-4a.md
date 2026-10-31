# Administración: orientación y revisión por integrante

Primera parte del bloque 4. LIVE, OBS, exportaciones, evidencia, revelación y ayudantes corresponden a 4B y no se presentan aquí como terminados.

## Siguiente paso y navegación

Resumen calcula una acción desde datos autorizados reales: borrador/publicación, política pendiente, apertura/revisión, preparación y confirmación del calendario, resultados, desempates/cierre, cuadro y campeón. Explica bloqueos y nunca abre, sortea ni avanza por mostrar una recomendación. El menú conserva evento y filtro y agrupa Preparar y Competición. Los contadores se consultan mediante `/api/admin/contadores`, con Auth verificado y `cfp_is_owner()` otra vez en servidor, sin caché compartida; no devuelve solicitudes ni datos de jugadores. Solicitudes cuenta pendientes; Equipos, aprobados; Espera, solicitudes sin reserva; Resultados, encuentros aún por resolver en ambas fases.

## Requisitos y auditoría

La migración aditiva `20261031163839_admin_member_requirements_tie_context.sql` se aplicó exclusivamente a `cvenqmszdmhqaeokzbnz`. Añade `member_checks` privado y snapshots de requisitos en el historial existente, con RLS/grants intactos. Cada integrante tiene seguimiento, La Chapizza y amistad Roblox; el contador dice explícitamente tres comprobaciones por jugador. La confirmación del capitán sigue siendo una comprobación adicional del equipo.

Cada cambio individual exige propietario, solicitud pendiente y motivo de 3–1000 caracteres. Se serializa por evento, conserva actor/antes/después y deriva el estado global. Desmarcar impide aprobar. Se pueden completar requisitos de pendientes tras cerrar mientras no venzan, sin cambiar plantillas ni plazos. Una solicitud aprobada no admite editar sus casillas; incidencias posteriores usan las decisiones administrativas existentes.

Se conserva la operación anterior «Marcar requisitos revisados»: declara manualmente que el propietario comprobó los tres requisitos de todos los integrantes y ahora registra el desglose completo. No omite requisitos ni habilita aprobar por excepción. Una aprobación nueva exige en la base confirmación del capitán, bandera global y las 9/12 comprobaciones completas. Corrección y promoción reinician su desglose y las confirmaciones como antes. Las aprobaciones ya existentes permanecen intactas; una revisión global anterior se identifica sin atribuir comprobaciones individuales o consentimientos retroactivos.

El historial muestra cambios legibles además del registro conservado, motivo, usuario que actuó y snapshots. Regenerar sigue limitado a revisión; no se añade restauración de snapshots. Retirar un resultado conserva auditoría y respeta dependencias disputadas. El campeón cerrado sigue inmutable.

## Desempates explicados

El algoritmo de ordenación no cambia. Su cálculo añade el rival concreto del duelo directo o los integrantes/victorias de la minitabla realmente aplicada. No se deduce desde vecinos de la tabla. Si sigue igualado se dice zona por resolver. DG/GF y sorteo conservan su criterio. Las clasificaciones finales antiguas conservan su snapshot; si no incluían detalle adicional se muestra el criterio guardado sin inventar un rival.

## Pruebas y límites

- `verify-admin-requirements.mjs`: requisito incompleto impide aprobar, desmarcar vuelve a bloquear, aprobación exige capitán, aprobados no editables, argumentos nulos/índices inválidos, actor/snapshots, anon/ajeno denegados y proyección pública sin checks/TikTok. Contexto exacto de duelo directo/minitabla: PASS.
- Nueve actualizaciones simultáneas de casillas en PostgreSQL local conservan las nueve, sin perder cambios: PASS. Solo fixture local propio y limpieza acotada.
- `supabase/tests/admin_requirements.sql`, inscripciones, liguilla y KO remotos en transacciones revertidas: PASS. Después: cero eventos y solicitudes, aviso privado inactivo. No se abren eventos reales.
- `verify-admin-guidance.mjs`: una pendiente pasa por nueve cambios mediante acciones Next, confirmación del capitán y aprobación; Resumen avanza al siguiente paso. Once pantallas administrativas en 1440/390 px, Axe sin infracciones, sin desbordamiento ni errores React; menú/Escape y API de contadores sin sesión denegada: PASS. Auth/REST son sustitutos locales, con roles/funciones de PostgreSQL reales; no equivale a Auth real ni teléfono físico.
- Se corrigió el contexto del selector para que sea una región accesible. Capturas locales en `C:/Users/XT/Projects/cfp-registration-tests/admin-guidance/`.

Advisors mantiene 12 tablas privadas con RLS sin políticas (denegación directa deliberada), cinco RPC públicas y doce autenticadas SECURITY DEFINER revisadas (la nueva verifica propietario); no se presenta como informe sin avisos. Sigue el aviso de protección de contraseñas filtradas desactivada, con acceso por enlace de correo. [RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [RPC públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [RPC autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [contraseñas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

El ensayo integral actualizado volvió a pasar: doce equipos, 24 partidos de liguilla y siete eliminatorios hasta campeón, con corrección y desempates, en el mismo evento local `b2209836-c633-41b9-bcc8-eb96485653fa`. Auth/transporte simulados. Informe `C:/Users/XT/Projects/cfp-registration-tests/integral-mvwmr2sf/report.json`. TypeScript, ESLint, assets y build finales: PASS. [Capturas y reporte administrativos](evidencia-admin-4a/report.json).
