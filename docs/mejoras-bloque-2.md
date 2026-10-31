# Inscripción protegida y privacidad preparada

## Alcance entregado

Turnstile se retiró por decisión expresa del propietario. No existe captcha ni se presenta protección contra bots distribuida como resuelta.

La acción de servidor firma con HMAC-SHA256 el evento, UUID de reintento, contenido UTF-8 exacto, modo de espera, versión, fecha y huella temporal de conexión. En Vercel se utiliza `x-vercel-forwarded-for`, proporcionado por la plataforma; nunca una huella elegida por el formulario. La base exige firma y antigüedad máxima de cinco minutos. La antigua RPC conserva uso interno, pero no permisos de ejecución para anon/authenticated.

Los contadores privados persistentes permiten seis intentos por minuto y veinte por hora por conexión. Son ventanas fijas, no una garantía contra abuso distribuido; conexiones compartidas pueden alcanzar el límite juntas. La huella cambia por día UTC y no guarda la IP en solicitudes. Validaciones fallidas consumen intento; un reintento idéntico exitoso es gratuito. Un bloqueo por huella y el bloqueo original por evento conservan concurrencia, idempotencia y reservas. Se purgan ventanas vencidas en nuevos envíos y cada quince minutos mediante pg_cron.

`CFP_SUBMISSION_HMAC_KEY` está configurada exclusivamente en servidor local y Vercel Production/Preview; no es una clave privilegiada de Supabase. El mismo secreto se guarda en la configuración privada de ingreso, inaccesible para roles ordinarios. Para rotarla, generar un valor aleatorio de al menos 32 bytes, actualizar ambos extremos y desplegar; durante el cambio los envíos pueden fallar conservando campos. Nunca pegarlo en Git, capturas o documentación.

## Privacidad pendiente de aprobación

Responsable: Whisky. Contacto preferente: [TikTok @whiskyzc](https://www.tiktok.com/@whiskyzc); alternativa autorizada: isaacarias053@gmail.com. La página `/privacidad` distingue información pública y privada, corrección/retirada y decisiones pendientes. Faltan conservación, edad mínima, participación de menores y texto final. No se inventaron edades, autorizaciones familiares ni plazos legales; no se solicita documento ni nacimiento completo.

La configuración privada permanece `active=false, version=null` en producción. El formulario solo acepta una versión activa; servidor y trigger de eventos impiden abrir mientras no esté aprobada. Tras decidir el texto se deberá publicarlo, fijar su identificador versionado y activar esa configuración mediante una migración explícita revisada. No basta con marcar una casilla. El recibo guarda versión y hora privadas sin modificar solicitudes antiguas ni presumir consentimiento de todos los integrantes.

Fuentes oficiales: [Ley 8968](https://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/L/2010-2019/2010-2014/2011/1153F/DCEF7.HTML), [PRODHAB](https://www.prodhab.go.cr/preguntasfrecuentes.aspx), [Ley 10238](https://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/L/2020-2029/2020-2024/2022/17CE2/151A54.HTML). El aviso preparado no certifica una política jurídica definitiva.

## Verificación

- PostgreSQL local aislado: firmas falsas/caducadas, entrada Unicode, recibo versionado, reintento gratuito, límite persistente, doce envíos simultáneos (seis aceptados), límite horario y consumo tras errores. Carreras por escudo/jugador/última plaza, promoción, vencimiento, cierre y correcciones: PASS.
- SQL remoto solo en `cvenqmszdmhqaeokzbnz`, fixtures en transacciones revertidas: `ingress.sql`, `registration.sql`, `events_rls.sql`, `league.sql`, `knockout.sql`: PASS. Ninguna prueba deja eventos/participantes reales ni altera al propietario.
- Navegador: acción Next real sin cuenta, transporte Supabase de prueba y PostgreSQL real; casilla versionada, solicitud y recibo privados: PASS. Auth del ensayo administrativo es simulado; no equivale al recorrido con Supabase Auth/PostgREST reales.
- Advisors: 12 tablas privadas con RLS sin políticas (denegación directa deliberada), cinco entradas públicas y once autenticadas SECURITY DEFINER con comprobaciones explícitas. Avisos revisados, no un informe sin advertencias. [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [RPC públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [RPC autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Sigue desactivada la [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); el propietario usa enlace de correo.

Los scripts versionados necesitan `CFP_TEST_DIR` del clúster local aislado y rechazan otro host/puerto. El sustituto de Auth y sus credenciales quedan fuera del repositorio. No se añadió ningún acceso de prueba a la aplicación.

Ensayo integral actualizado: PASS, un evento local de doce equipos desde inscripción a campeón, 31 encuentros; informe `C:/Users/XT/Projects/cfp-registration-tests/integral-mvwl58qy/report.json`. La revisión Axe encontró una falta de separación textual en la marca compartida; se corrigió manteniendo su presentación.

Comprobaciones finales: `npm run check` (TypeScript, ESLint y 48 assets) y `npm run build`: PASS. Privacidad en 390/1440 px: sin desbordamiento; Axe sin infracciones detectadas. Capturas locales: `C:/Users/XT/Projects/cfp-presentation-tests/privacy-mobile.png` y `privacy-desktop.png`. El estado remoto después de revertir fixtures conserva cero eventos, cero solicitudes y política inactiva.
