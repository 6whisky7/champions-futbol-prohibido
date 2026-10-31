# LIVE, OBS y ayudantes

Segunda parte del bloque 4. Los resultados oficiales conservan las reglas y operaciones de liguilla y eliminatorias existentes. Esta entrega no abre inscripciones ni asigna ayudantes reales.

## Uso

El propietario entra en **Competición → LIVE**, elige el evento publicado y el partido confirmado. Las anclas llevan a marcador, espera, OBS, ayudantes y clips. El marcador de trabajo permite sumar o corregir goles; es provisional. Alcanzar cuatro goles de diferencia muestra un aviso y nunca termina el partido automáticamente.

Solo el propietario puede convocar: primero confirma que la sala está disponible y después inicia la espera. El reloj utiliza la hora del servidor. La ausencia 3–0 exige cinco minutos reales desde esa convocatoria, equipo afectado, motivo y confirmación. Reprogramar, repetir o cambiar una resolución invalida la convocatoria anterior, también en el segundo intento de eliminatorias.

Guardar el resultado oficial es otra acción, exclusiva del propietario, que llama a la operación de la fase correspondiente. Doble ausencia, caída general, descalificación y correcciones complejas mantienen sus recorridos en Resultados. LIVE no añade reglas ni sustituye revisiones de calendario, cuadro o campeón.

### Ayudantes

En LIVE, el propietario escribe el correo de una **cuenta existente, verificada y no anónima** y un motivo. El permiso se limita al evento publicado. No se envían invitaciones ni se crean cuentas desde esta pantalla. El ayudante entra por `/live/acceso`, mediante el mismo callback PKCE; no hay registro público. La preparación manual de una cuenta real en Supabase Auth corresponde al propietario cuando decida incorporar a alguien.

El ayudante solo consulta los partidos necesarios y edita marcadores de trabajo. No convoca, registra ausencias, guarda resultados oficiales, lee solicitudes/TikTok/notas, cambia reglas ni cierra fases. La base de datos comprueba el permiso en cada operación. Revocarlo bloquea la siguiente consulta/escritura; también puede revocarse si la cuenta perdió la verificación. La revocación queda registrada y volver a verificar el correo no reactiva ese permiso.

### OBS y exportación

- Marcador: `/obs/ID/marcador?partido=PARTIDO`.
- Clasificación: `/obs/ID/clasificacion?pagina=1`, doce filas por página.
- Cuadro: `/obs/ID/cuadro`, con `?ronda=1` para una ronda; repesca es 0.

LIVE ofrece enlaces copiables. Las vistas carecen de navegación administrativa y solo muestran proyecciones públicas. Consultan cada cinco segundos y suspenden las consultas al ocultarse. Un fallo conserva la última lectura con aviso; retirar la publicación elimina los datos de la vista. No exponen actores, correos, notas ni identificadores internos de control.

**Evento público → Exportar** ofrece PNG de la página visible, PDF de todas las páginas y CSV completo de tabla o resultados. Las imágenes usan diez filas por página. El PDF es una exportación visual rasterizada, no texto seleccionable; el CSV conserva valores completos. Los textos que podrían ejecutar fórmulas se neutralizan. jsPDF y html-to-image se importan únicamente al solicitar la descarga. No hay servicios de pago.

**Revelar sorteo** reproduce los cruces ya guardados. No envía ninguna operación de sorteo. Incluye mostrar todos, respeta movimiento reducido y pausa la secuencia cuando la pestaña está oculta.

El clip es un enlace HTTPS validado, privado por defecto y publicado solo mediante una elección explícita. El servidor no descarga su contenido. El historial registra cambios y actor.

## Datos y seguridad

Migraciones aditivas aplicadas únicamente a `cvenqmszdmhqaeokzbnz`:

- `20261031173826_live_helpers_evidence.sql`: tablas privadas con RLS, permisos por evento, marcador provisional, evidencia e historial; RPC explícitas públicas, propietario y ayudante.
- `20261031174636_live_review_indexes_revocation.sql`: índices de claves foráneas y revocación incluso con cuenta sin verificar.

Todas las mutaciones se serializan por evento, exigen revisión vigente y conservan auditoría. Un marcador provisional no modifica la clasificación. Los datos públicos se proyectan en la base; ocultar controles no es la protección.

Advisors: se resolvieron los avisos de claves foráneas sin índice. Permanecen avisos informativos de tablas privadas sin políticas (denegación deliberada), funciones SECURITY DEFINER revisadas con grants y guardas explícitas e índices nuevos aún sin uso. La política SELECT de propietario/evento publicado conserva su OR previsto. La advertencia de protección de contraseñas filtradas sigue siendo de la configuración Auth; la aplicación usa enlace por correo, sin contraseñas.

## Evidencia real

`verify-live.mjs` y `verify-live-concurrency.mjs`: PASS en PostgreSQL local aislado. Permisos cruzados, acceso directo, enteros, revisión obsoleta, carrera propietario/ayudante (un guardado y un rechazo), espera, ausencia, invalidación, segundo intento, publicación de clips y revocación. Ningún marcador se oficializa automáticamente.

`verify-live-browser.mjs`: PASS con Next en modo producción, PostgreSQL real local y **Auth/REST simulados**. Propietario en 1440/390 px, ayudante en 390 px, Axe sin infracciones y sin desbordamiento; tres vistas OBS; descargas PNG/PDF/CSV reales; PDF de dos páginas renderizado e inspeccionado; reproducción de 24 cruces sin POST; revocación y API anónima 401. No es una prueba en teléfono físico ni una prueba integral de Supabase Auth/PostgREST reales.

`supabase/tests/live.sql`: PASS en el proyecto indicado dentro de una transacción revertida, incluida la revocación de una cuenta que pierde verificación. No se conservaron fixtures. Las regresiones SQL de inscripción, requisitos, liguilla y eliminatorias también pasaron.

TypeScript, ESLint, 48 escudos originales y 48 derivados, trofeo V03 y compilación: PASS. Auditoría de dependencias de producción: cero vulnerabilidades; quedan doce avisos moderados en dependencias de desarrollo de la línea previa, sin aplicar actualizaciones incompatibles a la fuerza.

Capturas y reporte: [evidencia LIVE](evidencia-live/). El estado exacto de publicación queda registrado en [el plan](plan-mejoras.md) y en el informe final.

Pendiente: recorrer el correo/PKCE y PostgREST reales en un entorno aislado, y probar una cuenta real de ayudante solo cuando el propietario decida incorporarla. No se ha creado ni asignado una persona real para demostrarlo.
