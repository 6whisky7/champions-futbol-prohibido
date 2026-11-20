# Entrega final de Champions Fútbol Prohibido

> **Actualización del 20 de noviembre de 2026:** el estado vigente, verificado de nuevo en producción, está en [ESTADO_FINAL_CFP.md](ESTADO_FINAL_CFP.md). El ensayo ya se ejecutó por completo (`status=finished`, cuadro terminado), el aviso está activo con retención de seis meses y existe una edición oficial abierta por decisión ajena al asistente. Las notas de esta entrega describen el momento de la preparación inicial.

## Estado de la entrega

- Fecha: 15 de noviembre de 2026, Costa Rica.
- Código integrado en [PR #20](https://github.com/6whisky7/champions-futbol-prohibido/pull/20) y [commit 18af6029a13f8474736bdc2c466b5a7567057f30](https://github.com/6whisky7/champions-futbol-prohibido/commit/18af6029a13f8474736bdc2c466b5a7567057f30).
- [Producción](https://champions-futbol-prohibido.vercel.app) · [Acceso del propietario](https://champions-futbol-prohibido.vercel.app/admin/acceso).
- Despliegue Vercel: [Ready · dpl_EqmHYGHxuKv2LHrKcbYquURmG4S8](https://vercel.com/whiskyideas/champions-futbol-prohibido/EqmHYGHxuKv2LHrKcbYquURmG4S8). La URL de producción apunta a ese despliegue..
- Migración de producción aplicada y registrada: 20261116053056_prepare_private_test_event.sql. La migración de arranque local del preflight se conserva en el espacio de trabajo y quedó fuera del despliegue.
- Preparación en producción: [CHAMPIONS FÚTBOL PROHIBIDO — ENSAYO FINAL](https://champions-futbol-prohibido.vercel.app/admin/eventos/6cf1deb8-87bd-4386-a31f-3651f8bd807c). Identificador 6cf1deb8-87bd-4386-a31f-3651f8bd807c..
- [Guía para ejecutar el ensayo](GUIA_ENSAYO_FINAL_CFP.md).

## Correcciones y comprobaciones

| Área | Resultado |
| --- | --- |
| Formulario de participantes | Validado en Supabase y Auth reales locales. Para el ensayo del ingreso se usó una edición local sin clasificación y sin conexión a producción. Se guardó una solicitud desde una sesión anónima. El formulario y PostgreSQL rechazaron campos requeridos incompletos y duplicados normalizados de nombre, Roblox y TikTok según sus reglas. |
| Cupo y lista de espera | Validado en el navegador. Ocho solicitudes ocuparon la capacidad y las siguientes quedaron en espera. Las solicitudes enviadas en distintos instantes conservaron orden cronológico. La promoción con cupo lleno se bloqueó. El rechazo liberó la plaza, la promoción creó una pendiente y la aprobación quedó persistida. Se comprobaron cierre y reapertura. |
| Visibilidad | Las consultas públicas filtran los eventos de prueba incluso con sesión de propietario. Se conservan ediciones históricas sin clasificación. Se comprobaron catálogo, detalle, competición, exportación y proyecciones mediante rutas protegidas o respuestas 404, según corresponda. |
| Resultados | El editor liga los campos al partido y su versión. Durante el guardado quedan bloqueados el cambio de partido, jornada y las acciones incompatibles del panel. Se comprobó que el doble envío produjo una sola petición. Una revisión antigua en otra pestaña fue rechazada sin sobrescribir el partido. El mensaje de éxito muestra el estado y marcador confirmado mediante lectura de Supabase. |
| Clasificación y desempates | Regresiones SQL de duelo directo, DG, GF, sorteo, partido nulo y minitablas completas e incompletas. Un empate de cuatro equipos se resolvió en dos subgrupos. No se requirió cambiar la regla. |
| Competición y casos especiales | Integración SQL de liguilla, cuadro y LIVE. Desde el editor se confirmaron inasistencia, doble ausencia, abandono y reprogramación con la hora de Costa Rica. Generación, avances y cierre están cubiertos por las regresiones y la simulación integral previa. |
| Exportación y pantallas | CSV de calendario y resultados del ensayo privado, ICS de un partido con horario, proyecciones OBS de marcador y clasificación en el escenario local y editor a 390 × 844. Las vistas de exportación reutilizan los controles CSV, imagen y PDF. |
| Autorización y privacidad | Una cuenta local verificada ajena al propietario no pudo leer el ensayo, las solicitudes administrativas ni LIVE privado. La configuración de privacidad se ejerció solo en el entorno aislado. Se verificó la vista previa de seis meses, la anonimización de un supuesto elegible y el respeto de uno todavía dentro del plazo, con una transacción revertida. |
| Release y recursos | TypeScript, lint, inventario de activos y build de producción aprobados. Se mantuvieron los archivos originales de los 48 escudos y el trofeo V03. |

La simulación anterior y sus informes permanecen en el índice de evidencias. La comprobación de esta entrega usa la aplicación real y Supabase Auth/PostgREST locales, además de pruebas transaccionales independientes. Las operaciones de prueba sobre el formulario real y los marcadores se hicieron en la instancia dedicada, sin credenciales de producción.

## Ensayo preparado

El evento de producción quedó como **Prueba** y se puede gestionar desde [su ficha privada](https://champions-futbol-prohibido.vercel.app/admin/eventos/6cf1deb8-87bd-4386-a31f-3651f8bd807c). Su estado interno es `published` para permitir las fases administrativas, con `is_test=true`, inscripciones cerradas y plantillas fijadas. El ensayo no aparece en el listado oficial. Dejé el inicio provisional el 22 de noviembre de 2026 a las 19:00, hora de Costa Rica. La fecha puede editarse desde la ficha.

| Equipo | Escudo | Titulares | Suplentes |
| --- | --- | ---: | ---: |
| Dragones FC | 01 | 3 | 1 |
| Titanes United | 02 | 3 | 0 |
| Fénix Club | 03 | 3 | 0 |
| Tormenta FC | 04 | 3 | 0 |
| Lobos del Norte | 05 | 3 | 0 |
| Imperio Azul | 06 | 3 | 0 |
| Guerreros FC | 07 | 3 | 0 |
| Relámpagos FC | 09 | 3 | 0 |

**Estado inicial verificado**: cupo 8, ocho solicitudes aprobadas, 24 titulares, un suplente, 25 cuentas Roblox únicas y 25 cuentas TikTok únicas. La comprobación de preparación devolvió `ready=true` con los ocho participantes. Hay cero liguillas, partidos y cuadros. No existe resultado ni campeón.

[Equipos](https://champions-futbol-prohibido.vercel.app/admin/solicitudes?evento=6cf1deb8-87bd-4386-a31f-3651f8bd807c&vista=approved) · [Calendario](https://champions-futbol-prohibido.vercel.app/admin/calendario?evento=6cf1deb8-87bd-4386-a31f-3651f8bd807c).

La operación de preparación está en el esquema privado y admite un lote completo únicamente como evento de prueba. Reutiliza la validación de nombre, escudo, cupo y cuentas. Comprueba el prefijo de los identificadores ficticios y registra su incorporación como plantillas de ensayo. Los registros de admisión ficticia carecen de aceptación de aviso o confirmación de cuentas, requisitos y autorizaciones reales.

**Comprobaciones de producción después de guardar**: portada, Eventos y acceso del propietario respondieron 200. Las rutas públicas directas de evento, calendario, exportación y proyección devolvieron 404. El ensayo no apareció en el listado ni en el API de participación. Sin sesión, su ficha administrativa redirige al acceso. La base persistió ocho incorporaciones auditadas. RLS sigue activo en las 19 tablas CFP y los roles anon, authenticated y service_role no pueden ejecutar la preparación privada. Comparé las huellas de la configuración de privacidad y del evento histórico Prueba Evento antes y después y coincidieron.

## Verificación pendiente y decisiones del organizador

- La ruta de acceso en producción respondió y está configurada una cuenta de propietario verificada. La sesión personal no se abrió durante la entrega. La herramienta de escritorio no pudo verificar la URL activa con suficiente confianza y terminó el control del navegador. La prueba de permisos se realizó con Auth real en local y se mantuvo la configuración existente del propietario en producción.
- El propietario puede abrir el ensayo y realizar personalmente el sorteo, los resultados, las eliminatorias y el cierre. Los archivos de imagen y PDF no forman parte de las verificaciones directas de esta entrega.
- La revisión final del aviso activo, el procedimiento proporcionado para menores y las condiciones de plataforma de TikTok corresponden al organizador. El propietario decidió no pedir documentos de identidad, por lo que ese extremo no es un bloqueante. La prueba de anonimización verifica la conservación operativa de seis meses en la base, sin pronunciarse sobre copias de respaldo.
- Se observó antes del cambio una inscripción pública habilitada en una edición ajena al ensayo. Se conservó la configuración de privacidad y el estado de esa edición.

## Evidencia del navegador

- [Solicitud recibida por el formulario anónimo](evidencias/entrega-final/solicitud-publica.png) y [orden de lista de espera](evidencias/entrega-final/orden-espera.png).
- [Marcador persistido](evidencias/entrega-final/guardado-confirmado.png) y [rechazo de revisión obsoleta](evidencias/entrega-final/guardado-revision-obsoleta.png).
- [Editor en pantalla pequeña](evidencias/entrega-final/calendario-movil.png) y [proyección OBS local](evidencias/entrega-final/proyeccion-obs.png).
- [Calendario CSV validado](evidencias/entrega-final/calendar.csv) y [resultados CSV validados](evidencias/entrega-final/results.csv).
