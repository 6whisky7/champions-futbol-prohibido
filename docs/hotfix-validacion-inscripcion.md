# Hotfix de inscripción · 18 de noviembre de 2026

## Alcance y producción previa

Corrección puntual del formulario, validación en la aplicación y presentación segura de las respuestas. No incorpora migraciones, cambios de esquema, ajustes de admisión, LIVE, reglas deportivas, variables de entorno ni dependencias nuevas. Los archivos locales de otras entregas y la migración sin seguimiento quedaron excluidos.

Producción anterior comprobada: `42938a5ef6f334d582a8c2f0c78291297c0870d1`, despliegue Ready `champions-futbol-prohibido-29ami0wsy-whiskyideas.vercel.app`. Es la referencia de rollback del hotfix; restaurar únicamente el despliegue si fuera necesario, nunca datos de participantes.

La instrucción actual prevalece sobre las notas históricas que decían conservar cerradas las inscripciones: el evento oficial ya está abierto y tiene participantes reales. No se abrió ni cerró durante esta tarea. Su `review_hours` consultado es **72**; se conserva el vencimiento real devuelto por el servidor, sin recalcularlo en el navegador.

Lectura agregada inicial de todo el proyecto: 17 solicitudes aprobadas, 2 en espera y 1 rechazada. Estos totales no son una exportación ni una auditoría de integridad de cada registro. Pueden cambiar por actividad legítima mientras se trabaja.

## Causa comprobada

- Roblox y TikTok tenían `required` y longitud máxima, sin patrón ni explicación por campo. Usuarios decorativos podían llegar a SQL y fallar al validar allí.
- Los errores de transporte se convertían en un mensaje genérico; los errores del documento JSON se presentaban sin clasificar ni asociar al recorrido.
- La validación nativa podía impedir el submit sin mostrar un resumen. La privacidad deshabilitaba incluso «Revisar datos» antes de poder explicar la casilla pendiente.
- El límite de 24 caracteres del input TikTok incluía el `@`; no permitía introducir completo un identificador válido de 24 caracteres precedido por `@`.
- La respuesta se trataba como confirmación por una aserción de TypeScript, sin comprobar referencia, estado y vencimiento en ejecución.

Esto identifica fallos reproducibles del flujo. No se atribuyen solicitudes concretas fallidas a estos motivos sin registros verificables de esos intentos.

## Comportamiento corregido

- Errores inmediatos por campo, icono, borde rojo, `aria-invalid` y `aria-describedby`. «Revisar datos» y el envío validan todos los campos; foco y desplazamiento al primero. El resumen enlaza a los campos cuando hay varios errores.
- Usuarios reales frente a nombres visibles; errores específicos para vacío, enlaces, caracteres decorativos, espacios y longitudes. Verde significa solo formato válido, nunca existencia ni titularidad de una cuenta.
- Se conservan mayúsculas, `@`, puntos y guiones bajos en el JSON original. La comparación canónica se usa solo para validar/detectar duplicados y coincide con el camino existente para nombres ASCII. No se reescriben identidades ni se cambian las funciones SQL.
- Los espacios interiores se señalan en la interfaz. Solo se sugiere retirar espacios ASCII si el resultado pasa la validación; requiere una casilla independiente de titularidad y pulsar «Usar sugerencia». No se eliminan emojis ni se transliteran letras para inventar usuarios. Ante esos errores se pide copiar el usuario real del perfil. La validación del servidor conserva la compatibilidad canónica anterior, incluida su eliminación de espacios.
- Nombre del equipo según los límites existentes, 48 escudos, tres titulares, capitán entre los titulares, suplente opcional y números individuales opcionales 01–99, repetibles. La disponibilidad y los duplicados entre solicitudes siguen siendo competencia de la reserva atómica existente en SQL.
- Lista de espera voluntaria y confirmaciones conscientes; revisión y vuelta atrás conservan valores y casillas en memoria. No se añade almacenamiento persistente privado.
- Errores de negocio conocidos se traducen mediante una lista cerrada. El conflicto «nombre o escudo» permanece combinado porque el servidor no identifica cuál de los dos falló. No se revela el TikTok de otra solicitud. Los errores desconocidos nunca exponen SQL ni trazas.
- Referencia UUID, estado conocido y vencimiento coherente antes de mostrar confirmación. Pendiente no equivale a aprobado. Se pide guardar la referencia y contactar a Whisky antes del vencimiento real.
- Bloqueo síncrono de doble envío. En un resultado incierto se bloquea la edición y se permite comprobar **el mismo payload con la misma clave existente**; no se añade persistencia ni otro sistema de idempotencia. La comprobación puede completar el intento si nunca llegó; la garantía de no duplicación la conserva la RPC existente. Si no puede confirmarse, se conserva la página y se indica consultar al organizador.

## Fuentes y compatibilidad

[Roblox: usuario frente a nombre visible](https://en.help.roblox.com/hc/en-us/articles/203313130-Changing-Your-Username), [Roblox: reglas actuales al crear un usuario](https://en.help.roblox.com/hc/en-us/articles/4412614080532-Xbox-Error-901), [TikTok: nombre de usuario](https://artists.tiktok.com/help-center/change-username), [Supabase: RPC](https://supabase.com/docs/reference/javascript/rpc). Se consultó el changelog de Supabase y la documentación instalada de Server Functions de Next 16.4.3.

Las plataformas pueden imponer condiciones adicionales al crear una cuenta nueva (por ejemplo, posición del guion bajo o del punto). El hotfix no convierte esas condiciones en una regla nueva que invalide identificadores históricos admitidos por CFP. No verifica cuentas remotas.

## Verificación reproducible

```powershell
npm run typecheck
npm run lint
npm run check:assets
npm run build
node scripts/test-application-validation.mjs
node scripts/test-registration-browser.mjs
```

El segundo script requiere una compilación previa y Playwright/Edge en Windows (Chromium en otros sistemas). Para WebKit: `npx playwright install webkit`. Arranca Next en `127.0.0.1:3238` y un transporte ficticio en `127.0.0.1:3988`, interceptando Supabase solo en ese proceso. Usa una clave de firma independiente, datos ficticios y ninguna cuenta real. Los puertos y la carpeta de evidencias admiten `REGISTRATION_TEST_PORT`, `REGISTRATION_TEST_API_PORT` y `REGISTRATION_TEST_OUTPUT`.

La verificación se realiza sobre una copia limpia de los archivos versionados y del hotfix, fuera de `work/`: las copias antiguas sin seguimiento dentro de esa carpeta producen errores de TypeScript ajenos al cambio. Se conservan los archivos locales originales. Las dependencias copiadas son las ya instaladas y fijadas en el lockfile, sin actualización de versiones.

- **41 comprobaciones unitarias y del Server Action**: caracteres inválidos/emoji, nombres decorativos, enlaces, con/sin `@`, usuario de 24 caracteres más `@`, puntos y guiones bajos, longitud, espacios, duplicados, nombre, escudo, plantilla, capitán, suplente, números, confirmaciones, sugerencia, respuesta válida/malformada, protección frente a mensajes internos y contrato de firma/JSON/clave/privacidad.
- **15 comprobaciones SQL locales**: RPC firmada, referencia real, mismo reintento sin otra fila, JSON original, 72 horas, caracteres inválidos ASCII, `00`, duplicados internos/entre equipos, nombre/escudo reservados, espera sin reservas y suplente. PostgreSQL local `127.0.0.1:55439`; validador versionado instalado solo dentro de una transacción local y rollback completo de definición y datos de prueba. No es un ensayo de Supabase Auth/PostgREST reales. Esa base local usa WIN1252: los emojis se comprueban en aplicación y navegador, no se presenta ese ensayo como una validación Unicode de PostgreSQL de producción.
- **Navegador**: recorrido de revisión/vuelta atrás, reservas y conflictos simulados, cupo completo/espera voluntaria, doble pulsación, firma real de Server Action con transporte simulado, errores de conexión, respuesta incompleta y recuperación exacta tras un guardado ficticio con respuesta incierta. Anchos 1440, 390, 320 y 720; teclado, foco, contraste automatizado y movimiento reducido. 720 representa reflow, no una prueba física de zoom del navegador.
- **Límites móviles**: emulación de Chromium/Android y WebKit/iPhone. No son teléfonos físicos ni el navegador integrado real de TikTok.

Los 30 casos del encargo están cubiertos entre las pruebas de unidad/contrato, SQL local y navegador; las reservas concurrentes siguen usando el código SQL existente, sin una carga artificial en producción. Las pruebas de errores y confirmaciones del navegador utilizan respuestas controladas y se distinguen del ensayo SQL.

## Pendientes separados

1. **La Chapizza**: la decisión actual dice opcional, pero el texto y `cfp_private.checks_complete` todavía la exigen junto a follow/friend. Se conserva esa regla en este hotfix. El propietario autorizó tratar el ajuste después, en una tarea separada con revisión de implicaciones; no se ejecuta aquí.
2. **Next.js**: `npm audit --omit=dev` detectó dos avisos moderados del paquete instalado, [GHSA-mfr8-8qww-v76h](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h) y [GHSA-vc7v-qv4w-wrv8](https://github.com/vercel/next.js/security/advisories/GHSA-vc7v-qv4w-wrv8). Ambos describen cachés con `use cache`/root params; la búsqueda en `src` y `next.config.ts` no encontró esas APIs ni `unstable_cache`/Cache Components. Se recomienda actualizar a una versión corregida (audit propone 16.4.6) como mantenimiento separado. La compilación local primero se interrumpió por ese aviso y después terminó al repetir el comando; no se ocultó el aviso ni se cambió la configuración.
3. Validación en teléfonos físicos y navegador integrado de TikTok: requiere esos dispositivos; no se afirma realizada.

## Publicación y comprobación final

Se registran PR, commit, estado de Vercel, capturas y comprobación pública en el informe final de esta entrega. No se ejecutan escrituras administrativas, migraciones, mutaciones SQL ni solicitudes ficticias en producción. La lectura agregada antes/después no demuestra por sí sola la integridad individual de cada registro. La comprobación pública del formulario debe bloquear los POST desde el navegador y limitarse a datos incompletos/inválidos, sin confirmar ni enviar una inscripción.
