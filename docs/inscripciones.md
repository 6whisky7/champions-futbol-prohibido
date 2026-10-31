# Inscripciones, revisión y lista de espera

## Alcance

Inscripción pública sin cuenta desde `/eventos/[id]`, únicamente si el evento está publicado y abierto. El propietario administra solicitudes, equipos y espera desde `/admin/solicitudes`; conserva el acceso por enlace de correo ya configurado. Los eventos reales se mantienen cerrados en esta entrega hasta que el propietario decida abrirlos.

El formulario recoge nombre, escudo, número opcional 01–99, tres titulares, capitán entre esos titulares y suplente opcional. Todos los integrantes declaran Roblox y TikTok. El resumen permite revisar antes de enviar; errores conservan los campos. La confirmación incluye referencia, vencimiento e instrucciones para que el capitán contacte desde el TikTok declarado. Enviar no equivale a aprobación.

## Reservas y estados

| Estado | Reserva plaza, nombre, escudo y jugadores | Público |
| --- | --- | --- |
| Pendiente dentro de plazo | Sí | Nombre, escudo y plantilla Roblox; estado pendiente |
| Aprobado | Sí | Nombre, escudo y plantilla Roblox; estado aprobado |
| En espera | No | No |
| Rechazado o vencido | No | No |

El número opcional puede repetirse. Un escudo puede reutilizarse en otro evento. Seleccionarlo no reserva nada: la reserva se crea al guardar correctamente una pendiente.

El plazo inicial es de 48 horas; `review_hours` admite 1–720 y afecta reservas nuevas. Cerrar impide nuevos envíos y promociones; las pendientes conservan sus vencimientos y pueden resolverse. Promover requiere evento publicado y abierto, vuelve a validar todos los conflictos y crea una nueva reserva con el plazo configurado. El administrador elige manualmente la solicitud; no existe prioridad automática de espera.

El primer cierre fija las plantillas mediante `roster_locked`; reabrir para promociones no habilita corregirlas. Antes del cierre, una corrección vuelve a comprobar la disponibilidad y reinicia la confirmación/revisión; si el equipo estaba aprobado pasa a pendiente. El sorteo exige resolver todas las pendientes. Su revisión y confirmación están implementadas en [Liguilla](liguilla.md).

## Validación y concurrencia

Las mutaciones bloquean la fila del evento con `FOR UPDATE`. Comprobación de cupo, nombre, escudo, jugadores y escritura ocurren dentro de la misma transacción. Una reducción administrativa del cupo tampoco puede quedar por debajo de las reservas activas.

Los usuarios se comparan ignorando mayúsculas, espacios y `@` inicial, incluido el suplente. La unicidad de todos los integrantes impide que un capitán tenga dos inscripciones activas. Los nombres se comparan sin mayúsculas, acentos, puntuación ni cifras; además se ignoran las palabras FC, CF, TEAM, EQUIPO y CLUB. Son criterios explícitos de similitud, no una detección general de suplantación.

La clave UUID de envío hace idempotente un reintento con el mismo contenido. Una misma clave con contenido distinto se rechaza. Existe un intervalo de un minuto por capitán para nuevos envíos; no es una verificación de identidad ni protección completa contra abuso distribuido. La identidad y los requisitos se revisan manualmente.

El vencimiento se reconoce en consultas públicas y validaciones aunque la limpieza aún no haya corrido. Las operaciones y la consulta administrativa limpian vencidas bajo el bloqueo del evento; `pg_cron` ejecuta `cfp_private.clean_expired()` cada minuto. Rechazar y vencer libera todas las reservas.

## Revisión y privacidad

La aprobación exige confirmar al capitán desde el perfil de TikTok declarado y marcar revisados los requisitos de toda la plantilla: seguir a `@whiskyzc`, pertenecer a [La Chapizza](https://tiktok.me/group/ZSgLCxnLr/) y tener aceptada la amistad con `SOYWHYSKY` en Roblox. No hay confirmación individual. LIVE, comentarios y tap tap son voluntarios.

TikTok, motivos e historial están en `cfp_private`. Las tablas tienen RLS y carecen de permisos directos para `anon` y `authenticated`. Las funciones administrativas verifican el propietario en la base además de `requireOwner()` en el servidor. No se incorporan claves privilegiadas a la aplicación.

`cfp_public_teams()` construye una proyección explícita: nombre, escudo, número, estado, capitán y Roblox. No devuelve TikTok, clave de reintento, notas ni historial. Los borradores no aparecen. Las correcciones conservan instantáneas privadas antes/después y el historial registra fecha, acción, motivo y actor.

## Migraciones y comprobación

Solo el proyecto `cvenqmszdmhqaeokzbnz`:

- `20261030050724_registration.sql`: esquema privado, reservas atómicas, estados, controles definitivos de apertura y limpieza.
- `20261030051316_registration_canonical_handles.sql`: normalización consistente y nombres confundibles.
- `20261030051410_application_audit.sql`: instantáneas privadas de correcciones.

Las migraciones existentes, el propietario y los recursos V03/48 escudos se conservan. Los cambios sustituyen el bloqueo provisional de apertura; ningún evento existente se abre por la migración.

Evidencia disponible durante esta implementación:

- Prueba SQL remota en una transacción revertida: envío, reintento, proyección privada, aprobación condicionada, rechazo y acceso no autorizado. Fixture en `supabase/tests/registration.sql`.
- PostgreSQL 18 local aislado: tres/cuatro integrantes, carreras por escudo, jugador y última plaza; reintentos; espera sin reserva; promoción con cupo agotado; vencimiento antes de limpieza; cierre sin alterar plazos.
- Regresiones locales: usuarios con espacios antes de `@`, nombres confundibles, instantáneas de corrección, promoción tras liberar reservas, bloqueo de plantillas al reabrir y rechazo de administrador ajeno.

El entorno local usa un sustituto de Auth solo para pruebas; no equivale a probar la identidad real del propietario en producción. El navegador completó formulario, resumen, envío, confirmación del capitán, requisitos y aprobación en escritorio; móvil verificó formulario y administración. Sin desbordamientos ni errores React. Se comprobó ausencia de usuarios TikTok privados en el HTML público, teclado y Axe sin infracciones en el formulario. La galería pasó sus diez filtros, búsqueda, 48 recursos, cinco anchuras, zoom 200 % y movimiento reducido. TypeScript, ESLint, assets y compilación pasaron. La revisión independiente cerró sus hallazgos con disposición `ship`, limitada a esas correcciones. La publicación se verifica después de integrar el PR.

Los scripts y capturas del entorno aislado de esta máquina están en `C:/Users/XT/Projects/cfp-registration-tests`: `test.mjs`, `regressions.mjs`, `browser.mjs`, `accessibility.mjs` y cuatro PNG. Son fixtures locales; nunca se publican sus credenciales ni el sustituto de Auth. Las pruebas SQL versionadas siguen disponibles en `supabase/tests`. La limpieza programada remota terminó en `succeeded`; después de las pruebas revertidas se confirmaron cero eventos y cero solicitudes en producción.

Los avisos de Advisors sobre funciones `SECURITY DEFINER` ejecutables son intencionales para estas entradas RPC controladas; deben revisarse al cambiar sus permisos. RLS sin políticas en las tablas privadas deniega su acceso directo. La protección de contraseñas filtradas aparece desactivada; el acceso actual del propietario es mediante enlace de correo. Referencias: [funciones públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [funciones autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) y [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Las carreras y regresiones también se versionan como `scripts/registration-concurrency.mjs` y `scripts/registration-regressions.mjs`. Usan `CFP_TEST_DIR` para localizar el paquete `pg` y el `connection.json` del clúster aislado; rechazan conexiones fuera de `127.0.0.1:55439`. Nunca usar un proyecto remoto para estos scripts. El esquema y fixture local deben estar provisionados antes de ejecutarlos.
