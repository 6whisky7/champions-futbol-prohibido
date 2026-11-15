# Estado final de Champions Fútbol Prohibido

Actualizado el 15 de noviembre de 2026, Costa Rica. Este informe amplía y reemplaza las notas de estado anteriores para esta entrega.

## Estado inicial recuperado

- Repositorio correcto: `6whisky7/champions-futbol-prohibido`; producción: [champions-futbol-prohibido.vercel.app](https://champions-futbol-prohibido.vercel.app); Supabase: `cvenqmszdmhqaeokzbnz`.
- La rama existente `feat/plataforma-final` apuntaba a `ec26ef4`, igual que `main` y `origin/main`. El árbol tenía una migración sin confirmar y no había trabajo adicional en una rama remota con ese nombre.
- La base real tenía un solo evento, `Prueba Evento` (`cf914a2b-bd63-426e-b846-5d1e810183a8`), publicado y con inscripciones cerradas. No lo utilicé para ensayar. Al migrarlo quedó `is_test = NULL` para conservar su clasificación anterior y su visibilidad; su estado, datos y finalidad no se modificaron.
- El ensayo usó exclusivamente PostgreSQL local y fixtures sintéticos. No se crearon ni modificaron participantes en producción.

## Cambios implementados

- Clasificación fija de eventos como **Prueba** u **Oficial**. El propietario puede crear pruebas desde el panel y generar solicitudes ficticias una sola vez, solo en una prueba y con inscripciones cerradas. El servidor y Supabase bloquean datos ficticios en eventos oficiales.
- Ciclo de vida auditado: cancelación, finalización después de confirmar campeón y restauración limitada a eventos sin competición iniciada. La competición iniciada no puede volver a borrador.
- Las pruebas quedan excluidas de listados, páginas, inscripciones, proyecciones deportivas y LIVE públicos. Los eventos finalizados conservan el historial deportivo público.
- Nueva sección **Privacidad y conservación** con estado de condiciones, revisión explícita del aviso, confirmaciones de menores y plazo, activación/desactivación, vista previa y ejecución auditada.
- Conservación de seis meses. Se anonimizan identificadores Roblox/TikTok y copias de datos de solicitudes; se preservan nombres y escudos de equipos, resultados, clasificaciones, campeones y estadísticas deportivas. El proceso reconoce solicitudes rechazadas, vencidas, pendientes expiradas y solicitudes activas de eventos finalizados/cancelados. `anonymized_at` hace idempotente la operación.
- La edición de eventos conserva la clasificación antigua `NULL`; no se reclasifica silenciosamente el evento previo.
- Se actualizó la guía del primer evento y se conciliaron las decisiones de conservación con seis meses.

## Migraciones y producción

Aplicadas en Supabase con la herramienta de migraciones conectada al proyecto:

| Archivo local | Versión registrada | Resultado |
| --- | --- | --- |
| `20261115185630_test_events_lifecycle.sql` | `20261115185630` | Aplicada |
| `20261115185637_privacy_retention.sql` | `20261115185637` | Aplicada |

La compatibilidad se comprobó contra las tablas y columnas existentes y en una base local aislada antes de aplicar. En producción se verificó después: sigue habiendo un evento, `Prueba Evento` continúa publicado/cerrado y sin clasificar; solicitudes almacenadas: **0**; política de privacidad: **inactiva**; `pg_cron`: disponible y con **un** job diario `cfp-privacy-retention`. La migración no abrió inscripciones, no activó el aviso y no anonimizó registros de producción.

Supabase devolvió ambas migraciones como aplicadas. Las tres columnas del ciclo de vida, `anonymized_at` y el trabajo diario están presentes. RLS continúa habilitado en tablas protegidas. La política pública conserva eventos publicados/finalizados no clasificados como prueba y excluye las pruebas.

## Autenticación, permisos y límites

- Las operaciones administrativas comprueban propietario en el servidor y vuelven a comprobar rol dentro de las funciones de Supabase. El cliente no recibe permisos directos a tablas privadas.
- Las pruebas locales verificaron denegación por rol, aislamiento público, bloqueo de inscripción y controles de estado. **Auth/PostgREST del entorno de prueba son simulados**; PostgreSQL local ejecutó las funciones y políticas reales del esquema. No se presenta esto como una prueba de GoTrue, correo, PKCE o tokens reales.
- La documentación previa registra que el propietario ya había confirmado acceso real. Este trabajo no volvió a autenticar a una persona en producción.
- La integración Vercel no permitió listar el proyecto: la conexión MCP devolvió proyecto no encontrado/403 y el CLI `vercel whoami` no completó. No afirmo que la nueva versión esté desplegada. El acceso Vercel debe quedar disponible para identificar y verificar el deployment del SHA exacto.
- El código no registra autorización individual ni prueba la representación de responsables legales. La activación del aviso no certifica cumplimiento jurídico.

## Pruebas ejecutadas

Todas las pruebas de esta lista corrieron en local, con base sintética, salvo donde se indica que una consulta de estado fue de solo lectura en producción.

| Prueba | Resultado |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run check:assets` | PASS: 48/48 escudos PNG y trofeo V03 |
| `npm run build` | PASS; incluye `/admin/privacidad` |
| `scripts/verify-events.mjs` | PASS |
| `scripts/verify-integral.mjs` | PASS: inscripciones, aprobación, espera, calendario, 24 partidos, desempates, eliminatorias, campeón e historial deportivo público sin TikTok |
| `scripts/verify-ui.mjs` | PASS: 360–1440 px, accesibilidad Axe, sin desbordamiento, controles y zoom nativo al 200 % |
| `scripts/verify-public.mjs` | PASS: páginas, resultados, calendarios, privacidad de campos y rutas públicas; cancelación oculta todos los recursos públicos |
| `scripts/verify-admin-guidance.mjs` | PASS: permisos, nueve requisitos, once vistas a 1440/390 px y navegación por teclado |
| `scripts/verify-live.mjs` | PASS: ayudantes, permisos, concurrencia, evidencia, revocación y LIVE/eliminatorias |
| `scripts/verify-final.mjs` | PASS: privacidad bloquea disponibilidad, errores OBS, zoom/menú |
| `scripts/verify-knockout.mjs` y `verify-knockout-rules.mjs` | PASS: cuatro formatos, avance, reglas, campeones y cierre |
| `scripts/verify-league-regressions.mjs` | PASS: nulos, revisión concurrente, regeneración auditada |
| `scripts/verify-submission-limits.mjs` | PASS: límites, firma, reintento idempotente, permisos y concurrencia |
| `scripts/verify-access.mjs` | PASS con Auth local simulado: panel privado sin sesión, correo ajeno, callback inválido |
| Ensayo UI nuevo de evento de prueba | PASS local: creación, datos ficticios de una sola vez, cancelación y vista previa de cero elegibles |
| Integración SQL de privacidad/ciclo de vida | PASS en base aislada: configuración bloqueada/habilitada, cancelación/restauración, campeón requerido, anonimización tras seis meses, historial, equipo congelado, conservación deportiva e idempotencia |

Al principio, dos verificadores heredados intentaron despublicar una competición ya iniciada. Se ajustaron para probar cancelación, que es la operación segura del nuevo ciclo de vida. El shim de ensayo también se corrigió para pasar parámetros requeridos de RPC. El flujo integral añadió una espera de hidratación al cambiar de jornada; la regresión de liguilla ahora genera su propio fixture aislado. El verificador de acceso dejó de presuponer una base pública vacía. Esas correcciones no cambian reglas del torneo.

## Pendientes clasificados

| Clasificación | Pendiente |
| --- | --- |
| **Bloqueante para abrir inscripciones oficiales** | Completar y revisar la identidad legal del responsable, el aviso final, la representación/autorización individual de menores y la adaptación del requisito TikTok. Mantener privacidad e inscripciones cerradas hasta resolverlo. |
| **Bloqueante para declarar el despliegue verificado** | Restablecer acceso Vercel al proyecto conectado y comprobar el deployment del SHA de la rama/PR y luego del SHA integrado. El acceso disponible devolvió 403/404 y no se pudo completar por CLI. |
| **Importante** | Repetir autenticación con Supabase Auth/PostgREST reales en un entorno aislado autorizado, incluidos propietario, usuario ajeno, cookies, RLS y enlaces de acceso. |
| **Importante** | Revisar retención, proveedores/transferencias y política de backups antes de activar el aviso. La anonimización operativa está probada, pero no borra copias técnicas instantáneamente. |
| **Menor** | Revisar de nuevo las capturas/guías históricas después del primer ensayo manual del propietario; las capturas del flujo previo pueden mostrar una versión anterior del panel. |
| **Dependiente de configuración externa** | Permisos de Vercel, disponibilidad de un Auth/PostgREST aislado real y validación legal local. No se resolvieron por medio de credenciales ni datos ficticios de producción. |

## Pasos del propietario

### Crear el primer evento de prueba

1. Abrir [Administración](https://champions-futbol-prohibido.vercel.app/admin/acceso) e iniciar sesión como propietario.
2. **Eventos → Crear evento**; elegir **Prueba**, guardar primero como borrador y dejar inscripciones cerradas.
3. En **Preparar equipos de prueba**, generar equipos ficticios una vez. Revisarlos desde Solicitudes, aprobarlos y continuar por calendario, resultados, desempates, eliminatorias y campeón.
4. No usar el evento de producción `Prueba Evento` como ensayo. Una prueba permanecerá fuera de la web pública aunque se publique.

### Preparar el primer evento oficial

1. Completar los pendientes bloqueantes de privacidad y protección de menores; revisar el aviso publicado completo.
2. En **Privacidad y conservación**, registrar las confirmaciones administrativas, activar solo después de esa revisión y comprobar la vista previa.
3. Crear un evento **Oficial** separado como borrador/cerrado; revisar fecha, formato, cupo y reglas. Publicar y abrir inscripciones en acciones distintas, únicamente cuando se decida convocar participantes reales.

## GitHub, PR y Vercel

- Rama local: `feat/plataforma-final`, basada en `ec26ef4`.
- Commit final: pendiente de confirmar.
- PR: pendiente de abrir después del commit.
- CI/estado de revisión: pendiente.
- Deployment Vercel para SHA exacto: no verificado por falta de acceso al proyecto.
- Producción comprobada solo por lectura de estado de Supabase: inscripción cerrada y aviso inactivo.
