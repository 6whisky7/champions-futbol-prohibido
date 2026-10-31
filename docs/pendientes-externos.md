# Pendientes externos y antes de abrir un torneo real

Actualización: 31 de octubre de 2026, Costa Rica. Son independientes del pulido visual. Las inscripciones reales permanecen cerradas.

| Pendiente | Situación comprobada | Siguiente paso |
| --- | --- | --- |
| Ensayo completo con Supabase Auth y PostgREST reales | El acceso previo del propietario fue confirmado, pero el ensayo deportivo usa Auth/REST simulados y PostgreSQL real aislado. Docker inicialmente devolvía `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`. Se inició Docker Desktop sin cambiar su configuración y el motor respondió 29.6.2. El comando combinado para preparar/iniciar Supabase en `C:/Users/XT/Projects/cfp-auth-real` fue rechazado por revisión automática: `blocked by policy`, sin explicación adicional. No se ejecutó ese comando ni se eludió el rechazo. | Disponer de la pila Supabase local operativa con Auth/REST y las migraciones de CFP, o un entorno remoto de ensayo expresamente autorizado. Ejecutar allí login con tokens reales, propietario/ajeno, cookies, RLS y recorrido completo; no usar producción ni suplantar al propietario. El directorio aislado solo quedó inicializado; no se cambió la configuración de Docker ni se arrancó la pila Supabase. |
| Aviso definitivo e identificación | Responsable Whisky y contacto ya decididos; falta completar identificación legal y canal formal aplicable. | Validar el aviso y su identificación antes de activar su versión. |
| Autorización de menores y confirmación individual | Se permite participación sin mínimo propio y con autorización verificable; el procedimiento sigue sin validar ni implementar. La declaración del capitán no acredita a toda la plantilla. | Validar el recorrido y acreditación necesarios, implementarlo y probarlo antes de activar. |
| Conservación | 30/90 días son plazos provisionales; no hay purgas activadas. | Revisar alcance, incidencias, auditoría y respaldos antes de automatizar eliminación. |
| Requisitos de TikTok en menores | No se activa una excepción ni se exige infringir condiciones de plataforma. | Decidir y validar el recorrido compatible antes de recibir esos casos. |
| Reglas deportivas aún abiertas | Convocatoria/reclamaciones, desconexiones/abandono simultáneo, sanciones, infracciones posteriores y cierre con número impar siguen documentados. | Resolver los casos concretos de [decisiones vigentes](decisiones-del-torneo.md), sin cambiarlos desde un rediseño. |

Turnstile continúa descartado. No se vuelven a pedir decisiones ya confirmadas. No se crearon usuarios, participantes ni eventos reales ni se activó la política pública. La prueba simulada no se presenta como ensayo real de GoTrue, correo, PKCE o PostgREST.
