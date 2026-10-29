# Verificación del rediseño

## Comprobaciones ejecutadas

| Comprobación           | Resultado                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | Correcto: tipos de rutas y TypeScript sin emisión.                                                                                  |
| `npm run lint`         | Correcto: sin errores ni advertencias.                                                                                              |
| `npm run check:assets` | 48/48 PNG RGBA de 1254 × 1254; rutas y catálogo correctos.                                                                          |
| `npm run build`        | Compilación de producción correcta. Portada, 404 e icono estáticos; proxy de sesión conservado.                                     |
| Playwright             | Correcto en 360, 390, 768, 1024 y 1440 px; sin desbordamientos ni imágenes deformadas.                                              |
| Axe 4.14               | Cero infracciones automáticas en las cinco anchuras, reglas WCAG A/AA y buenas prácticas.                                           |
| Teclado y estados      | Salto a contenido, menú/Escape, anclas, detalles, búsqueda, vacío, limpiar, carga de 12 más, colección completa y 404 correctos.    |
| Filtros y URL          | Diez categorías verificadas; búsqueda sin acentos y por número; recarga e historial conservan selección.                            |
| Consola y recursos     | Sin errores de aplicación. Las 48 rutas PNG responden HTTP 200.                                                                     |
| Zoom nativo 200 %      | Edge con perfil temporal aislado: ventana 1440 px, viewport CSS 708 px, DPR 2 y CSS zoom 1. Menú, navegación y filtros utilizables. |
| Movimiento reducido    | Contenido y controles operativos; animaciones desactivadas.                                                                         |

[Resultado de Playwright](../output/playwright/verification.json) · [comparaciones y capturas](comparaciones.md).

El zoom usa la preferencia nativa de Chromium (`partition.default_zoom_level.x = log(2)/log(1.2)`) en un perfil nuevo, sin modificar el navegador del usuario. La [implementación de Chromium](https://chromium.googlesource.com/chromium/src/+/main/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc) documenta esa preferencia. Las capturas de viewport usan límites físicos de CDP: la captura completa con zoom producía recortes o imágenes sin pintar y no se acepta como evidencia.

## Rendimiento: evidencia de compilación

La primera compilación de Preview detectó un archivo de bloqueo incompleto para paquetes opcionales de Linux (`@emnapi`). Se regeneró desde una carpeta sin `node_modules`, manteniendo las versiones directas. Después pasaron una instalación limpia con `npm ci`, las cuatro comprobaciones locales y la validación del lock con npm 12 para Linux/x64 en una carpeta vacía. La corrección no modifica la interfaz.

La skill `next-bundle-optimizer` se aplicó a las tres rutas (`/`, `/_not-found`, `/icon.svg`) en modo de auditoría. Se usó el esquema `next/analyze/graph-v1.schema.json` de Next.js instalado; captura `audit-before-d4e857c` y captura final del rediseño. Las exportaciones `.jsonl.gz` quedan en `output/analyze`, ignorado en Git.

| Métrica atribuida del conjunto cliente           |   Antes | Después |
| ------------------------------------------------ | ------: | ------: |
| Archivos de cliente emitidos                     |      57 |      25 |
| Archivos de fuente                               |      18 |       2 |
| Bytes comprimidos atribuidos, todos los recursos | 467 437 | 304 724 |
| Bytes comprimidos atribuidos de JavaScript       | 222 737 | 248 309 |

Se eliminaron variantes y formatos de fuente innecesarios al usar dos WOFF2 locales con `next/font/local`. El total atribuido baja aproximadamente 35 %. JavaScript aumenta aproximadamente 25,6 kB por controles accesibles, historial, búsqueda y estados; no se presenta como una reducción de JS ni como ahorro de transferencia real.

Se deduplicó cada pareja `(filename, source_path)` entre rutas. La cobertura del cliente es `exact` en 15 salidas de módulo; las otras salidas son `not_a_chunk` (fuentes, CSS, runtime y polyfill). No hay salidas de cobertura `unsupported`. Esto no equivale a una medición de red, LCP, INP o CLS en dispositivos reales.

## Dependencias del cliente

| Fuente o candidato                                                | Emisión y ruta                                                   | Resultado                                                                                 |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/lib/supabase/*`, SDK, credenciales, `catalogo.json` completo | No aparecen entre módulos emitidos de cliente en las tres rutas. | Sin posible filtración detectada; la galería recibe solo campos públicos de presentación. |
| Server Actions                                                    | No existen importaciones ni acciones implementadas.              | No aplicable; no se atribuyen stubs inexistentes.                                         |
| Next y React                                                      | Módulos de framework compartidos.                                | Contenido esperado, conservado.                                                           |
| Base UI, iconos, `cn`, componentes de galería                     | Referencias de cliente de cabecera y galería.                    | Contenido intencional y necesario para los controles actuales.                            |

No se propuso un límite de carga diferida ni una modificación de confianza. La oportunidad principal era de archivos de fuente, no de una región opcional del grafo JavaScript: se siguieron sus importaciones directas. No se ejecutó community/min-cut; ese análisis no aporta un corte útil a esos archivos y no se reivindica una auditoría completa de cortes de código. Los polyfills y módulos de framework se conservan por compatibilidad.

## Límites

- Las pruebas no sustituyen Safari, Firefox, un teléfono físico o un lector de pantalla real.
- Axe no certifica por sí solo toda la accesibilidad.
- El sitio no consulta tablas ni ejecuta operaciones de inscripción; no se han probado funciones futuras ni se ha modificado el esquema de Supabase.
- No hay material real de trofeo o vídeo disponible. Se conservaron y reutilizaron los escudos, sin inventar esos recursos.
- Los resultados del inspector Taste se contrastan con las necesidades del usuario: no se añaden animaciones de scroll o vídeos irrelevantes para satisfacer cuotas automáticas.
