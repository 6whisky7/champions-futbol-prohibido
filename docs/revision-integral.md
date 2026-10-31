# Revisión integral previa al primer evento real

Fecha de revisión: **30 de octubre de 2026**, Costa Rica. [Guía breve con capturas](primer-evento.md).

## Resultado

**PASS del recorrido completo aislado**: evento `c94ea073-142d-4128-9e05-2d1f9e215f0a`, doce equipos, cuatro jornadas, 24 partidos de liguilla y siete eliminatorios, campeón confirmado y plantilla pública correcta. [Registro de pasos](evidencia-integral/ensayo.json).

El evento se creó, publicó y abrió desde el panel. Las solicitudes entraron por el formulario público con tres titulares y casos con suplente. Rechazo, corrección, confirmación de capitanes, requisitos, aprobación, promoción, cierre, sorteo, resultados, desempates y campeón utilizaron la interfaz y sus operaciones normales. No se reintrodujeron equipos entre módulos ni se insertaron plantillas manualmente. La única edición directa en ese recorrido adelantó el vencimiento de una solicitud de prueba; no alteró plazos de producción.

La ejecución final repitió el recorrido desde cero, sin interrupciones. Hubo ejecuciones previas fallidas: los defectos de aplicación descritos abajo, un selector de texto mal codificado, una consulta prematura del navegador antes de cargar los sorteos y una interrupción entre turnos. Los problemas del harness se corrigieron y no se contabilizan como defectos del producto.

## Correcciones publicables

| Fallo reproducido | Corrección y comprobación |
| --- | --- |
| Error del servidor borraba nombre/fecha al guardar un evento | Campos controlados y cancelación del reinicio nativo, incluidos selectores; conserva todos los valores; cambia de formulario al cambiar de evento |
| Corte de red al guardar un evento destruía el formulario | Captura el fallo de fetch, conserva campos y permite revisar antes de reintentar; las redirecciones de Next siguen propagándose |
| Calendario de un evento nuevo intentaba leer partidos inexistentes | Lectura defensiva del estado de preparación; muestra requisitos y sorteo deshabilitado |
| «Guardado» de una corrección se mostraba como error rojo | Aviso de éxito con status separado del error |
| Guardar resultado/fecha/inhabilitación de eliminatorias no enviaba el formulario | `type="submit"` explícito en los tres controles Base UI; resultados comprobados hasta campeón; fecha e inhabilitación verificadas en otro fixture de módulo aislado |

Base UI exige declarar el tipo de los botones de envío: [documentación oficial](https://base-ui.com/react/components/button). No se cambiaron reglas, esquema, dependencias, recursos V03 ni permisos.

## Evidencia por nivel

| Nivel | Qué se comprobó | Límite |
| --- | --- | --- |
| Navegador aislado | Edge real, interfaz Next compilada, acciones del servidor y funciones PostgreSQL reales | Auth y transporte Supabase sustituidos localmente; no es GoTrue/PostgREST real |
| SQL local | Roles anon/owner/ajeno, reservas, conflictos, correcciones, bloqueos, dependencias, reintentos | Roles y claims de prueba; no prueba entrega de correo ni cookies de Auth real |
| Supabase autorizado | `events_rls.sql`, `registration.sql` y `knockout.sql` en transacciones revertidas | Fixtures SQL de usuarios; no inicio de sesión real. KO incluye liguilla completa hasta campeón |
| Producción | Sitio público, protección de rutas sin sesión, recursos y despliegue del commit | No se ejecutó el torneo desde una sesión real del propietario |
| Acceso real previo | El propietario confirmó que entró desde su correo | No sustituye esta integración autenticada completa |

**No había entorno aislado con Supabase Auth real.** Docker Desktop no tenía disponible su motor Linux (`dockerDesktopLinuxEngine`). No se inventaron credenciales ni se suplantó al propietario. Sigue pendiente repetir el recorrido autenticado en un entorno aislado con Auth/PostgREST reales cuando se disponga de él.

Las pruebas remotas operaron exclusivamente sobre `cvenqmszdmhqaeokzbnz`, dentro de `BEGIN/ROLLBACK`. Se comprobaron cero eventos, solicitudes, liguillas y cuadros persistidos después. Las nueve tablas privadas tienen RLS y ningún SELECT directo concedido a anon/authenticated. No se aplicaron migraciones ni se abrieron inscripciones reales.

## Cobertura complementaria

- Reservas/liberación de plaza, escudo, nombre y jugadores después de rechazo/vencimiento; promoción rechazada por jugador ocupado y aceptada tras corrección. Cupo completo conserva lo escrito.
- Solicitud pendiente al cerrar: mismo vencimiento y sorteo bloqueado. Aprobación posterior dentro de plazo; plantillas fijadas sin reintroducción.
- Corrección 5–2 a 4–2: GF disminuye uno; suma PJ permanece 48. Desempates sorteados y persistidos antes de cerrar.
- Regresiones SQL de inhabilitación, dependencias, retirada explícita, doble ausencia y campeón por clasificación sin goles inventados; bloqueo si no hay campeón habilitado.
- Reintentos de confirmación conservan los mismos 24+7 partidos. Concurrencia aislada: un solo ganador al disputar el mismo escudo o la última plaza; misma clave devuelve la misma solicitud.
- Segunda edición creada desde interfaz: reutiliza nombre, escudo y jugadores de la primera; su solicitud no crea cuadro ni cambia al campeón anterior. [Registro complementario](evidencia-integral/adicional.json).
- TikTok de prueba, correo del propietario, motivos privados y access_token ausentes del HTML público de evento, calendario, resultados, clasificación y eliminatorias. SQL remoto comprueba las proyecciones públicas y rechaza administración anónima/ajena/no verificada.
- Fallo de red del formulario público: conserva datos y permite reintentar en la misma página sin duplicar solicitud.

## Revisión de interfaz y carga

Diez rutas administrativas y cinco públicas revisadas en **1440 y 390 px**; evento seleccionado conservado, sin desbordamientos ni errores de página. Axe WCAG A/AA sin infracciones detectadas en las diez pantallas administrativas; no es una certificación completa de accesibilidad. Selector de ronda y foco al detalle operativos en móvil. Zoom nativo de administración al 200 %: DPR2, viewport/scrollWidth 708 px, CSS zoom 1; selector y detalle operativos ([registro](evidencia-integral/admin-zoom.json)). Se revisaron visualmente las capturas reales; la identidad y los tokens se conservan.

Portada en 360, 390, 768, 1024 y 1440 px: filtros, búsqueda, 48 recursos, teclado, menú/Escape, recuperación del foco, movimiento reducido, 404 y zoom nativo al 200 %. [Reporte](evidencia-integral/portada.json). Trofeo: carga automática, teclado/reset, alternativa de imagen ante fallo, scroll táctil y ocultación fuera de pantalla. [Reporte](evidencia-integral/trofeo.json).

Simulación móvil nueva: **LCP 1384 ms; 3D listo 12 319 ms; 1 942 669 bytes** hasta estar listo. Edge de escritorio, viewport 390×844, DPR2, red 1,6 Mbps / RTT 150 ms, CPU ×4 y contexto frío. **No es teléfono físico ni Lighthouse**. No cambió la carga del modelo; son medidas de esta ejecución, no una garantía de red real.

TypeScript, ESLint sin avisos, verificación de 48 escudos y trofeo, y compilación de producción: **PASS**. El primer lint del nuevo harness detectó un `scrollTo` sin calificar; se corrigió a `window.scrollTo` y el check completo pasó. El despliegue y commit se comprueban después de integrar y se registran en la entrega.

La revisión final de Impeccable se realizó en línea: los revisores independientes no pudieron ejecutarse por límite de uso. No se presenta esa sustitución como una segunda revisión independiente. La documentación visual se reconcilió con el trofeo actual; no se cambió la paleta ni la tipografía.

## Avisos de Supabase

Advisors conserva avisos sobre funciones SECURITY DEFINER ejecutables ([públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)) y [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) en tablas privadas. Son entradas RPC con validación y denegación de acceso directo intencionales; las pruebas verifican sus permisos. Sigue desactivada la [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); el propietario accede por enlace de correo. No se afirma que Advisors esté sin avisos.

## Decisiones deportivas pendientes

| Decisión sin aprobar | Cuándo afecta |
| --- | --- |
| Convocatoria, posposición y cierre de reclamaciones | Antes de publicar horarios y tramitar protestas |
| Desconexión temporal de todos, tiempo para volver y doble abandono sin caída general | Durante un partido interrumpido |
| Sanciones de trampas, suplantación y acuerdos para regalar resultados | Al resolver una denuncia con pruebas |
| Infracción descubierta tras cerrar liguilla/final y falta de finalistas habilitados | Si aparece después del cierre; la app no inventa una resolución retrospectiva |
| Aprobados impares al cerrar | Antes de confirmar calendario; queda bloqueado |

La llegada tardía del tercer titular y la segunda doble ausencia en la final ya están resueltas. Fuente: [decisiones confirmadas](decisiones-del-torneo.md).

## Antes de abrir el primer evento real

1. Confirmar acceso y cierre de sesión reales del propietario en el dominio publicado; revisar el límite pendiente de Auth real descrito arriba.
2. Acordar y comunicar los puntos deportivos pendientes, especialmente convocatoria, reclamaciones y número impar. No convertir propuestas en reglas sin aprobación.
3. Crear el borrador propio, revisar hora de Costa Rica, formato, cupo y plazo; comprobar su página publicada antes de abrir. Publicar no equivale a abrir.
4. Abrir únicamente por decisión del propietario. Conservar pendientes/plazos y revisar los datos antes de cada confirmación definitiva.

## Repetición técnica

El harness externo de esta máquina está en `C:/Users/XT/Projects/cfp-registration-tests`; PostgreSQL 18.4 en loopback 55439, API simulada en 3980 y Next compilado en 3210 con fetch redirigido únicamente al transporte local. `auth-design.mjs` y `connection.json` permanecen fuera del repositorio y del runtime de producción.

```powershell
$env:CFP_TEST_DIR='C:/Users/XT/Projects/cfp-registration-tests'
node scripts/verify-integral.mjs
node scripts/registration-regressions.mjs
node scripts/verify-knockout-rules.mjs
npm run check
npm run build
```

El ensayo genera un evento local nuevo y capturas con cada ejecución. No ejecutar suites antiguas que vacían tablas globales en la misma base mientras se conserva evidencia; los controles adicionales usaron eventos propios y no borraron tablas. Los scripts SQL remotos contienen rollback y deben ejecutarse completos.
