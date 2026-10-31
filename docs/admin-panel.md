# Panel administrativo CFP

La administración autenticada comparte marco en `src/app/admin/(panel)/layout.tsx`. El acceso por correo permanece en `/admin/acceso`, fuera del marco. Cada página y operación conserva la comprobación del propietario; no se cambiaron migraciones, reservas, vencimientos ni privacidad.

## Recorrido

- Resumen: evento seleccionado, ocupación, disponibilidad, pendientes, aprobados y espera. Pendientes y aprobados ocupan plaza; espera no reserva.
- Atención: pendientes y vencimientos en las próximas seis horas, con enlaces directos al detalle. Actividad: cinco decisiones más recientes del evento.
- Eventos: listado y estados separados; creación y edición conservan las operaciones existentes.
- Solicitudes, Equipos y Lista de espera: reutilizan el gestor con `vista=pending`, `approved` o `waiting`. La selección del evento viaja en `evento`; `solicitud=id#application-detail` abre su revisión.
- Detalle: Equipo, Jugadores, Requisitos e Historial. La aprobación explica sus requisitos; rechazo se distingue como acción de liberación. Las acciones bloqueadas siguen bloqueadas.

En escritorio hay navegación lateral; en móvil se despliega mediante Menú y se cierra con Escape. La cabecera conserva evento activo, sección y acción principal. Las listas se apilan sin desplazar horizontalmente acciones. El sistema conserva Manrope, Barlow Condensed, azul medianoche y superficies marinas. Estados dorado/verde se acompañan siempre de texto.

## Evidencia y límites

Se probaron siete vistas en 1440 y 390 px, además del detalle: sin desbordamiento, errores React ni infracciones Axe detectadas. El entorno aislado probó sin eventos, sin solicitudes, pendientes/aprobados/espera y cupo completo; búsqueda, selector, enlaces directos, creación/edición de borrador, teclado y reflujo equivalente a 200 %. También pasó zoom nativo de Edge al 200 % en un perfil aislado: DPR 2, ancho CSS 708 px, scrollWidth 708 px y CSS zoom 1; menú, filtro y revisión operativos. La autenticación visual es simulada localmente; no demuestra acceso real del propietario. El acceso real ya confirmado en la etapa anterior no se suplantó.

Capturas, antes/después y scripts locales: `C:/Users/XT/Projects/cfp-registration-tests/admin-design/`. El archivo `index.html` reúne resumen, eventos, creación, edición, solicitudes, detalle, equipos, espera y estados vacíos. Los nombres y usuarios mostrados son fixtures locales.

La revisión independiente de Impeccable y la segunda revisión de Taste comprobaron el conjunto de pantallas. El veredicto final `ship` cierra tres correcciones concretas: aprobación deshabilitada legible, color junto al texto de estado y enlace directo al detalle. No certifica por sí solo producción ni Auth real.

Antes de publicar se ejecutan TypeScript, ESLint, assets y build. Después del PR se comprueban el commit de main, Production Ready, el dominio público y las redirecciones sin sesión. No se abren eventos ni se crean participantes reales para esta revisión.

## Orientación y comprobaciones individuales

[Siguiente paso, menú agrupado, contadores y revisión por integrante](mejoras-bloque-4a.md) amplían este panel. Las aprobaciones antiguas no cambian y no se habilita una excepción a requisitos. El alcance de LIVE/ayudantes se documenta en su entrega posterior.
