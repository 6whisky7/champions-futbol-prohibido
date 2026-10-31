---
name: Champions Fútbol Prohibido
description: Trofeo V03, escudos propios y lectura fácil sobre azul medianoche.
colors:
  background: "#020612"
  surface: "#091326"
  secondary: "#101e34"
  foreground: "#f3f6fc"
  muted-foreground: "#b5c3d9"
  primary: "#a7ceff"
  primary-foreground: "#06132a"
  primary-hover: "#c5dfff"
  border: "#607899"
  ring: "#a7ceff"
  destructive: "#ffb3b3"
  status-pending: "#f2ce83"
  status-approved: "#9cd9c0"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(64px, 8vw, 96px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(40px, 4.3vw, 60px)"
    fontWeight: 700
    lineHeight: 1.05
  title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.05
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.65
  auxiliary:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  button:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.65
rounded:
  status: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  gap-sm: "8px"
  gap-md: "12px"
  gap-lg: "16px"
  inset-mobile: "20px"
  inset-lg: "24px"
  space-28: "28px"
  space-32: "32px"
  section-mobile: "48px"
  section-lg: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  action-link:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "14px 24px"
  action-link-hover:
    backgroundColor: "{colors.primary-hover}"
  input-search:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
    height: "52px"
  native-select:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 42px 10px 14px"
    height: "52px"
  crest-card:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "20px"
  rule-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "18px 22px"
  navigation:
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
  rule-disclosure:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
  brand-pennant:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    height: "54px"
    width: "46px"
---

# Design System: Champions Fútbol Prohibido

## Portada actual: trofeo V03 aprobado

Trofeo V03 completo junto al título, una columna en móvil. La imagen aparece primero y el visor carga automáticamente cuando la presentación entra en pantalla. Arrastre directo, teclado, reset frontal discreto y alternativa de imagen ante fallo. Luces doradas superiores y diagonales, halo tenue y contraluz frío sobre azul medianoche, con sombra bajo la base. Iluminación HDR propia conservada al girar, reconstruida desde los softboxes del maestro. El visor usa AgX y exposición 1; la imagen se conserva hasta cargar modelo y entorno. Efectos estáticos; visor oculto al salir de pantalla. Sin giro automático.

La inscripción conserva bloques con leyendas y resumen antes del envío. La administración tiene un marco común con navegación lateral, contexto del evento y cabecera. Resumen, Eventos, Solicitudes, Equipos y Lista de espera comparten el mismo lenguaje visual; el acceso permanece fuera del marco autenticado. El detalle agrupa Equipo, Jugadores, Requisitos e Historial. Los colores de estado se aplican a los datos y acompañan siempre un texto.

La administración y los eventos reutilizan Manrope, Barlow Condensed, superficies marinas y controles amplios con etiquetas visibles. Formularios de una columna, estados breves y fechas expresadas en hora de Costa Rica. «Publicado» e «Inscripciones cerradas» son estados separados. Un borrador nunca se anuncia como evento público.

## Overview

**Creative North Star: "Banderines de competición"**

El trofeo V03, los escudos propios y el nombre completo construyen la identidad. La geometría de banderín permanece en la marca; el trofeo protagoniza la portada. El azul medianoche, las superficies marinas y un acento frío moderado dejan que cada recurso conserve sus colores y su silueta.

La tipografía condensada da presencia al torneo; Manrope mantiene claros textos, controles y reglas. La densidad se regula con márgenes amplios, párrafos breves y una retícula estable. Este sistema se extrae del código terminado. El usuario eligió construir directamente en código; no existe una composición raster aprobada.

**Key Characteristics:**

- Escudos originales completos, con proporciones conservadas.
- Fondo azul medianoche y profundidad por capas de color.
- Títulos condensados y lectura principal amplia.
- Controles nativos, foco visible y movimiento breve asociado al estado.

### Contrato de dirección conservado de esta entrega

Este registro actualiza la dirección original con el trofeo V03 aprobado. La secuencia y el primer viewport describen esta superficie, sin imponerlos a futuras pantallas.

- **THESIS:** el visitante entiende que es un torneo de Fútbol Prohibido en Roblox y puede explorar sus escudos desde la primera pantalla.
- **OWN-WORLD:** los 48 PNG propios, el nombre CFP, las plantillas de tres jugadores y la comunidad @whiskyzc dan contenido a una identidad de competición propia.
- **STORY:** presentación del torneo, colección explorable, recorrido de liguilla a final, reglas breves y comunidad; cada sección responde una pregunta concreta.
- **FIRST VIEWPORT:** título de dos voces, explicación breve, acción hacia escudos y trofeo V03 interactivo; en móvil se compacta sin perder nombre, lectura ni recursos.
- **FORM:** banderines de clubes, asignación de Impeccable `cd70daf9`, índice 5 de siete sistemas del fútbol. Geometría de banderín en la marca; trofeo V03 en portada; retícula en colección; conectores de avance en el recorrido; búsqueda y selector con URL persistente. El azul medianoche y la lectura fácil fijados por el usuario prevalecen sobre paletas o efectos ajenos.

## Colors

En administración, pendiente usa `status-pending` dorado y aprobado `status-approved` verde claro; rechazado y vencido reutilizan `destructive`. Espera conserva el color auxiliar. Todos llevan un nombre de estado, de modo que el color no sea la única señal. Son extensiones de datos sobre las superficies marinas existentes.

Una familia azul oscura sostiene el contenido; el acento claro señala acciones y foco. Los valores normativos del frontmatter proceden de `src/app/globals.css`.

### Primary

- **Azul de competición** (`primary`): acciones principales, marca CFP, segunda voz del título y señales de avance.
- **Tinta del acento** (`primary-foreground`): texto e iconos sobre acciones claras.
- **Azul de respuesta** (`primary-hover`): hover de los enlaces principales con apariencia de botón.

### Neutral

- **Azul medianoche** (`background`): fondo de página, cabecera y campos.
- **Marino de superficie** (`surface`): galería, reglas, preguntas y escenario del trofeo.
- **Marino elevado** (`secondary`): soporte de escudos, botón secundario y comunidad. El nombre técnico no implica un segundo acento.
- **Blanco frío** (`foreground`): lectura principal.
- **Azul de lectura auxiliar** (`muted-foreground`): metadatos, notas y descripciones secundarias.
- **Azul de borde** (`border`): contorno de campos y barra de desplazamiento.
- **Azul de foco** (`ring`): contorno visible del teclado; comparte valor con `primary`. Sustituye el valor provisional anterior.

`destructive` existe para estados `aria-invalid`, errores de formulario y la variante destructiva de la librería; la portada no presenta acciones destructivas.

**The Dark Continuity Rule.** La interfaz conserva el fondo oscuro entre secciones; la jerarquía se establece con superficie, espacio y texto, sin alternar a un tema claro.

## Typography

**Display Font:** Barlow Condensed 700 local, con `sans-serif` como respaldo.

**Body Font:** Manrope variable local, rango disponible 200–800, con `sans-serif` como respaldo. No hay una familia monoespaciada aparte.

**Character:** títulos compactos de competición y lectura abierta en español directo. La jerarquía combina tamaños fijos y fluidos; no existe una proporción modular única.

### Hierarchy

- **Display:** primera voz según el token `display`; la segunda usa `clamp(42px, 5.3vw, 64px)` en escritorio. Ambas son mayúsculas. En móvil pasan a `clamp(60px, 16vw, 88px)` y `clamp(36px, 9.5vw, 48px)`. En la franja intermedia la segunda voz usa 48 px.
- **Headline:** títulos según `headline`; en móvil quedan en 40 px.
- **Title:** etapas a 32 px; título del bloque de reglas entre 32 y 44 px, y 36 px en móvil.
- **Body:** 18 px con interlínea 1.65. La explicación de portada alcanza 21 px en escritorio y vuelve a 18 px bajo 1024 px. Las introducciones limitan la lectura a 65ch.
- **Label:** campos y navegación, 16 px y peso 600. La navegación baja a 14 px en la franja intermedia y vuelve a 16 px en el menú móvil.
- **Auxiliary:** 14–16 px en diseño, liga, notas y pie. La referencia del club conserva 18 px y peso 700. El contador usa cifras tabulares.
- **Button:** 16 px y peso 700 en primitivas; los enlaces principales usan 18 px, peso 700 e interlínea 1.4.

**The Reading First Rule.** Mantener cuerpo amplio, auxiliares legibles y bloques breves; los títulos condensados no sustituyen la fuente de lectura de controles o párrafos.

## Layout

La administración usa una columna lateral de 248 px y contenido flexible con margen de 40 px, reducido a 24 px hasta 1100 px. Bajo 760 px la navegación se convierte en menú desplegable; Escape cierra y devuelve el foco. El selector conserva `evento` en la URL. El resumen muestra cinco contadores en escritorio, tres hasta 1100 px y dos en móvil; tareas y actividad forman dos zonas, apiladas hasta 1100 px. Listas y acciones se adaptan sin tablas de desplazamiento horizontal. Los títulos del marco miden 44 px y 36 px en móvil; lectura principal de 18 px.

El contenedor compartido tiene máximo de 1280 px y ancho `calc(100% - 96px)`. Bajo 1024 px deja 32 px por lado; bajo 768 px deja 20 px. La cabecera adherida arriba mide al menos 92 px en escritorio y 80 px en móvil. Las anclas reservan 108 px; `scroll-padding-top` pasa a 100 px en móvil mientras las secciones conservan `scroll-margin-top: 108px`.

La colección usa cuatro columnas con separación de 36 px entre filas y 24 px entre columnas; bajo 1024 px usa tres; bajo 768 px usa dos con separación de 28 × 16 px. Los controles pasan de tres posiciones horizontales a dos columnas, y luego a una. Limpiar filtros solo aparece cuando hay una selección.

Portada y reglas usan dos columnas `0.85fr 1.15fr`, separadas 64 px, después 32 px en la franja intermedia; se apilan en móvil. El recorrido pasa de tres columnas a una, con flechas descendentes y sin barras verticales en móvil. La galería tiene relleno vertical de 60 px, el torneo de 80 px y comunidad de 64 px; todos pasan a 48 px en móvil. Las listas de reglas y preguntas se separan 12 px.

## Elevation & Depth

La profundidad proviene de capas de color, sin sombras ambientales, resplandores ni desenfoque. Los PNG conservan transparencia y silueta completa. Las sombras de las primitivas son anillos funcionales de estado.

El foco global usa contorno sólido de 3 px y separación de 5 px. Botones, campos y selector añaden un anillo de 3 px al 50 % del color de foco; `aria-invalid` dispone de un anillo destructivo al 20 %. No son elevación de tarjetas.

**The Tonal Depth Rule.** Diferenciar superficies con los colores establecidos; reservar los anillos para estados de interacción.

## Shapes

Controles, reglas y preguntas usan esquinas suaves (`lg`, 8 px); soportes y enlaces de escudos usan `xl` (12 px). Los campos tienen borde de 1 px. La colección no añade bordes a sus soportes.

El banderín CFP usa `polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)`; mide 46 × 54 px en escritorio y 36 × 44 px en móvil. El trofeo completo utiliza contain y un escenario propio; no se recorta su silueta. Las flechas del recorrido son trazos CSS; los iconos de acciones son SVG.

## Components

### Participación desde portada

La acción principal sigue la disponibilidad pública del evento; los escudos son secundarios. Sin inscripciones abiertas se explica el estado y se ofrecen TikTok y La Chapizza. Los datos se consultan sin bloquear la portada estática; error y carga tienen texto y acceso al listado de eventos. Espera se explica sin prometer reservas ni promoción automática.

### Eliminatorias y campeón

El cuadro amplía el marco CFP sin nuevos tokens. En escritorio presenta columnas por ronda, tarjetas alineadas verticalmente y enlaces escritos al partido de destino; el recorrido puede desplazarse dentro de su región. En móvil muestra una ronda mediante selector nativo, con detalle accesible por botón y foco. Escudo, nombre, marcador, ganador, intento y estado conservan texto legible; los pases administrativos sin goles se distinguen de resultados deportivos. Las decisiones e historial privados utilizan los formularios y superficies existentes.

La presentación del campeón usa la imagen inicial compartida del trofeo V03, sin copiar modelos por evento. Trofeo y datos forman dos columnas en escritorio y una en móvil; muestra edición, escudo, campeón, resolución de la final, subcampeón cuando exista y plantilla Roblox. No añade premios ni efectos ajenos a la identidad.

### Liguilla y clasificación

Calendario, Resultados y Clasificación reutilizan el marco CFP y sus superficies marinas, sin nuevos tokens. Cada jornada muestra escudo, equipo, marcador, orden, estado y fecha de Costa Rica. Las filas se apilan en móvil y las acciones permanecen fuera de cualquier desplazamiento horizontal. La tabla de estadísticas conserva alineación numérica y puede desplazarse dentro de una región con nombre y acceso por teclado; no desplaza la página completa. Las abreviaturas se explican bajo la tabla. Los empates sin resolver muestran «=» y «Zona por resolver»; las zonas siguen siendo provisionales hasta el cierre.

### Marco administrativo

`AdminShell` comparte identidad CFP, cinco destinos con iconos Lucide, sección actual mediante `aria-current`, selector del evento, acceso a la web y cierre de sesión. Reutiliza Button de shadcn/Base UI para el menú y cierre. Las superficies separan configuración, tareas y actividad; no hay gráficas ornamentales. Los estados vacíos conservan el marco y ofrecen una siguiente acción concreta. Aprobar es la acción primaria; rechazar usa el color destructivo; las acciones deshabilitadas reducen opacidad y explican los requisitos que faltan. Los enlaces a solicitudes desde el resumen llevan al detalle seleccionado.

### Buttons

Controles directos, con altura mínima de 48 px, relleno de 12 × 20 px y radio de 8 px. La interlínea heredada hace que la altura real pueda superar el mínimo; la evidencia medida ronda 52.4 px.

- **Primary:** acento claro y tinta oscura; hover al 80 % de opacidad del fondo.
- **Secondary:** fondo `secondary` y texto principal; hover con mezcla de `foreground` al 5 % en OKLCH. Amplía la colección.
- **Ghost:** transparente; hover y `aria-expanded` usan la superficie secundaria. Aparece en limpiar filtros y menú, que reduce el relleno horizontal a 12 px en móvil.
- **Estados:** foco compartido y pulsación con desplazamiento de 1 px. `disabled` reduce opacidad a 0.5 y bloquea interacción. La primitiva admite `aria-invalid`; no se usa para validar la búsqueda.
- **Enlace principal:** altura mínima de 54 px, relleno de 14 × 24 px, icono de 22 px y separación de 24 px. Hover en `primary-hover`, pulsación de 1 px y transición de 150 ms `ease-out`.

Outline, destructive y link existen en la librería, pero no son variantes utilizadas por esta portada.

### Inputs / Fields

Búsqueda y selector nativo conservan etiqueta visible y relación `htmlFor`/`id`. Miden al menos 52 px, con texto de 18 px, borde de 1 px, radio de 8 px y relleno de 10 × 14 px. El selector reserva 42 px a la derecha para su SVG de 16 px. El placeholder usa texto auxiliar; el cursor de texto usa el acento. Las primitivas admiten foco, `disabled` y `aria-invalid`.

La URL conserva `buscar`, `liga` y `mostrar`. Buscar ignora acentos y admite club, liga o número. Cambiar filtros restablece el límite; limpiar devuelve el foco al campo. El historial y la recarga recuperan la selección.

### Navigation

Cabecera opaca sin sombra, marca a la izquierda y anclas a la derecha. Enlaces con altura mínima de 48 px; hover aclara y subraya el texto. No se implementa indicador de sección activa.

En móvil, Menú/Cerrar revela cuatro enlaces en dos columnas con `aria-expanded` y `aria-controls`. Elegir uno cierra el menú; Escape lo cierra y devuelve el foco al botón. El enlace de salto aparece al recibir foco. La 404 reutiliza los enlaces principales y de texto para regresar.

### Cards / Containers

Cada escudo es un enlace al PNG original en otra pestaña, con figura y pie. El soporte tiene proporción 1.12, relleno de 20 px y radio de 12 px; la imagen usa `contain`, ancho del 88 % y máximo de 220 px. En móvil el soporte es cuadrado, su relleno baja a 12 px y la imagen usa el 100 % de ancho.

Hover escala solo la imagen a 1.035 en 180 ms `ease-out`; pulsación a 0.99. El pie queda fuera del soporte, con 14 px de separación. Diseño, club y liga mantienen niveles de lectura distintos. No existe diálogo de detalle.

### Gallery states

El contador anuncia resultados con `role="status"` y `aria-live="polite"`; el contenedor comunica `aria-busy` durante el filtrado diferido. El estado vacío ofrece título de 26 px, explicación de 18 px y una acción para recuperar todos los escudos.

Se muestran 12 diseños inicialmente y se añaden hasta 12 por pulsación. Al alcanzar el final tras ampliar, el mismo control muestra “Colección completa”, conserva el foco, comunica `aria-disabled` y deja de añadir resultados. El enlace para volver a los filtros aparece al superar el límite inicial.

### Rule disclosure

Preguntas con `details`/`summary` nativos sobre `surface`, radio de 8 px y relleno lateral de 24 px, reducido a 20 px en móvil. El resumen mide al menos 64 px, con relleno vertical de 18 px y peso 600; hover usa el acento. El contenido abierto usa texto auxiliar, máximo de 70ch y 24 px de espacio inferior.

### Trophy and motion

El visor carga al entrar en pantalla y conserva la imagen mientras carga o si falla. El usuario gira directamente con arrastre o teclado y puede recuperar el frontal. No hay giro automático. Fuera de pantalla se limita el trabajo gráfico; el scroll vertical móvil permanece operativo.

React ViewTransition conserva identidad por escudo: entrada de opacidad en 160 ms, salida en 120 ms y actualización en 180 ms. Raíz y cabecera no se animan. Sin soporte del navegador, los filtros mantienen su función.

Con `prefers-reduced-motion: reduce`, el desplazamiento pasa a `auto` y se desactivan animaciones, transiciones y animaciones de View Transition. Se conservan controles, foco, enlaces y resultados.

## Do's and Don'ts

### Do:

- **Do** conservar los PNG originales completos, sus proporciones y sus colores sobre los soportes marinos.
- **Do** usar Manrope para lectura y controles, y Barlow Condensed 700 para títulos.
- **Do** conservar el foco visible, los controles amplios y el margen móvil de 20 px.
- **Do** vincular el movimiento a entrada o cambio de estado y respetar movimiento reducido.
- **Do** conservar la continuidad oscura y la profundidad por capas de color.

### Don't:

- **Don't** sustituir los escudos propios por estrellas genéricas, órbitas o efectos excesivos.
- **Don't** recortar los PNG con la geometría de banderín de su soporte.
- **Don't** reducir la lectura auxiliar por debajo de los tamaños establecidos para ganar densidad.
- **Don't** presentar inscripciones, administración, resultados o participantes inexistentes como funciones o datos disponibles.
- **Don't** convertir la composición de la primera pantalla en una obligación para todas las superficies futuras.

### Consulta pública ampliada

Próximo partido antes de los datos de edición, equipos con plantilla Roblox y resultados en listas adaptables. Las zonas usan azul claro para directo y violeta moderado para repesca, siempre con etiqueta y carácter provisional. El cuadro resalta la ruta con texto, borde y superficie, conservando selector de ronda y exploración horizontal opcional en móvil. Las tarjetas de resultado usan Barlow, escudos propios y fondo medianoche, con formato vertical y OG; las resoluciones administrativas se identifican expresamente. Sin animaciones ornamentales.

## Herramientas LIVE

Marcadores grandes y controles de goles de 48 px; textos de 18 px. La espera es una zona separada con convocatoria explícita. Resultado oficial, permisos y clip son formularios distintos con motivo y confirmación. Anclas internas permiten saltar entre las zonas en móvil; casillas no heredan el ancho de los campos de texto. OBS usa un marco limpio y etiquetas provisional/oficial, sin controles privados. Revelación respeta movimiento reducido. Exportación ofrece páginas de diez filas para mantener lectura.
