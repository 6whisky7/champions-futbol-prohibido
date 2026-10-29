# Auditoría y dirección del rediseño

## Estado inicial

Base examinada: `d4e857c2fd12e5bbd960de6250030d3b10b82fa9`, Next.js 16.4.3, rama `redesign/identidad-competicion`. Capturas reales en Edge mediante Playwright, 1440 y 390 px. El conector Vercel no mostraba este proyecto y rechazó su acceso con 403; la sesión CLI sí confirmó el proyecto existente en Whiskyideas y su producción Ready del commit `d4e857c2fd12e5bbd960de6250030d3b10b82fa9`, rama `main`: `champions-futbol-prohibido-q9xrgi5zc-whiskyideas.vercel.app`. Esa versión coincide con la base local capturada. Producción no se sustituye por este rediseño.

| Prioridad | Problema concreto                                                                  | Corrección aplicada                                                                 |
| --------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P1        | Etiquetas de 7–11 px; textos principales de 15–17 px.                              | Cuerpo de 18 px, auxiliares de 14–16 px y titulares equilibrados.                   |
| P1        | La portada ocupa más de una pantalla móvil antes de mostrar los escudos completos. | Cabecera compacta, título y explicación breves; escudos visibles desde el inicio.   |
| P2        | Estrella genérica, órbitas y seis tarjetas inclinadas sin función.                 | Identidad tipográfica CFP y escudos originales sobre una composición de banderines. |
| P2        | Tres tarjetas iguales explican el formato con frases de promoción.                 | Recorrido de liguilla a final y reglas cortas con información concreta.             |
| P2        | Once filtros en una fila móvil desplazable ocultan opciones.                       | Selector nativo, búsqueda por nombre o número y botón de limpiar.                   |
| P2        | El filtro y la expansión se pierden al recargar o volver atrás.                    | Estado en la URL y compatibilidad con historial.                                    |
| P2        | Frases como “Tu historia merece…” no ayudan a identificar lo consultable.          | “Escudos para tu equipo” y acciones con nombres directos.                           |
| P3        | CSS incluye familias de fuentes completas y estilos fuera de tokens.               | Dos archivos de fuente locales con preload y tokens semánticos.                     |

Las rutas PNG, botones, filtros, enlace de salto, movimiento reducido y compilación inicial funcionan. No se detectaron errores de consola. Supabase permanece aislado de la portada; no se consultan tablas ni se modifican sus clientes.

## Dirección

Impeccable dirige; Taste revisa la composición terminada. Lectura del encargo: competición de fútbol para una comunidad de Roblox, con prioridad al torneo y sus 48 identidades; claridad antes que ornamentación.

Se consideraron siete sistemas del fútbol: álbum de escudos, programa de partido, marcador televisivo, hoja de cruces, banderines de clubes, señalización de estadio y pizarra táctica. La asignación reproducible de Impeccable (`cd70daf9`, índice 5) corresponde a los banderines. El azul medianoche y los recursos reales fijados por el usuario prevalecen sobre otras paletas.

La idea: los 48 escudos de esta competición forman su identidad visual. No se inventan participantes, fechas, resultados ni trofeos. No se encontró un trofeo en el repositorio o en las carpetas de recursos revisadas.

La disciplina tomada de los contrastes del generador es estructural: conservar una jerarquía continua entre secciones, alinear la colección con una retícula y explicar el recorrido de competición. No se incorporan materiales, efectos ni metáforas ajenos al fútbol.

El usuario confirmó construir directamente la web. No se genera una maqueta ni se fija una referencia raster ficticia. El contrato de diseño está en `DESIGN.md`.

## Evidencia inicial

- [Escritorio](../output/playwright/before-1440-hero.png) · [página completa](../output/playwright/before-1440-full.png).
- [Móvil](../output/playwright/before-390-hero.png) · [página completa](../output/playwright/before-390-full.png).

## Navegación y movimiento

| Superficie | Acción                                          | Tratamiento                                                                                        |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Portada    | Anclas del torneo, formato, escudos y comunidad | Navegación nativa; foco y separación de cabecera.                                                  |
| Galería    | Buscar, filtrar y mostrar más                   | Identidad de elementos con React ViewTransition; transición breve sin dirección lateral inventada. |
| Escudo     | Abrir PNG original                              | Enlace real; no se introduce un diálogo innecesario.                                               |
| 404        | Volver al inicio o a escudos                    | Enlaces reales; sin animación de ruta decorativa.                                                  |

No hay rutas de detalle ni datos asíncronos que justifiquen transiciones compartidas o Suspense de carga. Se respeta movimiento reducido y el navegador sin View Transitions conserva las funciones.
