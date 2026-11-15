# Estado actual de Champions Fútbol Prohibido (CFP)

Actualización: 15 de noviembre de 2026, Costa Rica. Este documento recupera el estado real del proyecto tras la pausa posterior al PR #16, registra la auditoría y la corrección de accesibilidad de los escudos, y separa lo corregido de lo que sigue pendiente. Las inscripciones reales y la política de privacidad permanecen **cerradas**.

## 1. Estado inicial recuperado

- Repositorio local: `C:\Users\XT\Projects\champions-futbol-prohibido`, verificado como el proyecto correcto (remoto `6whisky7/champions-futbol-prohibido`, proyecto Supabase `cvenqmszdmhqaeokzbnz`, 48 escudos originales y trofeo V03).
- Rama de trabajo existente: `fix/crest-accessible-names`, con **cambios locales sin confirmar** que ya iniciaban la corrección de accesibilidad de los escudos.
- `main` (y `origin/main`): `ef5f6c6` (PR #16). No existía ningún PR posterior al #16.
- La corrección de accesibilidad de los escudos estaba iniciada pero **sin confirmar ni publicar**.
- Se conservaron los cambios locales. No se hizo `reset`, `clean`, `checkout` destructivo ni se eliminó ningún archivo.

## 2. Último commit y PR

| Elemento | Valor |
| --- | --- |
| Rama principal | `main` |
| Último commit integrado | `ef5f6c6` — «Polish competition calendar, standings, bracket and owner workflows (#16)» |
| PR anterior | #15 (`e3b31d0`) y #16 (`ef5f6c6`) |
| PR posterior al #16 | No existía |
| Rama de esta corrección | `fix/crest-accessible-names` |

## 3. Problemas encontrados

| # | Problema | Clasificación | Estado |
| --- | --- | --- | --- |
| 1 | Los botones de escudo de la portada tenían un nombre accesible que **no contenía todo el texto visible**: omitía la liga e insertaba «inspirado en» entre las partes visibles. Infracción `label-content-name-mismatch` (WCAG 2.5.3 Label in Name, nivel A), confirmada en producción. | Importante | Corregido |
| 2 | Las comprobaciones locales de Axe (`verify-ui.mjs`, `verify-visual-public.mjs`) no incluían la etiqueta `wcag21a`, por lo que la regla anterior no se detectaba antes de publicar. | Importante | Corregido |
| 3 | Los selectores de `verify-visual-public.mjs` usaban el nombre accesible anterior. | Menor | Corregido |
| 4 | El servidor de desarrollo bloquea el recurso HMR para `127.0.0.1` (`Blocked cross-origin request … /_next/hmr`); acceder por `localhost` o `allowedDevOrigins` lo evita. No afecta a producción. | Menor | Documentado |
| 5 | Recorrido con Supabase Auth y PostgREST reales en entorno aislado. | Dependiente de configuración externa | Pendiente |
| 6 | Procedimiento de privacidad, autorización de menores e identificación legal. | Bloqueante para abrir inscripciones | Pendiente de decisión/validación del propietario |

No se detectaron errores de TypeScript, ESLint, compilación ni de assets. No hay marcadores `TODO`/`FIXME` ni HTML inyectado sin escapar en `src`.

## 4. Problemas corregidos

1. **Nombre accesible de los escudos.** En `src/components/crest-gallery.tsx` se sustituyó el `aria-label` parcial (`Ver diseño 01, inspirado en …`) por `aria-labelledby` apuntando al pie visible completo (`figcaption`) y se añadió `aria-haspopup="dialog"`. El nombre accesible pasa a ser exactamente el texto visible («Diseño 01 Saprissa Costa Rica»), lo que satisface Label in Name sin cambiar el diseño, los filtros, la reserva ni el contenido.
2. **Cobertura de Axe.** Se añadió `wcag21a` a las etiquetas de `scripts/verify-ui.mjs` y `scripts/verify-visual-public.mjs` para cubrir Label in Name.
3. **Selectores de prueba.** `scripts/verify-visual-public.mjs` usa ahora `/Diseño 0X/`, coherente con el nuevo nombre accesible.

La corrección es pequeña y verificable: no altera reglas del torneo, permisos, reservas, resultados ni destinos de eliminatorias, y no toca LIVE, OBS ni las exportaciones.

## 5. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| `src/components/crest-gallery.tsx` | `aria-labelledby` al pie visible + `aria-haspopup="dialog"` en el botón de escudo |
| `scripts/verify-ui.mjs` | Etiqueta `wcag21a` en la comprobación de Axe |
| `scripts/verify-visual-public.mjs` | Etiqueta `wcag21a` y selectores `/Diseño 0X/` |
| `docs/pulido-competicion.md` | Registro de la corrección detectada al revisar producción |
| `docs/ESTADO_ACTUAL_CFP.md` | Este documento (nuevo) |

## 6. Pruebas ejecutadas y resultados

| Prueba | Alcance | Resultado |
| --- | --- | --- |
| `npm run typecheck` | Next typegen + `tsc --noEmit` | PASS |
| `npm run lint` | ESLint `--max-warnings=0` | PASS |
| `npm run check:assets` | 48 PNG originales + 48 miniaturas + V03 (1 631 132 bytes) | PASS |
| `npm run build` | Compilación de producción | PASS |
| Axe contra **producción** | Portada publicada (`ef5f6c6`), etiquetas `wcag2a/wcag2aa/wcag21a/wcag21aa` | 1 infracción: `label-content-name-mismatch` (confirma el problema) |
| Axe contra la corrección local | Portada con `aria-labelledby`, mismas etiquetas | 0 infracciones |
| `scripts/verify-ui.mjs` | Portada en 360/390/768/1024/1440, teclado, filtros, 48 rutas, movimiento reducido, zoom nativo 200 % | PASS — Axe 0, consola sin errores |
| Axe en páginas públicas | `/`, `/como-se-juega`, `/privacidad`, `/eventos`, `/campeones` | 0 infracciones |
| `scripts/verify-visual-public.mjs` | Flujo real de escudos con PostgreSQL aislado: ocupado/libre, espera, foco, Escape, Axe del diálogo, cuatro anchos | PASS |
| `scripts/verify-integral.mjs` | Recorrido integral de un evento (inscripción, espera, cierre, liguilla, eliminatorias, campeón) | PASS |

Las pruebas con base de datos usan el entorno aislado de `C:/Users/XT/Projects/cfp-registration-tests` (PostgreSQL embebido real + Auth/REST simulados). **No** se ejecutó ninguna prueba contra Supabase de producción ni se suplantó al propietario real.

## 7. Funcionalidades verificadas (sin cambios por esta corrección)

Se conservan y no se modifican: inscripciones, lista de espera, validación de integrantes, administración, calendario, clasificación y desempates, cierre de liguilla, eliminatorias, campeón e historial, LIVE y marcador provisional, confirmación de resultados oficiales, permisos de ayudantes, fuentes OBS y exportaciones PNG/PDF/CSV. La demostración local recuperable se conserva. Turnstile permanece descartado y no se reincorporó.

## 8. Pendientes técnicos

| Pendiente | Clasificación | Motivo / siguiente paso |
| --- | --- | --- |
| Recorrido con Supabase Auth y PostgREST reales | Dependiente de configuración externa | Requiere una pila Supabase aislada con Auth/REST y las migraciones de CFP, o un entorno remoto de ensayo autorizado. El ensayo actual usa Auth/REST simulados sobre PostgreSQL real. |
| Prueba en teléfono físico / Safari / Firefox / lector de pantalla | Menor | Opcional; no sustituye la validación de accesibilidad ya realizada. |
| Mejoras de rendimiento y web ligera | Menor | Posteriores; no bloquean. |

## 9. Pendientes de privacidad y autorizaciones

| Pendiente | Clasificación | Situación |
| --- | --- | --- |
| Aviso definitivo e identificación legal | Bloqueante para abrir inscripciones | Responsable y contacto decididos; falta la identificación legal y el canal formal. |
| Autorización de menores y confirmación individual | Bloqueante para abrir inscripciones | Sin edad mínima propia y con autorización verificable, pero el procedimiento no está validado ni implementado. La declaración del capitán no acredita a toda la plantilla. |
| Conservación (30/90 días) | Importante | Plazos provisionales; no hay purgas activas. Revisar alcance y respaldos antes de automatizar. |
| Requisitos de TikTok en menores | Importante | Sin excepción activada; decidir un recorrido compatible antes de recibir esos casos. |
| Reglas deportivas abiertas | Importante | Convocatoria/reclamaciones, desconexiones/abandono, sanciones y cierre con número impar siguen documentados. |

**Las inscripciones reales permanecen cerradas** hasta validar e implementar los procedimientos anteriores y activar la política.

## 10. Estado de producción

- Dominio: https://champions-futbol-prohibido.vercel.app
- Commit desplegado al iniciar esta revisión: `ef5f6c6` (PR #16), Vercel **Production Ready**.
- La corrección de accesibilidad se publica en un PR posterior; la revisión de producción se repite para el SHA exacto una vez integrado.

## 11. Siguiente paso recomendado

1. Integrar el PR de corrección de accesibilidad (`fix/crest-accessible-names`) y verificar Vercel Production Ready para el SHA exacto y el dominio público (repetir Axe de la portada).
2. Resolver, con el propietario, la identificación legal y el procedimiento de autorización/confirmación individual para poder abrir inscripciones.
3. Habilitar una pila Supabase aislada con Auth/PostgREST reales para completar el recorrido autenticado pendiente.
