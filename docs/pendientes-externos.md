# Pendientes externos y antes de abrir un torneo real

> **Estado vigente (20 de noviembre de 2026):** ver [ESTADO_FINAL_CFP.md](ESTADO_FINAL_CFP.md). El aviso está activo con versión `2026-11-15-v1`, retención de seis meses y tarea diaria funcionando; el ensayo final terminó; hay una edición oficial abierta con 6 solicitudes que no fue creada por el asistente. No se pide identificación legal: el propietario lo descartó. Las notas siguientes conservan el historial de la validación.

## Validación del 16 de noviembre de 2026

Se probó el recorrido de inscripción con Auth y PostgREST reales en Supabase local, usando nombres e identificadores ficticios. Se verificaron el aviso versionado, la recepción, la aprobación, el rechazo y la promoción desde espera. En producción se consultaron únicamente el formulario, los estados y los conteos. La edición antigua «Prueba Evento», sin clasificación explícita, sigue mostrando el formulario y conserva una solicitud en espera. Se propone cerrar la recepción en esa edición conservando su solicitud para revisión.

La configuración activa del aviso acredita la acción del operador. La autorización individual de menores requiere un procedimiento verificado e independiente de la declaración del capitán. Antes de aceptar inscripciones oficiales siguen pendientes la identificación formal del responsable, la revisión del aviso y los respaldos, la acreditación de cada integrante y el recorrido compatible con las condiciones de Roblox y TikTok. El plazo operativo existente es de seis meses. Se volvió a comprobar localmente la anonimización de candidatos y sus copias de historial mediante una transacción revertida.

## Registro de la entrega anterior

Actualización: 15 de noviembre de 2026, Costa Rica. Las inscripciones reales permanecen cerradas. El estado completo está en [ESTADO_FINAL_CFP.md](ESTADO_FINAL_CFP.md).

| Pendiente | Situación comprobada | Siguiente paso |
| --- | --- | --- |
| Ensayo completo con Supabase Auth y PostgREST reales | El acceso previo del propietario fue confirmado, pero el ensayo deportivo usa Auth/REST simulados y PostgreSQL real aislado. Docker inicialmente devolvía `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`. Se inició Docker Desktop sin cambiar su configuración y el motor respondió 29.6.2. El comando combinado para preparar/iniciar Supabase en `C:/Users/XT/Projects/cfp-auth-real` fue rechazado por revisión automática: `blocked by policy`, sin explicación adicional. No se ejecutó ese comando ni se eludió el rechazo. | Disponer de la pila Supabase local operativa con Auth/REST y las migraciones de CFP, o un entorno remoto de ensayo expresamente autorizado. Ejecutar allí login con tokens reales, propietario/ajeno, cookies, RLS y recorrido completo; no usar producción ni suplantar al propietario. El directorio aislado solo quedó inicializado; no se cambió la configuración de Docker ni se arrancó la pila Supabase. |
| Aviso definitivo | Responsable Whisky y contacto ya decididos; el aviso está activo en versión `2026-11-15-v1`. El propietario decidió no pedir documentos de identidad. | Revisar la redacción pública en una nueva versión si se considera necesario, sin alterar la versión aceptada por solicitudes ya recibidas. |
| Autorización de menores y confirmación individual | Se permite participación sin mínimo propio y con autorización verificable; el procedimiento sigue sin validar ni implementar. La declaración del capitán no acredita a toda la plantilla. | Validar el recorrido y acreditación necesarios, implementarlo y probarlo antes de activar. |
| Conservación | Implementada con plazo de seis meses, anonimización auditable e idempotente, vista previa y tarea diaria `pg_cron`. No hay solicitudes en producción. | Revisar alcance legal, transferencias y política de respaldos antes de activar el aviso o aceptar inscripciones. |
| Requisitos de TikTok en menores | No se activa una excepción ni se exige infringir condiciones de plataforma. | Decidir y validar el recorrido compatible antes de recibir esos casos. |
| Reglas deportivas aún abiertas | Convocatoria/reclamaciones, desconexiones/abandono simultáneo, sanciones, infracciones posteriores y cierre con número impar siguen documentados. | Resolver los casos concretos de [decisiones vigentes](decisiones-del-torneo.md), sin cambiarlos desde un rediseño. |

Turnstile continúa descartado. No se vuelven a pedir decisiones ya confirmadas. No se crearon usuarios, participantes ni eventos reales ni se activó la política pública. La prueba simulada no se presenta como ensayo real de GoTrue, correo, PKCE o PostgREST.
