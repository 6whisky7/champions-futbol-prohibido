# Verificación final y preparación para revisión personal

31 de octubre de 2026. El objetivo de esta entrega es permitir revisar el torneo sin inaugurar una edición real. Se conserva Supabase `cvenqmszdmhqaeokzbnz`; este bloque no necesita migraciones ni elimina datos.

## Estado comprobado antes del cierre

| Bloque | Git y producción comprobada |
| --- | --- |
| Presentación y disponibilidad | PR #9, `168c293f20e5ab7f880b24b8f7deabbd121fea23` |
| Límites y preparación de privacidad | PR #10, `9fa070188c5470f891c76895d6615ee265a44d16` |
| Páginas públicas | PR #11, `310a70dc2679a7657dfe28065cf2d85a75cd5b90` |
| Orientación administrativa y requisitos | PR #12, `dfeca487aeb39490274b7f0c5559c999305130ee` |
| LIVE, ayudantes, OBS y exportaciones | PR #13, `f048153f8be3f274193d67b17d75c3b2449bf438` |

Cada uno se integró mediante PR y se comprobó **Production Ready para su SHA**, seguido de consultas al dominio público. El último despliegue del bloque 4 fue `champions-futbol-prohibido-a6vjbpzpu-whiskyideas.vercel.app`. El primer preview de LIVE falló por dos entradas WASI omitidas por npm al modificar el lock en Windows; se restauraron y la instalación limpia/compilación Linux del preview y producción terminaron correctamente. No se publicó aquel preview fallido.

La publicación de este bloque 5 se registra en su PR de cierre y en el informe entregado, tras verificar el SHA final. Implementación local y publicación son comprobaciones diferentes.

## Cambios finales

- La página de privacidad y las decisiones incorporan la admisión sin edad mínima propia, menores con autorización verificable, separación público/privado y plazos provisionales 30/90 días. No se activan autorizaciones ficticias ni purgas.
- [Propuesta concreta](privacidad-propuesta.md) de confirmación individual, representación, retirada y conservación segura. Incluye las restricciones de TikTok y la identificación legal todavía necesaria.
- Disponibilidad en portada/listado respeta también la política global: si está inactiva no anuncia inscripción ni espera aunque hubiera un evento previamente abierto. El detalle lo explica y mantiene deshabilitado el envío. Fallo de consulta no se convierte en permiso para inscribir.
- [Demostración personal](demostracion.md) con base independiente recuperable y guía visual; sin publicar eventos ficticios en Supabase.
- Reglamento actualizado en `docs/archivos/Champions_Futbol_Prohibido_reglamento_2026-10-31.docx`, conservando los originales de Descargas. Once páginas renderizadas e inspeccionadas; Word nativo exportó el PDF de revisión porque el runtime Windows no trae LibreOffice. Los PNG se revisaron mediante el renderer de la skill usando ese PDF. Los intermedios no son el entregable.

## Pruebas ejecutadas

- **TypeScript, ESLint, assets y compilación:** PASS. 48 PNG originales y 48 derivados, catálogo y rutas; V03 de 1 631 132 bytes, cinco materiales, sin animaciones añadidas. Maestros intactos fuera de `public`.
- **Recorrido integral:** PASS en un evento aislado de doce equipos, 24 partidos de liguilla y siete de eliminatorias. Formulario, rechazadas, vencimiento controlado, espera/promoción/conflictos, cupo, revisión, cierre, calendario, corrección de resultados, desempates y campeón. [Reporte](evidencia-final/integral.json).
- **Administración:** once superficies en 1440/390 px, nueve comprobaciones individuales, confirmación del capitán, bloqueo de aprobación y auditoría. Axe sin infracciones detectadas, menú/Escape y sin desbordamiento. Auth/REST simulados; PostgreSQL y acciones Next reales.
- **Público:** siete superficies en escritorio/móvil, privacidad de borradores/PNG/ICS, tarjetas reales, zona Tokio frente a Costa Rica, límite de fecha, reprogramación e ICS con UID estable. Récords excluyen goles administrativos. PASS.
- **LIVE:** pruebas de permisos, acceso directo, reloj, invalidez de espera tras reprogramación/segundo intento, cuatro goles sin guardado automático, ausencia seleccionada y resultados oficiales. Concurrencia: un guardado y un rechazo por revisión obsoleta, sin alterar el resultado oficial. Revocación inmediata, incluso tras perder verificación. PASS.
- **OBS/exportaciones/revelación:** tres vistas públicas, PNG/PDF/CSV descargados; PDF de dos páginas renderizado e inspeccionado; fórmulas CSV neutralizadas. Revelar reproduce 24 cruces guardados, sin POST de sorteo, con movimiento reducido. PASS.
- **Pruebas finales adicionales:** política inactiva y disponibilidad, OBS 503 conserva última lectura rotulada/recuperación y 404 retira el marcador; LIVE con zoom nativo 200 %, teclado, Escape y sin desbordamiento. [Reporte](evidencia-final/final.json).
- **Galería/portada:** 360, 390, 768, 1024 y 1440 px, búsqueda, diez filtros, URL/historial, 48 rutas, teclado, movimiento reducido y zoom nativo 200 %. Axe sin infracciones detectadas, consola sin errores. [Reporte](evidencia-final/galeria.json).
- **Supabase real, SQL revertido:** regresiones `events_rls`, `registration`, `admin_requirements`, `league`, `knockout` y `live` sin errores/assertions fallidas, cada una con `ROLLBACK`. Tras ellas: cero eventos, solicitudes, ayudantes y marcadores; política inactiva. Esto prueba funciones/roles en PostgreSQL remoto, no la cadena Auth/PostgREST completa.
- **PostgREST anónimo real:** lectura pública controlada, RPC privadas/de escritura LIVE rechazadas y política inactiva comprobadas por HTTPS con la clave publicable. No usa Auth simulado. [Registro](evidencia-final/production-direct-rpc.json). El recorrido autenticado real sigue pendiente.
- **Dominio público:** acceso LIVE disponible, administración/LIVE redirigen sin sesión, API privada 401, OBS/exportación/revelación sin evento publicado 404 y disponibilidad vacía. Sin suplantar al propietario. [Registro del bloque 4](evidencia-final/production-4b.json).

## Medición móvil repetida

Edge de escritorio, 390 × 844, DPR 2, descarga 1,6 Mbps, latencia 150 ms y CPU ×4, contexto frío. **LCP 1040 ms**, 3D listo **12 917 ms**, **2 016 643 bytes** transferidos hasta ese punto. Una petición GLB, carga automática. [Registro completo](evidencia-final/trofeo.json).

La medición anterior era LCP 1012 ms/3D 12 317 ms/2 012 437 bytes. Son corridas simuladas, no una comparación estadística ni prueba en teléfono físico/Lighthouse. La página permite leer y navegar mientras el modelo carga. Giro, teclado, reset frontal, imagen ante error, ocultación fuera de pantalla y desplazamiento táctil sintetizado: PASS. El GLB original conserva 10 781 576 bytes; la copia web, 1 631 132. Continúan las limitaciones de relieve procedural/Cycles frente a IBL documentadas en el bloque 1.

## Qué sigue pendiente

**Antes de abrir:** completar identificación legal y aviso; validar/aprobar e implementar representación y confirmación individual; decidir la adaptación del requisito TikTok; revisar conservación y casos restantes; activar una versión del aviso solo después de verificar esos controles. Consultar [los pasos concretos](privacidad-propuesta.md#lo-indispensable-antes-de-abrir).

**Prueba técnica pendiente:** el recorrido integral con Supabase Auth y PostgREST reales en un entorno aislado. Docker volvió a fallar al conectar con `dockerDesktopLinuxEngine`; no se restableció ni borró su configuración. El acceso real del propietario fue confirmado por él en una etapa anterior, pero no sustituye esta prueba ampliada.

**Opcionales:** ayudante real solo si Whisky decide incorporarlo; prueba en teléfono físico/Safari/Firefox/lector de pantalla; mejoras posteriores de rendimiento y adaptación web ligera adicional. No se requiere Turnstile. Las decisiones deportivas abiertas conservan su sección en el reglamento, sin inventar sanciones o sustituciones.

Advisors revisados: las tablas privadas sin políticas y las RPC SECURITY DEFINER tienen denegación/grants y guardas explícitas. Los índices nuevos sin uso se conservan; SELECT mantiene las políticas de propietario/publicado previstas. Permanecen las advertencias documentadas de [políticas permisivas múltiples](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) y [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), con acceso por enlace de correo. No se presenta el diagnóstico como un informe sin avisos.
