# champions-futbol-prohibido

Portada con el trofeo V03 aprobado, imagen inicial y visor 3D automático al entrar en pantalla. Los 48 escudos y su galería se conservan. Incluye eventos públicos, inscripción sin cuentas y administración del propietario para revisar solicitudes, equipos y lista de espera. Los eventos reales se conservan cerrados hasta que el propietario los abra. [Inscripciones, reservas y privacidad](docs/inscripciones.md). [Estado actual y configuración](docs/administracion-eventos.md). El registro de la primera integración del trofeo está en [trofeo V03](docs/trofeo-v03.md).

Base visual y técnica de **Champions Fútbol Prohibido**, el torneo de Fútbol Prohibido en Roblox. Incluye una portada en español, una galería con los 48 escudos originales y clientes de Supabase para navegador y servidor. Está preparada para importar este repositorio en Vercel.

El rediseño y el trofeo V03 están publicados en `main`. La administración utiliza un marco compartido con navegación y contexto de evento; `/admin` es el resumen operativo y `/admin/eventos` lista los eventos. Inscripción pública, revisión manual y lista de espera conservan sus operaciones y permisos. La competición incorpora sorteo de rivales, calendario, resultados y clasificación de liguilla con cierre. Las eliminatorias añaden cuadro fijo, revisión y confirmación, avance de ganadores y cierre del evento con campeón conservado por edición. La portada y la galería no necesitan cuentas. [Administración, seguridad y puesta en marcha](docs/administracion-eventos.md).

- [Eliminatorias, campeón y comprobación](docs/eliminatorias.md).
- [Liguilla, resultados, desempates y comprobación](docs/liguilla.md).
- [Panel administrativo, rutas y comprobación](docs/admin-panel.md).
- [Comparaciones antes/después](docs/comparaciones.md).
- [Auditoría y problemas corregidos](docs/auditoria-visual.md).
- [Skills utilizadas y compatibilidad](docs/skills.md).
- [Comprobaciones y rendimiento](docs/verificacion-rediseño.md).

## Requisitos y versiones

- Node.js **24.x LTS** (`.nvmrc` y `engines.node`).
- npm **11 o posterior**; archivo de bloqueo generado con npm 11.6.2.
- Next.js **16.4.3**, App Router y TypeScript **6.0.3**.
- React y React DOM **19.3.1**.
- Tailwind CSS y su plugin PostCSS **4.3.3**.
- ESLint **10.13.0**, plugin oficial de Next.js **16.4.3**, React Hooks **7.1.1** y typescript-eslint **8.72.1**.
- `@supabase/supabase-js` **2.118.0** y `@supabase/ssr` **0.12.7**.

Las versiones son exactas y `package-lock.json` se conserva en Git. TypeScript 6 corresponde al rango admitido por el parser actual (`>=4.8.4 <6.1.0`). ESLint 10 usa directamente el plugin oficial de Next.js para evitar el plugin React del preset completo, que todavía exige ESLint 9. No se utilizan versiones canary ni opciones para ignorar conflictos de dependencias.

## Configuración local

```powershell
git clone https://github.com/6whisky7/champions-futbol-prohibido.git
cd champions-futbol-prohibido
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Completa estas dos variables en `.env.local`, utilizando los valores del proyecto de Supabase indicado abajo:

```ini
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`.env.example` conserva los nombres sin valores. `.env.local`, los demás archivos `.env*`, las credenciales locales, `node_modules`, `.next` y `.vercel` están excluidos de Git. La excepción explícita es `.env.example`.

Las variables `NEXT_PUBLIC_*` se incorporan al navegador durante la compilación. Aquí debe utilizarse exclusivamente una clave **publishable**. No agregues claves `secret`, `service_role`, contraseñas ni tokens de gestión a estas variables, al código o al README.

## Comandos

| Comando                | Resultado                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm ci`               | Instala las versiones del archivo de bloqueo.                                                                    |
| `npm run dev`          | Inicia el servidor de desarrollo en el puerto 3000.                                                              |
| `npm run typecheck`    | Genera los tipos de rutas y ejecuta TypeScript sin emitir archivos.                                              |
| `npm run lint`         | Ejecuta ESLint; cualquier advertencia hace fallar la comprobación.                                               |
| `npm run check:assets` | Verifica los 48 PNG, sus nombres, dimensiones, canal alfa, catálogo y reparto.                                   |
| `npm run check:ui`     | Prueba la compilación servida en 3100 con Playwright y Axe; guarda capturas y resultados en `output/playwright`. |
| `npm run check`        | Ejecuta TypeScript, ESLint y la validación de escudos.                                                           |
| `npm run build`        | Genera la compilación de producción con Next.js.                                                                 |
| `npm run start`        | Sirve localmente una compilación de producción ya creada.                                                        |

Para reproducir la revisión visual, ejecuta `npm run build` y `npm run start -- --port 3100`; en otra terminal, `npm run check:ui`. En Windows se utiliza Edge. También puedes usar `UI_BASE_URL`. Las pruebas adicionales son `node scripts/verify-events.mjs`, `node scripts/verify-access.mjs` y `node scripts/verify-trophy.mjs` (por defecto puerto 3200). La prueba de acceso nunca solicita un correo al propietario. Las pruebas RLS de `supabase/tests/events_rls.sql` usan fixtures dentro de una transacción revertida. Aplica migraciones solo al proyecto confirmado, revisando primero su historial; no repitas las ya aplicadas.

## Proyecto de Supabase

| Configuración | Valor                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------- |
| Nombre        | `champions-futbol-prohibido`                                                              |
| Referencia    | `cvenqmszdmhqaeokzbnz`                                                                    |
| Panel         | [Abrir el proyecto correcto](https://supabase.com/dashboard/project/cvenqmszdmhqaeokzbnz) |

Utiliza **exclusivamente este proyecto**. El proyecto `fulvito` que existe en la organización pertenece a otra aplicación.

Obtén la URL y la clave publishable desde **Connect** o **Settings → API Keys** dentro de este proyecto. Los valores entregados por el organizador ya se guardaron en el archivo local ignorado; no se publican en este repositorio.

Los clientes están preparados de esta forma:

- `src/lib/supabase/client.ts`: `createBrowserClient` para componentes de cliente.
- `src/lib/supabase/server.ts`: `createServerClient`, `await cookies()` y un cliente separado por petición. El módulo está protegido con `server-only`.
- `src/lib/supabase/proxy.ts`: renovación de sesión con `getClaims()`, sincronización de cookies y propagación de los encabezados que impiden cachear sesiones.
- `src/proxy.ts`: limita esa renovación a `/admin/:path*` y `/auth/:path*`. La portada y los recursos públicos no ejecutan ese flujo.
- `src/lib/supabase/config.ts`: valida las variables al utilizar un cliente e impide apuntar a otro proyecto.

El proxy solo renueva sesiones. `requireOwner()` verifica al usuario mediante Auth y consulta el permiso de propietario en cada página y acción protegidas. RLS valida en la base el correo confirmado contra `cfp_private.owner_config`. No se usan metadatos editables ni claves privilegiadas. Eventos publicados son públicos; borradores solo del propietario. Solo el propietario puede abrir inscripciones de un evento publicado. Las reservas tienen controles SQL atómicos; solicitudes e historial permanecen en el esquema privado.

## Escudos y catálogo

`public/escudos` contiene **48 PNG individuales de 1254 × 1254 con transparencia**, copiados sin modificar los originales, y `catalogo.json`, conservado íntegramente.

| Referencia                                     |                    Cantidad |
| ---------------------------------------------- | --------------------------: |
| Inglaterra, Italia, España, Alemania y Francia | 5 por cada una; 25 en total |
| Brasil, México y Argentina                     | 5 por cada una; 15 en total |
| MLS                                            |                           4 |
| Costa Rica                                     |                           4 |
| **Total**                                      |                      **48** |

Los nombres del campo `file` del catálogo coinciden con los archivos. Las rutas públicas tienen el formato `/escudos/<file>`, por ejemplo `/escudos/45-costa-rica-saprissa.png`. El catálogo se sirve en `/escudos/catalogo.json`.

`src/lib/crests.ts` transforma el catálogo en los campos de presentación de la galería. La muestra inicial incluye los cuatro diseños de Costa Rica. Se puede buscar por club o número, filtrar por país o liga y mostrar 12 más hasta llegar a los 48. `liga`, `buscar` y `mostrar` se conservan en la URL. Cada escudo permite abrir su PNG original. El ZIP original no se incorpora al repositorio y permanece en la carpeta de recursos del organizador.

Los identificadores 01–48 de los archivos corresponden a los diseños. **No asignan un número al equipo del torneo.** El número opcional del equipo sigue siendo una elección independiente del 01 al 99 y puede repetirse. El escudo es exclusivo entre solicitudes activas del mismo evento y puede reutilizarse en otros eventos. Se reserva al guardar una solicitud pendiente, no al seleccionarlo.

## Importar en Vercel dentro de Whiskyideas

El proyecto **ya existe** en Whiskyideas y está conectado a este repositorio. Producción usa `main`. El rediseño y la etapa de eventos tienen autorización de publicación tras sus comprobaciones. La vinculación local `.vercel` está ignorada. No crees otro proyecto ni otra base de datos.

1. Abre el panel de Vercel y selecciona el equipo **Whiskyideas**.
2. Abre el proyecto existente `champions-futbol-prohibido`. En **Settings → Git**, confirma la conexión con `6whisky7/champions-futbol-prohibido`.
3. En **Configure Project**, utiliza estos ajustes:

   | Campo             | Ajuste                                                 |
   | ----------------- | ------------------------------------------------------ |
   | Equipo o scope    | **Whiskyideas**                                        |
   | Project Name      | `champions-futbol-prohibido`                           |
   | Framework Preset  | **Next.js**                                            |
   | Root Directory    | `./` — la raíz que contiene `package.json`             |
   | Production Branch | `main`                                                 |
   | Node.js Version   | **24.x**; también está indicada en `package.json`      |
   | Install Command   | `npm ci`                                               |
   | Build Command     | `npm run build`                                        |
   | Output Directory  | Valor automático de Next.js; no elegir `out` ni `dist` |

4. En **Environment Variables**, comprueba `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del proyecto `cvenqmszdmhqaeokzbnz`. Ambos nombres ya existían en Production; se configuraron con los valores proporcionados también para Preview y Development. No cambies sus nombres ni agregues claves administrativas.
5. Comprueba la vista previa de la rama, integra el PR revisado y confirma **Production / Ready**, el commit exacto y el dominio público. Configura además `CFP_OWNER_EMAIL` como variable exclusivamente de servidor, igual al correo privado configurado en la base. Los enlaces de Auth vuelven al callback de producción declarado en `supabase/config.toml`.

Si modificas una variable `NEXT_PUBLIC_*` después de compilar, vuelve a desplegar para incorporarla al navegador.

La sesión local de Vercel permite operar este proyecto. El conector devolvió 403 y se utilizó la CLI autenticada para comprobarlo y configurar Preview. Verifica las variables antes de iniciar migraciones. Evita instalar una integración que aprovisione una segunda base de datos: Supabase ya está creado.

## Decisiones del torneo y trabajo pendiente

Consulta [las decisiones del torneo](docs/decisiones-del-torneo.md). Las correcciones confirmadas más recientes prevalecen sobre versiones anteriores del reglamento; las sugerencias pendientes están separadas y no se presentan como reglas aprobadas.

Antes del primer evento real:

- Completar y registrar la verificación de cada entrega antes de publicar. El esquema de participación, las reservas, la revisión y la privacidad de TikTok ya tienen implementación y migraciones; consulta [su alcance y evidencia](docs/inscripciones.md).
- El propietario ya confirmó el acceso real al panel mediante su enlace de correo.
- Mantener las URLs de Auth si cambia el dominio. Site URL y callback de producción están configurados.
- Resolver las sanciones y casos administrativos todavía pendientes del reglamento. Liguilla, eliminatorias y cierre por campeón tienen implementación; consulta [liguilla](docs/liguilla.md) y [eliminatorias](docs/eliminatorias.md).
- Resolver los puntos del reglamento que siguen abiertos. Escudos, cierre y promoción de espera ya tienen decisiones confirmadas.

## Mejoras por bloques

Consulta el [plan y decisiones pendientes](docs/plan-mejoras.md) y la [comparación del trofeo y presentación](docs/mejoras-bloque-1.md). Turnstile fue retirado expresamente del encargo por el propietario.

## Primer evento y revisión integral

- [Guía breve con capturas](docs/primer-evento.md).
- [Resultados, problemas corregidos y límites del ensayo](docs/revision-integral.md).
- Recorrido completo aislado: inscripción pública → 12 aprobados → 24 partidos de liguilla → 7 eliminatorios → campeón. Auth y transporte simulados; PostgreSQL y permisos reales. No sustituye una prueba integral con Supabase Auth real.

## Documentación oficial utilizada

- [Instalación de Next.js](https://nextjs.org/docs/app/getting-started/installation) y documentación de la versión instalada en `node_modules/next/dist/docs`.
- [Tailwind CSS con Next.js](https://nextjs.org/docs/app/getting-started/css).
- [Integrar el plugin oficial de Next.js en ESLint](https://nextjs.org/docs/app/api-reference/config/eslint).
- [Clientes y sesiones SSR de Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- [Importar un repositorio Git en Vercel](https://vercel.com/docs/git).
