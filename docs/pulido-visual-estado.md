# Estado final de la guía visual aprobada

Guía original: `CFP_Mejoras_Aprobadas_Guia_Visual.docx`, 27 páginas, conservada intacta. Base de comparación `814e054`; primer bloque publicado en PR #15 (`e3b31d0`). El segundo bloque reutiliza ese trabajo. Los dibujos del Word son ejemplos; las capturas enlazadas salen de los builds y fixtures aislados reales. Las decisiones posteriores prevalecen: Turnstile descartado, ayudantes solo marcador de trabajo, sin excepción de requisitos ni autorizaciones ficticias.

| Página / mejora | Estado final | Evidencia o siguiente paso |
| --- | --- | --- |
| 3 Trofeo | Completada y conservada | V03, poster, luz y modelo sin cambios; 1 631 132 bytes, cinco materiales. `check:assets` y diff sin cambios en public. |
| 4 Portada y navegación | Completada | PR #15; selección activa, participación según disponibilidad; pruebas públicas en cuatro/cinco anchos. |
| 5 Ahora | Completada | PR #15; calendario real, zona CR/visitante e ICS, inscripción y convocatoria manual. No infiere LIVE desde el reloj. |
| 6 Filas de partido | Completada | Filas simétricas, escudos 40 px, marcador/VS, chips de estado/fecha, Sin fecha ámbar. [Comparación](evidencia-pulido-competicion/calendar-detail-after-390.png). |
| 7 Jornadas y horarios | Completada | Pestañas, progreso y URL; revisión antes de guardar; concurrencia, fallo parcial y reintento idéntico sin nuevas revisiones. [Prueba](evidencia-pulido-competicion/competition-report.json). |
| 8 Clasificación | Completada | Puntos, DG con signo, cortes por formato y equipo fijo en móvil; cuatro formatos. [Tabla](evidencia-pulido-competicion/table-detail-after-1440.png). |
| 9 Racha y desempates | Completada | V/D/N por jornada/orden, insignia del criterio persistido, sin empates deportivos ni criterio inventado. |
| 10 Cierre de liguilla | Completada | Panel superior, resueltos/desempates, bloqueos y confirmación; cierre real en ensayo de 31 partidos. |
| 11 Equipo y escudo | Completada | Página existente conservada; diálogo de escudo y disponibilidad publicados en PR #15. Público sin TikTok/notas; GET no reserva. |
| 12 Cuadro | Completada | Conectores iguales a las fuentes guardadas en los cuatro formatos, foco/hover de destino y exploración móvil. [Cuadro](evidencia-pulido-competicion/bracket-detail-after-1440.png). |
| 13 Campeón | Completada | Trofeo integrado, escudo/nombre, final, plantilla inicial/capitán/rol, avances reales y resolución administrativa sin goles inventados. |
| 14 Compartir y reglas | Completada | Generador existente reutilizado para PNG de campeón 1080 × 1920; OG, récords e ICS conservados. [Tarjeta](evidencia-pulido-competicion/champion-vertical.png). |
| 15 Identidad | Completada | DESIGN actualizado, medianoche/marino/azul claro, dorado de logros, excepciones de luz; sin estrellas genéricas añadidas. |
| 16 Menú y contexto | Completada | Grupos y contadores conservados; publicación/inscripción separadas y acción contextual. Crear solo en Eventos. |
| 17 Fases y siguiente paso | Completada | Ocho fases derivadas de estado real, revisión y reapertura; no se inventa una cronología histórica. |
| 18 Ocupación y revisión | Completada | Barra pendientes + aprobados, vencimiento orientativo, alineación sin posiciones, suplente separado; jugadores completos y comprobaciones separados. |
| 19 LIVE | Completada y conservada | Regresión de propietario/ayudante, convocatoria, marcador de trabajo, oficial y revocación. [Prueba LIVE](evidencia-pulido-competicion/live.json). |
| 20 Guardar y confirmar | Completada | Guardando/Guardado/Error, campos conservados y confirmaciones que explican calendario, tabla y campeón; no reutilizan éxitos anteriores. |
| 21 OBS | Completada la integración existente | Tres vistas públicas y revelación comprobadas; se reutilizan `/obs` y LIVE. El fondo transparente y la franja de siguientes eran opciones del dibujo, no se añade otro sistema ni se modifica OBS en este bloque. |
| 22 Exportar e historia | Completada y conservada | PNG/PDF/CSV públicos, múltiples páginas, escape de fórmulas, clips con visibilidad expresa y récords deportivos. |
| 23 Espera | Completada y conservada | Ensayo de reserva, corrección y promoción manual, conflicto de integrante y cupo; cierre mantiene vencimiento. |
| 24 Protección | Completada según decisión vigente | RLS/permisos, firma, límites persistentes y reservas existentes conservados. Turnstile retirado por el propietario. |
| 25 Ayudante | Completada y conservada | Solo marcadores de trabajo por evento; no oficial ni solicitudes privadas. No se creó un ayudante real. |
| 26 Privacidad | Pendiente de validación y activación | Decisiones ya documentadas; falta procedimiento verificable, aviso definitivo e identificación, revisión de conservación y requisitos de menores. [Siguiente paso](pendientes-externos.md). |
| 27 Ensayo con Auth/PostgREST reales y decisiones abiertas | Pendiente externo | Docker funciona; iniciar la pila aislada fue rechazado por revisión automática con `blocked by policy`. No se presenta Auth simulado como real. Reglas abiertas conservadas. [Detalle y alternativa](pendientes-externos.md). |

Las páginas 1–2 presentan el documento. [Informe de entrega, comparaciones y límites](pulido-competicion.md). La demostración local recuperable incluye los ejemplos nuevos y mantiene la práctica anterior; la política real y las inscripciones permanecen cerradas.
