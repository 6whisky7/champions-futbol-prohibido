# Prueba personal del torneo

Abre **http://127.0.0.1:8768** en este PC. La guía tiene seis puntos de práctica con enlaces a la aplicación en **http://127.0.0.1:3220**. No necesitas escribir un correo real: la guía establece una sesión **ficticia local**, con firma inválida para Supabase. Esa sesión solo funciona contra el transporte de prueba externo; no hay un acceso de demostración en el código desplegado.

## Qué puedes hacer

1. **Crear y abrir:** editar el borrador de doce plazas o crear otro, publicar y abrir en la copia local. Se usa la política ficticia `test-only-v1`; no representa una autorización real.
2. **Solicitudes y espera:** evento lleno con diez pendientes, dos aprobados y dos en espera. Revisa requisitos, rechaza una pendiente, promueve desde Espera y comprueba la nueva reserva/plazo. También puedes enviar otra espera desde el formulario con tres usuarios ficticios distintos.
3. **Cerrar y sortear:** completa comprobaciones/capitán, aprueba un número par suficiente, cierra y prepara la revisión del calendario. Comprueba rivales antes de confirmar.
4. **Liguilla y LIVE:** otro evento ya tiene doce equipos y 24 partidos. Cambia goles provisionales, observa OBS y confirma el resultado oficial aparte. Convocar exige sala disponible; la ausencia espera cinco minutos reales. Reproduce los cruces guardados sin sortear otra vez.
5. **Eliminatorias:** un cuadro independiente de ocho equipos permite registrar siete resultados y confirmar campeón. Las conexiones son las de la clasificación cerrada.
6. **Edición terminada:** consulta campeón, plantilla Roblox, páginas de equipo, tabla, resultados, récords y exportaciones del recorrido completo de doce equipos y 31 encuentros.

Son eventos separados para poder empezar en cualquier fase. El ensayo automático también comprobó un **único evento completo** desde el formulario hasta campeón; no se presenta la unión de esos puntos de práctica como una sola edición.

Los enlaces OBS se encuentran en LIVE. Tabla usa doce filas por página y el cuadro permite elegir ronda. Exportar ofrece PNG de la página visible, PDF de todas las páginas y CSV completo. El PDF contiene imágenes legibles, no texto seleccionable.

## Abrir de nuevo y recuperar

Carpeta local externa al repositorio: `C:/Users/XT/Projects/cfp-registration-tests/demo`.

- `Iniciar-demo.ps1` inicia los servicios locales si hace falta y abre Edge con la guía. Si ya está abierta, usa esa ventana o abre directamente la dirección de la guía.
- `Restablecer-demo.ps1` repone el punto de partida y **descarta solo los cambios de práctica**. Cierra las pestañas de la aplicación antes de ejecutarlo y después recarga la guía.

También puedes ejecutar desde esa carpeta `node launch.mjs` o `node reset.mjs`. El inicio se verificó con `--no-browser`; la apertura real de Edge también se comprobó. El restablecimiento se ejecutó y el recorrido de enlaces volvió a pasar después de recuperar la copia.

El clúster PostgreSQL local escucha solo en `127.0.0.1:55439`. La base de demostración es `cfp_demo_20261031` y su copia intacta es `cfp_demo_snapshot_20261031`. El script de recuperación comprueba host, puerto y nombre exactos antes de reemplazar **únicamente esa base de demostración**. No altera el clúster de pruebas original ni `cvenqmszdmhqaeokzbnz`. API de prueba: puerto 3986; guía: 8768; aplicación: 3220. Todos se vinculan a loopback.

La conexión local, el transporte de Auth/REST, perfiles de navegador y scripts de arranque permanecen fuera de Git y de `public`. La firma de envíos utiliza una clave independiente de producción, también local y fuera de Git. No copies sus credenciales a Vercel. Los modelos maestros y ZIP tampoco se añadieron a recursos públicos.

## Alcance y límites

La aplicación y las funciones/roles de PostgreSQL son reales. La identidad, los correos y el transporte Auth/REST son simulados y usan únicamente fixtures. No prueban correo, PKCE ni PostgREST reales; no se envían mensajes a nadie. No introduzcas datos de participantes reales.

La política real permanece inactiva. La autorización de menores y la confirmación individual todavía requieren aprobar e implementar el recorrido de [privacidad](privacidad-propuesta.md). Ningún requisito marcado en la demostración demuestra consentimiento de una persona real.

Evidencia: [captura de la guía](evidencia-final/demo-desktop.png), [móvil](evidencia-final/demo-mobile.png) y [comprobación de rutas](evidencia-final/demo.json) y [envío público firmado](evidencia-final/demo-signup.json). Grabación local: `C:/Users/XT/Projects/cfp-registration-tests/demo/demo-recorrido.webm`.
