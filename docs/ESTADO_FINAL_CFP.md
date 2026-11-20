# Estado final de Champions Fútbol Prohibido

Actualizado el 20 de noviembre de 2026, Costa Rica. Este informe reemplaza las versiones anteriores de este archivo. Distingue lo verificado en esta revisión de lo heredado de entregas previas; nada de lo que no se probó se presenta como aprobado.

## 1. Resultado

La plataforma quedó operativa para que el propietario dirija un torneo de ensayo desde el panel y abra después un torneo oficial. El ensayo ya se ejecutó completamente en producción: el evento privado **CHAMPIONS FÚTBOL PROHIBIDO — ENSAYO FINAL** (`6cf1deb8-87bd-4386-a31f-3651f8bd807c`) terminó con liguilla cerrada, cuadro terminado y evento finalizado. El código, las migraciones y el aviso de privacidad están desplegados.

- Web: https://champions-futbol-prohibido.vercel.app
- Acceso del propietario: https://champions-futbol-prohibido.vercel.app/admin/acceso
- Repositorio: `6whisky7/champions-futbol-prohibido`, rama `main`, HEAD `76ce9c0bb7157148efb4c9e7848d6c0b8d259f62`.
- Supabase: proyecto `cvenqmszdmhqaeokzbnz`, región activa y saludable.
- Vercel: check `Vercel = success` para ese SHA exacto, despliegue [`HVswhPrQjeZkhe54kxL25KdiqsVg`](https://vercel.com/whiskyideas/champions-futbol-prohibido/HVswhPrQjeZkhe54kxL25KdiqsVg). No se volvió a abrir una sesión personal del propietario en esta revisión.

## 2. Funciones terminadas

| Área | estado |
| --- | --- |
| Eventos de prueba y oficiales | Clasificación `is_test` con etiqueta **PRUEBA**. Las pruebas quedan fuera de catálogo, detalle, inscripciones, competición, exportaciones, proyecciones y LIVE público, incluso con sesión de propietario. El servidor impide generar plantillas ficticias en un evento oficial. |
| Ciclo de vida | Cancelar, finalizar y restaurar con motivo obligatorio y auditoría. Una competición iniciada no puede volver a borrador; la promoción desde espera sigue exigiendo reapertura de inscripciones, según las reglas aprobadas. |
| Competición | Sorteo y calendario revisables, resultados y correcciones con versión, desempates, clasificación, cuadro, campeón, estadísticas y descargas CSV/imagen/PDF. Sin botones inertes ni pérdidas de datos al navegar. |
| LIVE | Marcadores de trabajo, ayudantes asignados por el propietario, evidencia pública opcional y pase a resultado oficial. |
| Privacidad y conservación | Aviso versionado y activable desde el panel, confirmaciones administrativas, vista previa, ejecución manual y tarea diaria. Seis meses de retención con anonimización auditada e idempotente. |
| Identidad visual | 48 escudos PNG originales y trofeo V03 conservados; sin rediseño de la identidad CFP. |

## 3. Estado real de Supabase (consulta de solo lectura del 20 de noviembre)

| Comprobación | Resultado |
| --- | --- |
| Eventos | 4 en total: 1 de prueba activo ya finalizado, 1 histórico sin clasificar cancelado, 1 oficial viejo terminado y 1 oficial publicado con inscripciones abiertas. |
| Ensayo final | `is_test=true`, `status=finished`, liguilla `closed`, cuadro `finished`, 16 partidos de liguilla y 7 de eliminatorias, inscripciones cerradas. No aparece en las rutas públicas. |
| Evento oficial abierto | `a48541f1-70d0-4c46-8c56-3b78e9c733d0` — «CHAMPIONS FUTBOL PROHIBIDO X WHISKYZC», `published`, `registration_status=open`, 6 solicitudes, inicio 1 de diciembre de 2026. **No fue creado ni abierto por el asistente**; se conservó tal cual. Antes de cualquier cambio hay que confirmar con el propietario si es su convocatoria real. |
| Aviso de privacidad | `active=true`, versión `2026-11-15-v1`, revisión del texto confirmada, seis meses confirmados, medidas para menores confirmadas. |
| Retención | `retention_months=6`; `pg_cron` ejecuta `cfp-retention-daily` todas las madrugadas. Las cinco últimas ejecuciones (16–20 de noviembre) registraron 0 candidatos y 0 anonimizaciones. No hay datos personales vencidos en producción. |
| Permisos | RLS activo en las 19 tablas CFP. Las tablas privadas siguen sin `SELECT` directo para `anon`, `authenticated` y `service_role`; las operaciones pasan por funciones `SECURITY DEFINER` que comprueban propietario o ayudante asignado. La preparación de plantillas ficticias solo acepta eventos `is_test=true`. |
| Secretos | No se han impreso ni versionado claves. La clave de ingress y el HMAC siguen configurados en el entorno. Turnstile continúa descartado y no se reintrodujo. |

### Retención de seis meses

El plazo corre desde el rechazo o vencimiento de una solicitud, o desde la finalización o cancelación de la edición para las solicitudes activas. Al vencer se anonimizan Roblox, TikTok, números de jugador y la versión aceptada del aviso en la solicitud y en las copias del historial. Se conservan nombre del equipo, escudo, partidos, resultados, clasificación y la plantilla Roblox necesaria para mostrar al campeón. `anonymized_at` evita repetir la operación. `cfp_retention_preview` muestra el impacto antes de ejecutarla y cada pasada queda en `cfp_private.privacy_operations`.

Esto es conservación operativa en la base. No borra copias de seguridad ni copias técnicas de proveedores; ese alcance sigue siendo una decisión del propietario.

## 4. Verificaciones

Ejecutadas y documentadas en entregas anteriores, con evidencia en `docs/evidencias/` y `docs/evidencia-*/`:

- `npm run typecheck`, `npm run lint`, `npm run check:assets` (48/48 escudos y trofeo V03) y `npm run build`: PASS.
- `scripts/verify-integral.mjs`: PASS — inscripciones, rechazo, espera, corrección, 24 partidos de liguilla, desempates, cuadro, campeón y ausencia de TikTok en la resolución pública.
- `scripts/verify-ui.mjs`: PASS — 360–1440 px, Axe, sin desbordamiento, zoom 200 %.
- `scripts/verify-public.mjs`, `verify-admin-guidance.mjs`, `verify-live.mjs`, `verify-final.mjs`, `verify-events.mjs`, `verify-access.mjs`, `verify-knockout*.mjs`, `verify-league*.mjs`, `verify-submission-limits.mjs`: PASS en los ámbitos descritos en cada informe.
- Integración SQL de ciclo de vida y retención en base aislada: PASS — activación, bloqueo, cancelación/restauración, campeón requerido, anonimización a los seis meses, historial, equipo congelado e idempotencia.
- Validación de inscripción con Supabase Auth y PostgREST reales locales: PASS para recepción, revisión y duplicados normalizados (`docs/hotfix-validacion-inscripcion.md`, `output/hotfix-database-report.json`).

Verificado de nuevo en esta revisión: estado de producción, migraciones aplicadas, aviso activo, ejecuciones de retención, resultado del ensayo, check de Vercel para el SHA actual y rutas públicas del evento de prueba excluidas del catálogo.

**Límite real de la evidencia**: el recorrido deportivo completo se probó con Auth y transporte simulados sobre PostgreSQL real aislado; no con GoTrue, correo, PKCE ni PostgREST remotos. La sesión personal del propietario en producción tampoco se abrió en esta revisión. No se marca como probado lo que solo se simuló.

## 5. Problemas encontrados y corregidos

- No existía forma de activar `privacy_config`, lo que bloqueaba abrir inscripciones. Se añadió la sección **Privacidad y conservación** y las funciones administrativas.
- No existía retención ni anonimización. Se añadió el plazo de seis meses, la vista previa, el registro de operaciones y el job diario.
- Las proyecciones `SECURITY DEFINER` no podían apoyarse solo en RLS para ocultar pruebas; se excluyó `is_test` explícitamente en cada proyección pública.
- Dos verificadores heredados intentaban despublicar una competición iniciada; se ajustaron a cancelación, que es la operación segura.
- El editor de resultados podía aceptar una revisión obsoleta; se ligó el guardado al partido y a su versión.
- El póster del campeón recortaba nombres largos; se ajustó el trazo tipográfico sin cambiar el trofeo V03.
- La validación del formulario devolvía mensajes poco accionables; se reforzó la explicación y la confirmación del envío.
- La migración de arranque local del preflight se conserva fuera del despliegue (`supabase/migrations/20261030043100_install_public_auto_rls.sql`, sin versionar). No se aplicó a producción.

## 6. Migraciones y publicación

| Migración | Versión registrada | Resultado |
| --- | --- | --- |
| `20261115185630_test_events_lifecycle.sql` | `20261115185630` | Aplicada y registrada |
| `20261115185637_privacy_retention.sql` | `20261115185637` | Aplicada y registrada |
| `20261116053056_prepare_private_test_event.sql` | `20261116053056` | Aplicada y registrada |
| `20261116185239_validate_optional_player_numbers.sql` | — | Posterior al informe de entrega; revisar si aún no consta registrada antes de otra migración |

PRs integrados en `main`: #18 (ciclo de vida y retención), #20–#23 (corrección de visibilidad, guía y competición), #24–#27 (vistas públicas, descargas y póster), #28 (validación y confirmación de inscripción). El check de Vercel para el SHA actual es `success`.

## 7. Instrucciones manuales

### Ejecutar otro ensayo

1. Abrir **Acceso del propietario** e iniciar sesión con la cuenta configurada.
2. **Eventos → Crear evento**: nombre, fecha, formato y cupo; marcar **Prueba**; guardar como borrador con inscripciones cerradas.
3. En la ficha del evento usar **Preparar equipos de prueba** una sola vez. Revisar y aprobar los equipos ficticios desde **Solicitudes**.
4. **Administrar calendario → Generar revisión del calendario → Confirmar y fijar calendario**; cargar resultados y correcciones; cerrar la liguilla.
5. **Eliminatorias**: preparar y confirmar el cuadro, registrar los partidos y confirmar campeón.
6. En la ficha, escribir un motivo y pulsar **Finalizar evento**. La guía completa está en [GUIA_ENSAYO_FINAL_CFP.md](GUIA_ENSAYO_FINAL_CFP.md). El ensayo nunca se publica en la web.

### Abrir el primer torneo oficial

1. Revisar el aviso público activo y confirmar desde **Privacidad y conservación** el texto, los seis meses y las medidas proporcionadas para menores. El aviso ya está activo; cambiar su texto obliga a revisar la versión que aceptaron las solicitudes ya recibidas.
2. Crear un evento **Oficial** separado, como borrador con inscripciones cerradas; revisar fecha, formato, cupo y reglas.
3. Publicar en un paso y abrir inscripciones en otro, solo cuando se decida convocar participantes reales. No mezclar equipos ficticios con participantes reales.
4. Si la edición oficial abierta `a48541f1-70d0-4c46-8c56-3b78e9c733d0` no corresponde a una convocatoria decidida por el propietario, cerrar sus inscripciones desde su ficha conservando sus 6 solicitudes para revisión. No se hizo este cambio sin confirmación.

## 8. Pendientes clasificados

| Clasificación | Pendiente |
| --- | --- |
| **Bloqueante** | Ninguno para seguir operando el ensayo. Para abrir una convocatoria oficial queda únicamente la decisión del propietario sobre la edición ya abierta y la revisión final del aviso activo. |
| **Importante** | Repetir el recorrido completo con Supabase Auth y PostgREST reales en un entorno aislado autorizado, incluyendo propietario, usuario ajeno, cookies, RLS y enlace de acceso. La evidencia actual usa transporte simulado. |
| **Importante** | Confirmar si la edición oficial con inscripciones abiertas es intencional y, de serlo, verificar que su aviso, su cupo y las 6 solicitudes cumplen las reglas antes de continuar. |
| **Importante** | Decidir el alcance de respaldos y copias técnicas de proveedores frente a la retención de seis meses. La anonimización operativa no cubre esas copias. |
| **Menor** | El texto público del aviso aún menciona que la identificación legal del responsable «requiere revisión». El propietario decidió no exigir documentos de identidad; conviene ajustar la redacción en una nueva versión del aviso, sin alterar la versión aceptada por solicitudes ya recibidas. |
| **Menor** | Las capturas y guías históricas pueden mostrar versiones anteriores del panel; actualizarlas tras el primer ensayo manual. |
| **Dependiente de configuración externa** | Entorno autorizado para Auth/PostgREST reales, acceso de lectura a despliegues protegidos, validación local aplicable y decisión del propietario sobre condiciones de plataforma de Roblox/TikTok para menores. No se resolvieron con datos ficticios ni con accesos de producción. |

El propietario ya decidió que no se pedirán documentos de identidad, que se usarán usuarios de Roblox para identificar jugadores, que se permite la participación de menores con medidas proporcionadas y no burocráticas, y que el plazo operativo es de seis meses. Esas decisiones **no vuelven a presentarse como pendientes**. Turnstile sigue descartado. No se cambiaron reglas deportivas ni se suplantó al propietario.
