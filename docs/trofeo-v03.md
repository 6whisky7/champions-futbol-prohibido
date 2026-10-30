# Trofeo V03 en portada

V03 aprobada por el organizador. El maestro Blender, los renders originales y el ZIP permanecen fuera del repositorio, en `C:/Users/XT/Projects/champions-trofeo-output`. La web contiene solo copias derivadas.

## Recursos y apariencia

- Original: `Champions_Futbol_Prohibido_Trofeo_v03.glb`, 10 781 576 bytes.
- Copia web: `public/trofeo/cfp-v03-web.glb`, 1 631 132 bytes (84,9 % menos).
- Imagen inicial: 92 642 bytes, WebP con transparencia, render real del maestro V03.
- glTF Transform CLI 4.5.1, compresión Draco con posición de 16 bits y normales de 12 bits. Sin simplificación ni eliminación de polígonos; se conservan las 173 mallas y los cinco materiales. Draco cuantiza coordenadas/normales; la revisión visual de la copia no mostró diferencias apreciables en esta presentación.
- Decodificadores Draco de Three.js distribuidos localmente en `/trofeo/draco`, con su licencia. No dependen de un CDN.
- `@google/model-viewer` 4.4.0, versión exacta, compatible con Node 24; encapsulado como elemento web y cargado dinámicamente después de pulsar el control. Next.js 16.4.3 y React 19.3.1 conservados.

## Comportamiento

La imagen es HTML de primera carga con `next/image` y preload. El módulo del visor y el GLB se solicitan únicamente al pulsar «Girar el trofeo». Mientras cargan se conserva la imagen. Un error de módulo, red, renderizado o el tiempo límite devuelve la presentación de imagen. «Ver imagen» desmonta el visor. No hay giro automático ni bucles de animación propios; los motores del visor dejan de renderizar cuando no hay cambios. Las flechas giran el modelo y «Vista inicial» recupera el encuadre. Con movimiento reducido, los cambios por teclado son inmediatos. `touch-action: pan-y` permite desplazar la página verticalmente sobre el modelo.

## Verificación local

TypeScript, ESLint, 48 escudos y compilación correctos. La prueba existente de UI pasó en 360, 390, 768, 1024 y 1440 px: galería, diez filtros, búsquedas, vacío, 48 rutas PNG, teclado, menú, movimiento reducido, 404, zoom nativo al 200 % y Axe sin incidencias.

La prueba adicional pasó: ausencia de solicitudes GLB antes de activar, carga de cinco materiales, teclado, reset, imagen, fallo de red en contexto nuevo, navegación y desplazamiento táctil. Capturas y JSON en `output/playwright/trophy`.

Simulación móvil local en Edge de escritorio: viewport 390 × 844, DPR 2, red de 1,6 Mbps, latencia 150 ms y CPU ×4, contexto nuevo. LCP observado 992 ms; DOMContentLoaded 600 ms; recursos transferidos 306 081 bytes; cero solicitudes GLB antes de activar. Una corrida de laboratorio, no prueba en teléfono físico ni puntuación Lighthouse; producción puede variar.

No se modifican reglas, Supabase, credenciales ni base de datos. La publicación del rediseño y del trofeo en main está autorizada por el encargo actual.

Referencias: [carga diferida de model-viewer](https://modelviewer.dev/examples/loading/) y [glTF Transform CLI](https://gltf-transform.dev/cli).
