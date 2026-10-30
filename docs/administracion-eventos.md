# Administración y eventos

La etapa de participación amplía este registro inicial. Para el comportamiento actual de apertura, reservas, revisión, cierre y lista de espera, consulta [Inscripciones](inscripciones.md). Las referencias al bloqueo provisional y al próximo bloque de participación que siguen documentan la entrega anterior; quedaron sustituidas por las migraciones de inscripción. La confirmación del acceso real del propietario sigue vigente.

## Estado de esta etapa

Trofeo V03 con carga automática visible, escenario e iluminación HDR propios, imagen inicial/alternativa y control frontal. Páginas `/eventos` y `/eventos/[id]`; acceso del propietario en `/admin/acceso`, panel `/admin` y creación/edición en `/admin/eventos`.

El formulario de participación todavía no existe. La publicación de un evento no abre inscripciones. La columna `registration_status` tiene un CHECK que solo permite `closed`, además de la validación del servidor y la explicación administrativa.

## Acceso del propietario

1. Abrir el dominio público y entrar en `/admin/acceso`.
2. Escribir el correo proporcionado por el propietario. La variable de servidor `CFP_OWNER_EMAIL`, configurada en Vercel, filtra el envío de enlaces.
3. Abrir el enlace de Supabase en el mismo navegador donde se solicitó. La cookie PKCE debe estar disponible. El primer acceso crea la cuenta de Auth y requiere verificar la posesión del correo; no se inventa una contraseña ni se solicita una clave privilegiada.
4. La página `/auth/callback` intercambia el código, y el panel comprueba `getUser()` y `cfp_is_owner()`.
5. Usar «Cerrar sesión» en el panel para revocar la sesión mediante Auth.

No hay un registro público de administradores, ni roles editables desde el cliente. Un usuario ajeno autenticado no recibe permisos. La autorización de base de datos consulta `auth.users.email_confirmed_at` y el correo configurado en `cfp_private.owner_config` usando el UID autenticado. No confía en `user_metadata` ni en un correo enviado por el cliente. Solo un correo puede configurarse como propietario. La fila privada no tiene permisos directos para clientes.

El correo real queda fuera del repositorio: configuración privada de base de datos y variables locales/Vercel. Cambiarlo exige coordinación de ambas configuraciones por el organizador. Ninguna clave `service_role` se usa en la aplicación.

## Configuración remota

Proyecto único `cvenqmszdmhqaeokzbnz`, comprobado ACTIVE_HEALTHY antes de crear tablas. La configuración de Vercel conserva las variables publishable del mismo proyecto; se añadió únicamente `CFP_OWNER_EMAIL` de servidor.

`supabase/config.toml` declara solo Site URL y callback de producción; `config diff` se revisó antes de push y confirmó que únicamente esas dos propiedades cambiaban. Las otras propiedades de Auth y demás servicios se preservan. La confirmación de correo ya estaba activada y se conserva. La protección administrativa sigue dependiendo de usuario verificado + RLS, aunque alguien use directamente la API de Auth.

Migraciones aplicadas y versionadas con sus identificadores remotos:

- `20261030042957_owner_events.sql`: esquema privado de propietario, autorización y tabla de eventos con permisos mínimos/RLS.
- `20261030043337_restrict_event_trigger_execute.sql`: revoca el acceso API a una función de event-trigger preexistente, conservando su operación interna.

La fila con el correo del propietario es configuración operativa y se provisionó fuera de las migraciones. Para instalar en otra base autorizada, debe configurarse explícitamente; un esquema recién migrado sin esa fila deniega todos los accesos administrativos. No aplicar a otro proyecto sin nueva autorización.

## Eventos y reglas

Se guardan nombre, descripción, inicio y final previsto opcional, cupo par, formato, criterio de continuación desde la liguilla y estado borrador/publicado. Fechas en hora de Costa Rica, convertidas a timestamptz. Se comprueban fechas reales, orden y longitudes en servidor y restricciones en SQL.

Cuartos: mínimo 8, 4 rivales, 8 clasificados. Octavos: 16, 6 y 16. Dieciseisavos clásicos: 32, 8 y 32. Repesca: mínimo 24, 8 rivales, 24 que continúan (8 directos y 16 a repesca). Sin eliminación de liguilla, el cupo coincide con los que continúan. No se implementan todavía sorteo, aprobación ni calendario. No se han decidido reglas pendientes del documento del torneo.

Las ediciones usan `updated_at` como condición para evitar sobrescribir cambios de otra pestaña. Las páginas públicas filtran explícitamente por publicado además de RLS. No se cachean datos administrativos ni páginas de eventos: los borradores no se filtran al público al reutilizar cachés.

## Verificación realizada y límites

- TypeScript, ESLint, validación de 48 escudos/trofeo y build.
- Pruebas de validación para cuatro formatos, cupos pares, mínimos, fechas, continuación y rechazo de apertura.
- `supabase/tests/events_rls.sql`, ejecutado sobre el proyecto autorizado dentro de una sola transacción revertida. Prueba propietario verificado, ajeno, no verificado y anónimo: crear/editar, borrador privado, publicación visible y rechazo de apertura/cupos inválidos. Los fixtures de Auth y eventos nunca se confirman; verificado cero eventos después de rollback.
- Navegador: rutas administrativas sin sesión, correo ajeno, callback inválido, listado público vacío y detalle de borrador 404.
- Galería, diez filtros, búsqueda, teclado, 404, cinco anchuras, zoom 200 %, Axe y consola: ver reportes en `output/playwright`.
- Trofeo: carga automática, cinco materiales, reset frontal, teclado, fallo de red con alternativa, ocultación fuera de pantalla y scroll táctil.
- Simulación local Edge 390×844/DPR2, 1,6 Mbps, 150 ms, CPU ×4: LCP 1012 ms; 3D listo 11872 ms; 1940656 bytes al estar listo; una solicitud GLB automática. No es teléfono físico ni Lighthouse. El reporte JSON es la fuente exacta de la corrida.

El propietario confirmó que entró al panel desde el enlace de su correo. La verificación remota confirmó cuenta de propietario verificada y sesión existente. No se ha suplantado su identidad. Creación/edición y aislamiento se probaron con fixtures SQL revertidos; no se presentan como pruebas automatizadas de edición desde el navegador del propietario. Los eventos de producción se mantienen vacíos hasta que el propietario configure uno real.

Supabase Advisors no informa advertencias tras revocar EXECUTE al event-trigger. Conserva un aviso informativo de RLS sin políticas en `cfp_private.owner_config`: es deliberado para denegar todo acceso directo. [Explicación del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Próximo bloque

Inscripción sin cuentas, revisión administrativa, plazo configurable de 48 horas, reservas de cupo/usuarios y concurrencia en base de datos. Resolver decisiones pendientes de lista de espera y escudos antes de implementarlas. La apertura requerirá una migración explícita que retire el bloqueo y añada las restricciones definitivas; no basta con habilitar un botón.
