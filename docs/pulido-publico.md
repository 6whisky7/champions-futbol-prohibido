# Navegación, Ahora y detalle de escudos

Primer bloque de la guía visual. Se conserva el trofeo V03, geometría, cámara, HDR y carga automática. DESIGN incorpora el uso de dorado para logros, las excepciones moderadas de luz y las texturas propias de cancha/banderín. No se habilita ninguna función pendiente de privacidad.

La navegación marca página o sección con `aria-current` e indicador visible, también en el menú móvil. La posición se actualiza al desplazarse y cuando cambia el tamaño del contenido. Inicio e historial de campeones quedan localizables en el menú.

La franja **Ahora**, después de la presentación de portada, reúne el siguiente partido real y la inscripción del evento que muestra. Reutiliza las proyecciones públicas y el recordatorio/ICS existentes; muestra la zona del visitante después de cargar. La hora nunca implica que se inició un partido o un LIVE. Solo una convocatoria explícita vigente habilita el enlace contextual al canal y se etiqueta «Partido convocado», sin afirmar que TikTok esté emitiendo. Las consultas se suspenden al ocultar la pestaña.

La galería abre un Dialog de shadcn/Base UI con diseño completo, referencia y selector de evento. El URL conserva búsqueda, liga, límite, evento y escudo; volver/cerrar no destruye los filtros. Escape y el cierre devuelven el foco al botón de origen, o a la búsqueda si se abrió por enlace directo. El foco queda dentro del diálogo mientras está abierto.

`/api/escudos` filtra eventos publicados incluso cuando consulta el propietario. Solo devuelve opciones de evento, identificadores de escudos reservados, plazas libres y disponibilidad de recepción; nunca payloads, TikTok, notas ni historial. Al elegir un escudo libre se lleva al formulario como preselección. Si el cupo está lleno, ofrece espera sin reservas; si el escudo está ocupado con plazas disponibles, pide elegir otro. La reserva sigue ocurriendo exclusivamente al guardar una solicitud válida. La política inactiva deshabilita la recepción también aquí.

## Verificación

`verify-visual-public.mjs`: PASS con PostgreSQL real local y transporte/Auth de prueba. Eventos borrador 404, proyección pública explícita, hora real equivalente a 20:15 de Costa Rica, sin «En vivo» inferido; ocupado/libre/espera; preselección sin solicitud creada; cierre, foco, acceso por URL, fallo/reintento y Axe del diálogo móvil; navegación activa en 1440, 1024, 768 y 390 px sin desbordamiento. [Reporte y capturas](evidencia-pulido-publico/).

TypeScript, ESLint, assets y compilación: PASS. Los 48 originales y derivados, catálogo y V03 de cinco materiales se conservan. No se cambia esquema ni reglas; las operaciones de inscripción conservan reservas atómicas e idempotencia. El recorrido integral con Auth/PostgREST reales sigue pendiente y no se sustituye con esta evidencia local.

El siguiente bloque completa las jornadas, clasificación, cuadro, campeón y presentación administrativa. El registro por página está en [la lista de la guía](pulido-visual-estado.md).
