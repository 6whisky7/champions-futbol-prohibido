# Liguilla: sorteo, resultados y clasificación

Esta etapa añade competición al panel CFP sin sustituir inscripciones, acceso del propietario, trofeo ni escudos. Solo utiliza Supabase `cvenqmszdmhqaeokzbnz`. No inicia eventos reales. Este documento conserva el bloque de liguilla; la etapa posterior de [eliminatorias y campeón](eliminatorias.md) se genera explícitamente desde su clasificación cerrada.

## Preparación y calendario

`/admin/calendario`, `/admin/resultados` y `/admin/clasificacion` conservan el selector de evento. La preparación exige inscripciones cerradas, plantillas fijadas, ausencia de pendientes dentro de plazo y un número par de aprobados compatible con el formato. Sin eliminación de liguilla, los participantes deben coincidir con los clasificados. La espera nunca se incorpora automáticamente ni se excluye o aprueba a nadie para ajustar el número.

El algoritmo permuta los equipos aleatoriamente y selecciona jornadas de una factorización circular: cada jornada empareja a todos una vez, sin rivales repetidos ni equipos libres. Cuartos usa 4 rivales; octavos, 6; dieciseisavos y repesca, 8. Doce equipos y cuatro jornadas producen 24 partidos.

Primero se guarda una revisión privada. Puede regenerarse explícitamente antes de confirmar; el historial conserva la revisión anterior. Confirmar vuelve a comprobar los requisitos bajo el bloqueo del evento y fija los participantes, el formato, rivales y jornadas. Reintentar no crea otro calendario. Las bajas posteriores se resuelven administrativamente. Se pueden cambiar fechas y registrar posposiciones con motivo, sin cambiar el rival; las horas se expresan en Costa Rica.

Los visitantes consultan `/eventos/[id]/calendario`, `/resultados` y `/clasificacion` sin cuenta, únicamente para eventos publicados y con calendario confirmado. La vista de resultados muestra encuentros resueltos; pendientes, pospuestos y repeticiones no suman PJ.

## Resultados y auditoría

Solo el propietario puede registrar o corregir resultados. Cada escritura requiere una revisión no nula y vigente de la competición, de modo que otra pestaña no sobrescribe silenciosamente los cambios. El historial privado registra fecha, actor, motivo y valores anteriores/nuevos.

- Deportivo: ganador, goles enteros no negativos y diferencia máxima de cuatro. No existe un máximo de cuatro goles totales: 5–2 es válido.
- Ausencia: 0–3 o 3–0 según el equipo ausente.
- Doble ausencia: nulo 0–0, PJ y PN para ambos, sin puntos ni goles.
- Abandono: 0–4 o 4–0.
- Caída general: repetir desde cero; el intento interrumpido no suma estadísticas.

Estas decisiones son administrativas; la aplicación no las deduce desde Roblox. Recalcular parte del estado oficial actual, sin añadir puntos acumulativos por cada corrección.

## Clasificación y cierre

La tabla muestra posición, PJ, PG, PP, PN, GF, GC, DG y puntos. Ordena primero por puntos. En dos empatados prima el ganador del duelo directo; si no jugaron o fue nulo, usa DG, GF y sorteo. En tres o más utiliza minitabla de victorias solo si todos se enfrentaron; conserva los grupos separados y resuelve recursivamente cada subgrupo. Si el duelo directo o la minitabla no separan, usa DG/GF generales y sorteo.

Los empates todavía sin resolver conservan posición compartida y «Zona por resolver». El sorteo final requiere todos los partidos resueltos, afecta solo al grupo empatado y queda persistido. Un cambio de resultado o una descalificación invalida los sorteos actuales, conservando su historial; cambiar únicamente una fecha no los invalida.

Una descalificación durante la liguilla sustituye efectivamente todos sus partidos por derrotas 0–3, o nulo si ambos están descalificados. Conserva los originales en auditoría. El sancionado queda al fondo, excluido, con −12 puntos finales fijos y 100 GC administrativos adicionales aplicados una sola vez. No se han añadido sanciones para conductas aún sin decisión.

Cerrar exige encuentros resueltos y sorteos pendientes completados. La clasificación final queda conservada e inmutable para la siguiente etapa; el cierre de liguilla no construye ni avanza eliminatorias automáticamente. Su revisión y confirmación se realizan por separado desde [Eliminatorias](eliminatorias.md). Los casos abiertos del reglamento siguen en [decisiones del torneo](decisiones-del-torneo.md).

## Base de datos y privacidad

La migración `20261030150106_league_competition.sql` añade `cfp_private.leagues`, `league_matches` y `league_history`. Tienen RLS y no conceden acceso directo a `anon` ni `authenticated`. Las entradas de escritura verifican al propietario en servidor y base; las operaciones se serializan bloqueando la fila del evento.

Las RPC públicas exponen datos de equipos, encuentros y tabla; no usuarios TikTok ni notas privadas. La revisión previa tampoco es pública, incluso si el argumento `admin` llega nulo. Las lecturas administrativas requieren propietario verificado. Advisors identifica funciones `SECURITY DEFINER` ejecutables y RLS sin políticas en tablas privadas: son entradas controladas y denegación directa intencional, no autorización general. Se conserva el aviso previo de protección de contraseñas filtradas desactivada; Auth usa enlaces de correo.

Referencias oficiales: [funciones y permisos](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [aviso de funciones públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) y [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Evidencia y límites

- PostgreSQL local aislado: formatos con 8/12, 16/18, 32 y 24/48 participantes; rivales únicos, jornadas completas, resultados, nulos, repetición, descalificación, cierre y clasificación persistida.
- Desempates: dos, múltiples, ciclos, duelos incompletos y sorteo persistente. Regresiones de argumentos nulos y regeneración tras cambios de participantes.
- Confirmaciones y revisiones simultáneas: un solo calendario y 24 partidos para doce equipos.
- SQL remoto en una transacción revertida: recorrido de doce equipos hasta cierre, control de permisos, argumentos nulos y privacidad. Después se confirmaron cero eventos, solicitudes y liguillas persistidos.
- Navegador: calendario, resultados y clasificación en 1440/390 px; Axe sin infracciones detectadas, sin desbordamientos ni errores React, lectura pública y guardado de 5–2. Auth visual es un sustituto local: no equivale a verificar de nuevo la sesión real del propietario en producción.

Scripts, reportes y capturas locales están en `C:/Users/XT/Projects/cfp-registration-tests/`, bajo `league-*` y `league-review`. El fixture SQL versionado está en `supabase/tests/league.sql`. La publicación debe comprobarse contra el commit integrado y Production Ready; estas pruebas no afirman por sí solas que el despliegue haya terminado.

## Pulido visual y horarios por jornada

La selección `jornada` y el partido editado se guardan en URL. Cambiar de jornada cierra el editor anterior; guardar y recargar conservan la jornada seleccionada. Las pestañas cuentan encuentros resueltos, incluidos los nulos administrativos, sin introducir empates deportivos.

«Asignar fechas a la jornada» prepara horarios de encuentros sin resolver, con separación editable que no cambia la duración del juego. Exige motivo y revisión previa. Reutiliza cfp_league_action y su versión vigente; cada partido se confirma por separado. Un fallo puede dejar parte guardada: la interfaz identifica esos partidos, pide revisar y bloquea reutilizar una revisión desactualizada. Al preparar otra revisión, los horarios idénticos no generan otra escritura ni historial. Los jugados se conservan y sus correcciones siguen siendo individuales. No hay una nueva RPC ni un permiso de escritura directa.

La tabla prioriza puntos y DG, mantiene equipo fijo en móvil, muestra V/D/N y explica zonas/cortes según formato. Cierre y bloqueos aparecen arriba y necesitan confirmación explícita. Evidencia en [pulido de competición](pulido-competicion.md).
