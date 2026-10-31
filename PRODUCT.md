# Champions Fútbol Prohibido

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Participantes y seguidores de la comunidad de Fútbol Prohibido en Roblox. Consultan desde celular y computadora. El organizador tiene dificultad para leer textos largos y pide lectura fácil para toda la interfaz.

## Product Purpose

Explicar el torneo, explorar sus 48 escudos originales y permitir al propietario gestionar eventos y revisar equipos desde un panel claro. La portada destaca el torneo y sus recursos; la administración prioriza contexto, tareas y lectura fácil.

## Capabilities and Constraints

- Next.js App Router, TypeScript, Tailwind y versiones estables existentes.
- Portada orientada a participación según disponibilidad pública (inscripción, elección de evento, espera o comunidad), con trofeo V03 automático, galería con filtros, comunidad, 404, eventos públicos y administración exclusiva del propietario. Incluye inscripción pública sin cuentas, revisión manual y lista de espera con promoción administrativa. Añade próximo partido con zona del visitante/ICS, páginas públicas de equipo y partido, zonas de clasificación, cuadro por equipo, tarjetas de resultados y campeones/récords deportivos.
- La administración comparte navegación, selector de evento y cabecera: Resumen, Eventos, Solicitudes, Equipos, Lista de espera, Calendario, Resultados, Clasificación, Eliminatorias y LIVE. El resumen utiliza datos reales, próximos vencimientos en seis horas y cinco acciones recientes; sin eventos conserva su marco y ofrece crear el primer borrador.
- La competición incorpora revisión/confirmación del sorteo, jornadas públicas, resultados oficiales, desempates persistentes, descalificación y cierre de clasificación. Las eliminatorias parten de la clasificación final cerrada, se revisan y confirman explícitamente y conservan sus destinos; el propietario confirma el campeón y el cierre por evento. No inicia competiciones automáticamente.
- Las reglas confirmadas están en `docs/decisiones-del-torneo.md`; prevalecen las correcciones recientes.
- Supabase exclusivo: `cvenqmszdmhqaeokzbnz`. El esquema, RLS y Auth existentes se conservan; liguilla y eliminatorias tienen migraciones versionadas, protección de transiciones e historial. Las pruebas usan datos aislados o transacciones revertidas.
- Se autoriza publicar esta etapa verificada en main/Production. Los eventos permanecen cerrados por defecto; el propietario decide su apertura desde el panel. La entrega conserva cerradas las inscripciones reales.

## Brand Commitments

Nombre Champions Fútbol Prohibido; español directo. Competición de fútbol con identidad propia, azul medianoche cercano a #020612, superficies marinas y acentos fríos moderados. Escudos protagonistas; evitar estrellas genéricas, efectos excesivos y composición repetitiva.

## Evidence on Hand

Actualización aprobada: trofeo V03 completo, usado en portada mediante una copia comprimida y una imagen de su maestro. El organizador autoriza publicar el rediseño y esta integración en main cuando las comprobaciones sean correctas. Los recursos maestros se conservan fuera de public. La revisión integral conserva el diseño y corrige errores de integración; su evidencia y límites están en `docs/revision-integral.md`.

48 PNG transparentes y `public/escudos/catalogo.json`. Trofeo V03 aprobado, copia Draco de 1 631 132 bytes e imagen inicial. Los maestros se conservan fuera de public. No hay resultados ni equipos inscritos que puedan presentarse como datos reales.

## Product Principles

- Mostrar claramente lo que el visitante puede consultar hoy.
- Explicar reglas con bloques breves, listas y diagramas.
- Mantener los recursos originales y las decisiones confirmadas.
- Priorizar legibilidad, teclado y controles cómodos en celular.

## Accessibility & Inclusion

Texto principal de aproximadamente 18 px o mayor; información auxiliar legible; párrafos breves. Contraste cómodo, zoom al 200 %, teclado, objetivos táctiles amplios y movimiento reducido.

La recepción pública tiene límites persistentes y firma de servidor. Turnstile fue retirado por el organizador. La apertura está bloqueada por política inactiva hasta completar identidad/aviso, validar e implementar representación y confirmación individual y revisar los plazos provisionales de conservación; se conservan cerrados los eventos reales.

LIVE separa marcador provisional y resultado oficial. Solo el propietario convoca e inicia espera, registra ausencia o confirma resultado. Ayudantes verificados y asignados por evento solo editan marcadores de trabajo. OBS, revelación del sorteo guardado y exportaciones PNG/PDF/CSV utilizan datos públicos de eventos publicados. Clips privados salvo publicación explícita. No hay cuenta pública de administrador ni ayudantes de prueba en producción.

Las decisiones del 31 de octubre admiten menores con autorización verificable y sin mínimo propio, respetando las plataformas. El procedimiento no está activado; la confirmación individual se revisa. Conservación 30/90 días provisional y sin purgas. La demostración personal es local, ficticia y recuperable; no publica datos ni inaugura eventos reales.

La guía visual aprobada se aplica como refinamiento: navegación pública activa, franja Ahora con calendario real y convocatoria explícita, detalle accesible de escudos y disponibilidad por evento. Consultar no reserva; la firma y la validación atómica al enviar se conservan. Las mejoras de calendario, tabla, cuadro y panel reutilizan sus operaciones, sin cambiar puntos o rivales.

El segundo bloque visual incluye calendario por jornadas y horarios revisados, clasificación V/D/N, conectores del cuadro, campeón y tarjeta vertical, barra de fases, ocupación y alineación administrativa. No modifica reglas deportivas ni esquema. Las pruebas y comparaciones están en docs/pulido-competicion.md; los pendientes externos en docs/pendientes-externos.md.
