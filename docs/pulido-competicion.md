# Entrega del pulido de competición y administración

Segundo bloque de la guía visual, sobre el PR #15 (`e3b31d0`). Se conserva el trabajo local recuperado y la identidad CFP. [Estado final del Word](pulido-visual-estado.md), [demostración recuperable](demostracion.md) y [pendientes externos](pendientes-externos.md). El Word original no se reemplazó.

## Resultado visible

- Calendario por jornadas con progreso, selección/edición en URL, escudos de 40 px, filas simétricas y chips separados. Horarios por jornada con motivo, revisión previa, versión vigente, explicación de fallos parciales y reintentos que no escriben otra vez una fecha idéntica.
- Clasificación con puntos destacados, DG con signo, cortes por formato, equipo fijo en móvil y V/D/N. El desempate muestra el criterio guardado. Revisión y bloqueos de cierre sobre la tabla, con confirmación de sus efectos.
- Cuadro conectado mediante fuentes reales, pendientes reconocibles y destino resaltado/enfocado. Rondas y exploración horizontal móvil; cierre junto a la final.
- Campeón con nombre/escudo, V03 integrado, ambos finalistas, plantilla y avances registrados. Tarjeta pública de 1080 × 1920. Los pases administrativos muestran «Sin marcador» y no generan goles deportivos.
- Administración con fases reales, chips de publicación/inscripción separados, acción contextual, ocupación, vencimiento, titulares/suplente y comprobaciones claras. Guardado real y conservación de campos ante error.

Se corrigieron además los desbordamientos con máximos de 100 caracteres de evento, 60 de equipo y 20 de Roblox, incluidos selectores e historial. Se corrigió el acceso a contadores nulos al no existir eventos; el panel vacío conserva su marco y su siguiente paso. No se añadieron excepciones de aprobación, reglas deportivas, migraciones ni permisos generales.

## Comparaciones reales

Mismos fixtures y estado; tamaños 1440 × 1000 y 390 × 1000. El «antes» sale de un archivo del commit 814e054, compilado con las mismas dependencias; únicamente se configuró el root de Turbopack para resolver la carpeta externa. El «después» sale del build del segundo bloque. Ambas versiones usan la misma base aislada y esperan contenido cargado. Se descartó la captura antigua de calendario que solo mostraba «Cargando administración».

| Pantalla | Antes / después escritorio | Antes / después móvil |
| --- | --- | --- |
| Calendario | [Antes](evidencia-pulido-competicion/calendar-detail-before-1440.png) · [Después](evidencia-pulido-competicion/calendar-detail-after-1440.png) | [Antes](evidencia-pulido-competicion/calendar-detail-before-390.png) · [Después](evidencia-pulido-competicion/calendar-detail-after-390.png) |
| Clasificación | [Antes](evidencia-pulido-competicion/table-detail-before-1440.png) · [Después](evidencia-pulido-competicion/table-detail-after-1440.png) | [Antes](evidencia-pulido-competicion/table-detail-before-390.png) · [Después](evidencia-pulido-competicion/table-detail-after-390.png) |
| Cuadro | [Antes](evidencia-pulido-competicion/bracket-detail-before-1440.png) · [Después](evidencia-pulido-competicion/bracket-detail-after-1440.png) | [Antes](evidencia-pulido-competicion/bracket-detail-before-390.png) · [Después](evidencia-pulido-competicion/bracket-detail-after-390.png) |
| Campeón | [Antes](evidencia-pulido-competicion/champion-before-1440.png) · [Después](evidencia-pulido-competicion/champion-after-1440.png) | [Antes](evidencia-pulido-competicion/champion-before-390.png) · [Después](evidencia-pulido-competicion/champion-after-390.png) |
| Resumen | [Antes](evidencia-pulido-competicion/summary-before-1440.png) · [Después](evidencia-pulido-competicion/summary-after-1440.png) | [Antes](evidencia-pulido-competicion/summary-before-390.png) · [Después](evidencia-pulido-competicion/summary-after-390.png) |
| Solicitudes | [Antes](evidencia-pulido-competicion/requests-detail-before-1440.png) · [Después](evidencia-pulido-competicion/requests-detail-after-1440.png) | [Antes](evidencia-pulido-competicion/requests-detail-before-390.png) · [Después](evidencia-pulido-competicion/requests-detail-after-390.png) |

[Registro de las comparaciones](evidencia-pulido-competicion/comparaciones.json). También se pueden explorar en [la guía local](http://127.0.0.1:8768/comparaciones). Las capturas no se han compuesto ni retocado.

## Comprobaciones

| Comprobación | Resultado y alcance |
| --- | --- |
| TypeScript, ESLint, assets y build | PASS. 48 originales y 48 miniaturas; V03 de 1 631 132 bytes, cinco materiales. No cambian public, dependencias, Supabase ni configuración de credenciales. |
| [Recorrido de un único evento](evidencia-pulido-competicion/ensayo.json) | PASS: inscripción pública, rechazo/liberación, vencimiento, espera/conflicto/corrección/promoción, revisión/aprobación, cierre, sorteo, 24 resultados, corrección, desempates, siete eliminatorias y campeón. 31 partidos, mismas plantillas entre módulos. |
| [Competición y horarios](evidencia-pulido-competicion/competition-report.json) | PASS: cuatro formatos, conectores iguales a fuentes persistidas, URL/foco, V/D/N, cierre bloqueado, fallo parcial de la segunda escritura, revisión obsoleta y reintento idéntico sin revisión adicional. Fecha no altera rivales, resultado ni tabla. Anónimo/ajeno denegados, incluso al repetir la acción capturada. |
| Huella deportiva | Eventos, partidos de liguilla y eliminatorias de los fixtures comparados conservan la huella `5c71626b774e803236754f92ff0d4732525b7b9c773eb413a17be76cf4eb5d0b` tras consultar/rediseñar. Las mutaciones de prueba usan otros eventos. |
| [Nombres máximos y vacíos](evidencia-pulido-competicion/long-empty-report.json) | PASS en 1440/390/720; nombres sin espacios al máximo, suplente, campeón administrativo y PNG. Sin eventos y sin solicitudes/calendario/cuadro. El listado vacío global se suministra mediante un adaptador aislado; no se borran registros para mostrarlo. |
| [Panel](evidencia-pulido-competicion/admin.json) | PASS: once superficies a 1440/390, nueve comprobaciones individuales, capitán, aprobación bloqueada y permisos. |
| [Consulta pública](evidencia-pulido-competicion/publico.json) | PASS: CR/Tokyo, ICS y reprogramación, imágenes y OG, siete superficies, privacidad de borradores, récords y nombres máximos. Galería y disponibilidad conservaron sus pruebas del PR #15. |
| [LIVE, OBS y exportación](evidencia-pulido-competicion/live.json) | PASS: marcador de trabajo separado de oficial, convocatoria/ausencia, visibilidad de clip, tres vistas OBS, PNG/PDF/CSV, revelación guardada y revocación del ayudante. |
| [Portada](evidencia-pulido-competicion/portada.json) | PASS en 360/390/768/1024/1440, filtros/URL/historial, 48 PNG HTTP 200, teclado, menú/Escape, movimiento reducido, 404 y zoom nativo 200 %. |
| Teclado, foco, contraste y zoom | Axe sin infracciones detectadas en superficies comprobadas; destinos del cuadro, editor, menú y diálogo con foco. Zoom nativo Edge 200 %, CSS zoom 1 y DPR 2 en cuatro pantallas de competición, además de portada; no es una prueba en teléfono físico ni certificación completa de accesibilidad. |

Las primeras ejecuciones detectaron y permitieron corregir guardados repetidos, foco demasiado temprano, textos largos y panel sin eventos. También hubo fallos del harness: selectores anteriores a las pestañas/estados de error, espera insuficiente del contenido y fixtures LIVE ya resueltos. Los registros PASS adjuntos corresponden a las ejecuciones corregidas; no se contabilizan esos fallos como éxitos.

Los ensayos usan Edge/Chromium y PostgreSQL reales con Auth/REST simulados, sesiones inválidas fuera del harness y datos ficticios. No prueban GoTrue, PKCE, correo o PostgREST real. Docker ahora responde, pero preparar/iniciar Supabase fue rechazado por revisión automática; [error y alternativa](pendientes-externos.md). No hay accesos de prueba en la aplicación publicada.

[Verificación de la demostración actualizada](evidencia-pulido-competicion/demo.json): siete bloques, páginas reales en 3220, doce parejas de capturas, descarga de campeón y ejemplos presentes en base/snapshot; sin restablecer la práctica.

## Repetir en el entorno aislado

La base, transporte, perfiles y claves de ensayo permanecen en `C:/Users/XT/Projects/cfp-registration-tests`, fuera de Git y de public. `knockout-fixture.mjs` exige host 127.0.0.1 y puerto 55439; no se ejecutan estos scripts contra producción.

```powershell
$env:CFP_TEST_DIR='C:/Users/XT/Projects/cfp-registration-tests'
node scripts/verify-competition-polish.mjs
node scripts/verify-long-empty-polish.mjs
node scripts/verify-integral.mjs
node scripts/capture-visual-comparison.mjs
```

La aplicación de ensayo usa 3210, la versión anterior 3212 y el adaptador sin eventos 3214. La demostración personal es independiente en 3220/8768, con su propio snapshot actualizado y práctica anterior conservada. No se restableció para esta entrega.

## Publicación y límites

El bloque se integra mediante rama y PR después de estas comprobaciones. La verificación final debe identificar el SHA integrado en main, Vercel Production Ready para ese SHA y respuesta del dominio público; el enlace de PR y commit se entrega al finalizar. Las comprobaciones anónimas de producción no se presentan como un recorrido administrativo real. Inscripciones y política reales permanecen cerradas; [privacidad y otras decisiones pendientes](pendientes-externos.md) no se activan desde este pulido.
