# champions-futbol-prohibido

Base visual y técnica de **Champions Fútbol Prohibido**, el torneo de Fútbol Prohibido en Roblox. Incluye una portada en español, una galería con los 48 escudos originales y clientes de Supabase para navegador y servidor. Está preparada para importar este repositorio en Vercel.

Esta entrega conserva el repositorio y su README inicial. El formulario de inscripción, el panel administrativo, los eventos, los resultados y las migraciones se desarrollarán en la siguiente etapa. La portada no consulta tablas ni necesita iniciar sesión.

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

| Comando | Resultado |
| --- | --- |
| `npm ci` | Instala las versiones del archivo de bloqueo. |
| `npm run dev` | Inicia el servidor de desarrollo en el puerto 3000. |
| `npm run typecheck` | Genera los tipos de rutas y ejecuta TypeScript sin emitir archivos. |
| `npm run lint` | Ejecuta ESLint; cualquier advertencia hace fallar la comprobación. |
| `npm run check:assets` | Verifica los 48 PNG, sus nombres, dimensiones, canal alfa, catálogo y reparto. |
| `npm run check` | Ejecuta TypeScript, ESLint y la validación de escudos. |
| `npm run build` | Genera la compilación de producción con Next.js. |
| `npm run start` | Sirve localmente una compilación de producción ya creada. |

En esta etapa se puede verificar la portada con `npm run build` y `npm run start`, sin consultas a la base de datos. Antes de iniciar el desarrollo conectado a Supabase, vincula Vercel, comprueba las variables y confirma el proyecto de destino. No ejecutes migraciones como parte de la importación inicial.

## Proyecto de Supabase

| Configuración | Valor |
| --- | --- |
| Nombre | `champions-futbol-prohibido` |
| Referencia | `cvenqmszdmhqaeokzbnz` |
| Panel | [Abrir el proyecto correcto](https://supabase.com/dashboard/project/cvenqmszdmhqaeokzbnz) |

Utiliza **exclusivamente este proyecto**. El proyecto `fulvito` que existe en la organización pertenece a otra aplicación.

Obtén la URL y la clave publishable desde **Connect** o **Settings → API Keys** dentro de este proyecto. Los valores entregados por el organizador ya se guardaron en el archivo local ignorado; no se publican en este repositorio.

Los clientes están preparados de esta forma:

- `src/lib/supabase/client.ts`: `createBrowserClient` para componentes de cliente.
- `src/lib/supabase/server.ts`: `createServerClient`, `await cookies()` y un cliente separado por petición. El módulo está protegido con `server-only`.
- `src/lib/supabase/proxy.ts`: renovación de sesión con `getClaims()`, sincronización de cookies y propagación de los encabezados que impiden cachear sesiones.
- `src/proxy.ts`: limita esa renovación a `/admin/:path*` y `/auth/:path*`, reservados para la siguiente etapa. La portada y los recursos públicos no ejecutan ese flujo.
- `src/lib/supabase/config.ts`: valida las variables al utilizar un cliente e impide apuntar a otro proyecto.

El proxy **no implementa autorización administrativa**. Todavía no hay pantallas de acceso, usuarios administrativos, roles, tablas, políticas RLS, rutas de callback ni operaciones de inscripción. Al implementar esas funciones habrá que verificar permisos también en cada operación del servidor; la renovación de una sesión no concede acceso administrativo.

## Escudos y catálogo

`public/escudos` contiene **48 PNG individuales de 1254 × 1254 con transparencia**, copiados sin modificar los originales, y `catalogo.json`, conservado íntegramente.

| Referencia | Cantidad |
| --- | ---: |
| Inglaterra, Italia, España, Alemania y Francia | 5 por cada una; 25 en total |
| Brasil, México y Argentina | 5 por cada una; 15 en total |
| MLS | 4 |
| Costa Rica | 4 |
| **Total** | **48** |

Los nombres del campo `file` del catálogo coinciden con los archivos. Las rutas públicas tienen el formato `/escudos/<file>`, por ejemplo `/escudos/45-costa-rica-saprissa.png`. El catálogo se sirve en `/escudos/catalogo.json`.

`src/lib/crests.ts` transforma el catálogo en los campos de presentación de la galería. La muestra inicial incluye los cuatro diseños de Costa Rica; se puede filtrar por país o liga y mostrar los 48 diseños. El ZIP original no se incorpora al repositorio: los PNG están disponibles por separado y ese ZIP permanece en la carpeta de recursos del organizador.

Los identificadores 01–48 de los archivos corresponden a los diseños. **No asignan un número al equipo del torneo.** El número opcional del equipo sigue siendo una elección independiente del 01 al 99 y puede repetirse. La política para repetir escudos entre equipos sigue pendiente.

## Importar en Vercel dentro de Whiskyideas

La importación y el despliegue los continúa el organizador. Este repositorio no incluye una vinculación `.vercel` ni ha creado un proyecto de Vercel.

1. Abre el panel de Vercel y selecciona el equipo **Whiskyideas**.
2. Elige **Add New → Project** e importa `6whisky7/champions-futbol-prohibido` desde GitHub. Si el repositorio no aparece, revisa el acceso de la integración de GitHub a este repositorio.
3. En **Configure Project**, utiliza estos ajustes:

   | Campo | Ajuste |
   | --- | --- |
   | Equipo o scope | **Whiskyideas** |
   | Project Name | `champions-futbol-prohibido` |
   | Framework Preset | **Next.js** |
   | Root Directory | `./` — la raíz que contiene `package.json` |
   | Production Branch | `main` |
   | Node.js Version | **24.x**; también está indicada en `package.json` |
   | Install Command | `npm ci` |
   | Build Command | `npm run build` |
   | Output Directory | Valor automático de Next.js; no elegir `out` ni `dist` |

4. En **Environment Variables**, agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, con los valores del proyecto `cvenqmszdmhqaeokzbnz`. Configúralas para **Production**, **Preview** y **Development**. No cambies sus nombres ni agregues claves administrativas.
5. Revisa los ajustes y pulsa **Deploy**. Al terminar, confirma el estado **Ready**, abre la portada y prueba los filtros y los escudos. Verifica en **Settings → Git** que la rama de producción sea `main`.

Si ya estás en la pantalla de configuración de la importación, puedes continuar desde el punto 3. Si modificas una variable `NEXT_PUBLIC_*` después de compilar, vuelve a desplegar para incorporarla al navegador.

Después de importar, vincula la copia local al proyecto existente cuando corresponda y verifica las variables antes de iniciar migraciones. Evita crear otro proyecto o instalar una integración que aprovisione una segunda base de datos: Supabase ya está creado.

## Decisiones del torneo y trabajo pendiente

Consulta [las decisiones del torneo](docs/decisiones-del-torneo.md). Las correcciones confirmadas más recientes prevalecen sobre versiones anteriores del reglamento; las sugerencias pendientes están separadas y no se presentan como reglas aprobadas.

Después de verificar la importación quedan pendientes:

- Diseñar las tablas, las restricciones, las políticas RLS y las migraciones del proyecto correcto.
- Implementar la inscripción pública, sus validaciones en servidor y base de datos, vencimiento y lista de espera.
- Implementar acceso y autorización del administrador, revisión de requisitos y protección de los usuarios de TikTok.
- Configurar Site URL y las Redirect URLs de Supabase cuando existan el dominio final y las rutas reales de autenticación.
- Desarrollar eventos, calendario, clasificación, sanciones, historial y eliminatorias.
- Resolver los puntos del reglamento que siguen abiertos, incluida la repetición de escudos.

## Documentación oficial utilizada

- [Instalación de Next.js](https://nextjs.org/docs/app/getting-started/installation) y documentación de la versión instalada en `node_modules/next/dist/docs`.
- [Tailwind CSS con Next.js](https://nextjs.org/docs/app/getting-started/css).
- [Integrar el plugin oficial de Next.js en ESLint](https://nextjs.org/docs/app/api-reference/config/eslint).
- [Clientes y sesiones SSR de Supabase](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- [Importar un repositorio Git en Vercel](https://vercel.com/docs/git).
