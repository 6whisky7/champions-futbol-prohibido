# Eliminatorias y cierre por campeón

Esta etapa parte de la clasificación final conservada por la [liguilla](liguilla.md). Solo utiliza Supabase `cvenqmszdmhqaeokzbnz`. No genera cuadros, avances ni campeones reales para demostrar funciones.

## Preparación y cuadro fijo

El propietario usa `/admin/eliminatorias`; Calendario y Resultados también integran los encuentros de esta fase. Los visitantes consultan `/eventos/[id]/eliminatorias` y el campeón confirmado en la página del evento publicado.

La generación exige liguilla cerrada, clasificación final conservada, desempates resueltos y suficientes habilitados: 8 para cuartos, 16 para octavos, 32 para dieciseisavos clásicos y 24 para repesca. Si faltan, bloquea la operación. No incorpora espera, sustitutos ni pases libres para llenar plazas.

Primero se guarda una revisión privada del cuadro con su clasificación de origen y plantillas públicas. Confirmar es una acción distinta. Las operaciones bloquean la fila del evento; reintentos y confirmaciones simultáneas devuelven el cuadro existente, sin duplicarlo. Tras confirmar no hay nuevo sorteo ni reordenamiento.

- Cuartos: izquierda 1–8 y 3–6; derecha 2–7 y 4–5.
- Octavos: izquierda 1–16, 8–9, 3–14 y 6–11; derecha 2–15, 7–10, 4–13 y 5–12.
- Dieciseisavos: amplía el mismo recorrido con complementos de 33, conservando los cuartos acordados si avanzan los mejores.
- Repesca: 9–24 → 8; 10–23 → 7; 11–22 → 6; 12–21 → 5; 13–20 → 4; 14–19 → 3; 15–18 → 2; 16–17 → 1. Los ocho primeros entran directamente a octavos.

Los ganadores contiguos avanzan mediante referencias fijas a encuentros. Las sorpresas conservan el destino original. Un participante todavía desconocido aparece como «Ganador del partido N». Se permite repetir rival de liguilla.

## Resultados, intentos y dependencias

Solo el propietario registra, corrige o programa. Cada mutación exige una revisión no nula y vigente del cuadro; otra pestaña obliga a recargar en vez de sobrescribir. El historial privado conserva actor, fecha, motivo y valores anteriores/nuevos. Las fechas se expresan en hora de Costa Rica.

Los resultados deportivos exigen ganador, enteros no negativos y diferencia máxima de cuatro; no hay máximo de cuatro goles totales. Ausencia individual asigna 3–0 y abandono total 4–0. Caída general retira el intento interrumpido y requiere repetición desde cero. Estos partidos no alteran puntos ni estadísticas de la clasificación cerrada de liguilla.

La primera doble ausencia marca el encuentro como pospuesto y pasa al intento 2. La segunda da pase al mejor clasificado de liguilla que siga habilitado, también en la final. Ese pase no inventa marcador ni goles. Una caída general no consume esta reprogramación y retirar explícitamente un resultado no reinicia el contador de intentos.

Cambiar un ganador no puede modificar silenciosamente un encuentro dependiente ya disputado o con intento registrado. La operación se bloquea con la dependencia concreta. El administrador debe revisar y retirar explícitamente el resultado dependiente antes de corregir el origen; la auditoría conserva ambas decisiones.

`ineligible` registra únicamente una inhabilitación administrativa ya confirmada por el propietario, con motivo. No crea sanciones automáticas para infracciones posteriores todavía sin regla. Cambia la habilitación del cuadro, no la clasificación cerrada. Si ambos participantes quedan sin habilitación, el cruce queda sin ganador y el siguiente rival habilitado puede avanzar sin jugar. Si no existe resolución válida, especialmente sin campeón habilitado, el cierre queda bloqueado como pendiente de decisión administrativa.

## Campeón e historial por edición

Con la final resuelta, el propietario revisa el campeón propuesto y confirma el cierre. Se conserva un snapshot por evento con campeón, plantilla oficial Roblox, subcampeón cuando exista, resolución de la final, nombre del evento y fecha. Un pase por cuadro sin rival habilitado puede no tener subcampeón: la interfaz lo explica y no inventa uno.

El evento pasa a terminado en el estado de eliminatorias. Esa edición queda inmutable en esta etapa; otras ediciones conservan sus propios campeones. La página pública reutiliza `public/trofeo/cfp-v03-poster.webp`, sin generar otra copia del GLB por campeón. No se añaden premios ni reconocimientos nuevos.

Los casos aún abiertos —infracciones descubiertas tras liguilla o final y otros supuestos sin resolución— permanecen en [las decisiones del torneo](decisiones-del-torneo.md). No se modifica retrospectivamente la tabla cerrada para resolverlos.

## Esquema, permisos y privacidad

La migración aditiva `20261030154628_knockouts_champion.sql` añade `cfp_private.knockouts`, `knockout_matches` y `knockout_history`. Sus tablas tienen RLS y no conceden acceso directo a `anon` ni `authenticated`. Las RPC de escritura verifican al propietario, además de `requireOwner()` en cada acción del servidor. No requieren claves privilegiadas en la aplicación.

`cfp_knockout_read()` solo publica cuadros confirmados de eventos publicados. Normaliza `admin=NULL` como consulta pública. La plantilla pública incluye Roblox, rol y capitán; no TikTok. Los motivos, el actor y las instantáneas de auditoría solo salen en la lectura administrativa autorizada.

Advisors señala las RPC `SECURITY DEFINER` ejecutables y RLS sin políticas de las tablas privadas: son entradas controladas y denegación directa deliberada. Se conserva el aviso previo de protección de contraseñas filtradas desactivada; el acceso del propietario usa enlace de correo. Referencias: [funciones y permisos](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones públicas controladas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) y [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Evidencia y límites

- Los cuatro formatos hasta campeón, con favoritos y sorpresas; destinos y las ocho conexiones de repesca.
- Correcciones bloqueadas por dependencias, retirada explícita, doble ausencia, repetición que conserva intento, campeón administrativo por clasificación sin goles, ambos inhabilitados, pase al siguiente rival y bloqueo sin campeón válido.
- Revisiones/confirmaciones simultáneas y resultados concurrentes sin duplicar avances.
- Doce equipos: 24 partidos de liguilla y 7 eliminatorios, 31 en total, campeón conservado y tabla de liguilla sin cambios.
- SQL remoto del recorrido completo en una transacción revertida; después se confirmaron cero cuadros, eventos y solicitudes de ensayo persistidos.
- Navegador en 1440/390 px: cuadro y campeón, privacidad pública, selector de ronda y foco al detalle, sin desbordamientos ni infracciones Axe detectadas. El Auth visual es simulado en el entorno local; no equivale a suplantar ni verificar de nuevo la sesión real del propietario en producción.

Las pruebas locales se versionan en `scripts/knockout-fixture.mjs`, `verify-knockout.mjs`, `verify-knockout-rules.mjs`, `verify-knockout-twelve.mjs` y `verify-knockout-concurrency.mjs`. Se ejecutaron con `CFP_TEST_DIR` apuntando al entorno aislado externo. El helper carga allí `pg` y `connection.json`, rechaza conexiones fuera de `127.0.0.1:55439` y necesita los fixtures locales provisionados. La suite restablece únicamente las tablas KO de ese entorno aislado; nunca debe apuntar a un proyecto remoto.

Los scripts y capturas del entorno aislado de esta máquina están en `C:/Users/XT/Projects/cfp-registration-tests/`, bajo `ko-*` y `ko-review`. El fixture remoto versionado es `supabase/tests/knockout.sql`. El zoom nativo de Edge al 200 % pasó en perfil aislado: DPR 2, ancho y scrollWidth 708 px, CSS zoom 1; selector y detalle operativos. Tras integrar el PR se comprueban el commit, Production Ready y las rutas reales sin sesión. Las capturas de Auth simulado no sustituyen esa comprobación.

El navegador también ejecutó preparación, confirmación, resultado 5–2 y programación de fecha en un fixture local nuevo; al abrir otro partido su fecha no arrastra el valor del anterior. TypeScript, ESLint, assets (48 escudos y trofeo sin cambios) y compilación pasaron.

## Presentación revisada

Los conectores se calculan desde los destinos persistidos; no alteran cruces ni ordenan por favoritos. El chip de destino resalta y enfoca el partido real. Se conserva consulta por ronda y exploración horizontal móvil. Revisión del cierre al final del cuadro, con progreso y confirmación de sus efectos.

La presentación del campeón reutiliza V03 e incorpora ambos escudos de la final, plantilla pública, avances registrados y descarga `/eventos/[id]/campeon/imagen` de 1080 × 1920 mediante el generador existente. Exige edición publicada y campeón terminado. Un pase por clasificación muestra «Sin marcador» y resolución administrativa; no se añaden goles deportivos. TikTok, notas y auditoría privada no forman parte del generador.
