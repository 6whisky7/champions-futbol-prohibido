# Público, recordatorios y contenido compartible

## Recorrido

La página del evento publicado presenta el próximo partido con ambos equipos definidos y fecha válida. Se elige el primer encuentro pendiente/pospuesto/repetición/bloqueado por hora programada; si la hora ya pasó se pide esperar convocatoria, sin declarar automáticamente inicio o ausencia. Costa Rica se expresa en UTC−6; la zona del visitante se obtiene en su navegador, después de hidratar, para evitar diferencias entre ICU del servidor y navegador. La cuenta regresiva no inicia los cinco minutos de espera. Se evita actualizar el estado visual con la pestaña oculta.

El archivo `.ics` usa UTC, UID estable por evento/partido, CRLF, escape y plegado por bytes UTF-8. La fecha se vuelve a leer de la proyección pública en cada descarga. No hay suscripción, alertas garantizadas ni sincronización automática: si se reprograma hay que consultar y descargar otra vez. Sin fecha válida responde 404. Referencia: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545).

`/eventos/[id]/equipos/[team]` conserva identidad, plantilla Roblox, posición, zona, últimos cinco resultados y partidos. Si hay cuadro utiliza su snapshot oficial de plantilla. La racha sigue el orden de competición, incluye resoluciones oficiales administrativas identificadas y distingue V/D/N; no se presenta como récord deportivo.

La clasificación añade etiquetas y colores para directo, repesca, eliminado y zona pendiente. Son provisionales mientras la liguilla no esté cerrada. Un empate aún no ordenado nunca se anuncia clasificado definitivamente. El cuadro permite seguir equipo, muestra partidos disputados y destinos posibles si avanza, y conserva conexiones. En móvil se elige ronda o se explora horizontalmente dentro de su región; no desplaza la página completa ni modifica rivales.

## Compartir y memoria

Los partidos tienen enlace estable con resultado vigente, tarjeta PNG 1080×1920 descargable y vista previa 1200×630. Las ediciones tienen imagen OG propia con el trofeo. Todas las rutas exigen evento publicado explícitamente incluso para un propietario con sesión. No se generan tarjetas de resultados todavía pendientes. No se consultan URLs proporcionadas por usuarios: imágenes del catálogo validado y fuente local. Las 48 copias de 160px pesan 1 692 414 bytes en total y se usan solo para imágenes compartidas; no sustituyen los PNG originales ni añaden peso a la portada. `scripts/derive-social-assets.mjs` las reproduce con sharp fijado por el lock de Next; `check:assets` valida las 48 copias.

`/campeones` reúne campeones confirmados por edición y récords de mayor diferencia y mayor total de goles. Se recorren todas las ediciones publicadas paginadas, con concurrencia acotada; se muestran todos los empates de cada récord. Solo tipo `sport`: excluye ausencias, abandonos, pases, nulos y goles administrativos de sanción. Una corrección oficial recalcula lo visible; una tarjeta previamente descargada no se modifica.

`/como-se-juega` presenta resumen de un minuto, formatos, espera y ejemplos de desempate derivados de las decisiones confirmadas. No convierte propuestas de sanción, menores o conservación en reglas.

## Evidencia

`CFP_TEST_DIR=... node scripts/verify-public.mjs` usa solo 127.0.0.1:55439 y navegador Edge en entorno aislado. PASS: próxima fecha en Costa Rica/Tokio atravesando cambio de día; reprogramación con UID estable; UTC/CRLF/plegado UTF-8; PNG reales de ambas dimensiones; OG de evento/partido; siete superficies en 1440/390 sin desbordamiento, infracciones Axe ni errores React; ruta de equipo, cuadro horizontal, selector/teclado/movimiento reducido; exclusión de administrativos y empate pendiente; privacidad de borradores en página, plantilla, partido, PNG, ICS y OG; nombres máximos de evento/equipo e inyección de propiedades ICS. Auth y transporte PostgREST simulados, PostgreSQL real. No equivale a dispositivo físico ni Supabase Auth real.

Capturas y reportes: `C:/Users/XT/Projects/cfp-registration-tests/public-review/`, incluidos `story.png`, `og.png`, `event-og.png` y vistas 0–6 de escritorio/móvil. Las imágenes muestran fixtures locales, nunca equipos reales. Se corrigieron en la prueba un bloque de texto incompatible con Satori y una diferencia de fecha en hidratación; ambos recorridos pasan en la compilación final.

TypeScript, ESLint, 48 originales + 48 derivados y build: PASS. Los archivos de tracing de Next incluyen las 48 imágenes derivadas y fuente en la ruta de tarjetas, y el poster/fuente en OG; no dependen de archivos maestros ni acceso a URLs arbitrarias en despliegue.

La galería completa pasó `npm run check:ui`: diez filtros, búsqueda/URL/historial, 48 imágenes, cinco anchuras, teclado, móvil, movimiento reducido y zoom nativo de Edge al 200 %. Se actualizó su expectativa del enlace «Cómo se juega» a la nueva página, conservando la prueba de las preguntas de portada. No es un teléfono físico ni una revisión de lector de pantalla. Las principales [capturas y reporte](evidencia-publica/report.json) se conservan también en Git.

Al simular una caída se detectó que Next 16.4 utiliza `retry()` para volver a consultar el segmento en `error.tsx`. Se corrigieron las pantallas pública y administrativa según la documentación instalada, en lugar de conservar un botón de reintento sin función.

Fallo de lectura controlado en el transporte aislado: se mostró la pantalla de error, sin falsa ausencia de equipos; retirar el fallo y pulsar «Volver a intentar» recuperó los datos: PASS. Captura `evidencia-publica/error.png`.
