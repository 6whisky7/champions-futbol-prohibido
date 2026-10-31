import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata = {
  title: "Privacidad y contacto | Champions Fútbol Prohibido",
};
export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <Link href="/eventos">Volver a los eventos</Link>
        <h1>Privacidad y contacto</h1>
        <p>
          Responsable indicado por el organizador: <strong>Whisky</strong>. Esta
          página explica el funcionamiento y las decisiones aprobadas. El aviso
          definitivo y el procedimiento de autorización todavía no están
          activos. Las inscripciones reales permanecen cerradas.
        </p>
        <section>
          <h2>Qué datos usamos</h2>
          <p>
            Nombre del equipo, escudo, número opcional y usuarios de Roblox y
            TikTok de sus integrantes. Se usan para revisar requisitos,
            confirmar al capitán, organizar partidos y conservar resultados de
            la edición.
          </p>
          <p>
            Para limitar envíos repetidos se calcula una huella temporal de la
            conexión. No se guarda la dirección IP en las solicitudes; los
            contadores de seguridad caducan al terminar su ventana de hasta una
            hora y se purgan cada quince minutos o al recibir nuevos envíos. Los
            registros técnicos de los proveedores tienen su propia gestión.
          </p>
        </section>
        <section>
          <h2>Qué se publica</h2>
          <p>
            Equipo, escudo, número voluntario, plantilla Roblox, estado público
            de la solicitud, partidos, clasificación y campeón. Los marcadores
            de trabajo se identifican como provisionales. Los clips solo
            aparecen como enlaces si el organizador elige publicarlos; el vídeo
            se abre en la plataforma externa.
          </p>
          <h2>Qué queda privado</h2>
          <p>
            TikTok de los integrantes, notas, motivos e historial de revisión.
            El acceso a estos datos está reservado al propietario. Un ayudante
            necesita una cuenta verificada y una asignación expresa por evento;
            solo puede editar su marcador de trabajo. Su correo y el historial
            de permisos no se publican.
          </p>
        </section>
        <section>
          <h2>Corrección o retirada</h2>
          <p>
            Contacta con{" "}
            <a
              href="https://www.tiktok.com/@whiskyzc"
              target="_blank"
              rel="noopener noreferrer"
            >
              @whiskyzc en TikTok
            </a>
            . Si no puedes enviarle un mensaje directo, escribe a{" "}
            <a href="mailto:isaacarias053@gmail.com">isaacarias053@gmail.com</a>
            .
          </p>
          <p>
            Indica el evento, el equipo y qué necesitas corregir o retirar. Se
            verificará quién solicita el cambio con la información necesaria
            para ese caso. No envíes documentos de identidad ni tu fecha de
            nacimiento completa por iniciativa propia.
          </p>
          <p>
            Durante una competición, revisar una retirada de datos no equivale a
            sustituir equipos ni a cambiar automáticamente resultados oficiales.
          </p>
        </section>
        <section>
          <h2>Conservación y eliminación</h2>
          <p>
            Whisky aprobó provisionalmente retirar los datos privados de
            solicitudes rechazadas después de 30 días y los datos internos de
            cada edición después de 90 días desde su finalización. El historial
            deportivo público se conservaría mientras la competición permanezca
            publicada. Estos plazos requieren revisión legal y un procedimiento
            seguro que contemple incidencias, auditoría y copias de seguridad.
            Todavía no hay borrado automático ni se han eliminado registros.
          </p>
        </section>
        <section>
          <h2>Participación de menores</h2>
          <p>
            CFP no establece una edad mínima propia. Se deben respetar la ley y
            las condiciones de Roblox y TikTok. Whisky aprobó permitir menores
            con autorización verificable de su responsable legal; el
            procedimiento está en preparación y no está habilitado.
          </p>
          <p>
            La confirmación individual de los integrantes todavía está en
            revisión. Una declaración del capitán no acredita su consentimiento
            ni la autorización de sus responsables legales. Antes de abrir se
            debe completar esa verificación y el aviso, incluida la
            identificación legal del responsable. No se solicitan fechas de
            nacimiento completas ni documentos de identidad como solución
            provisional.
          </p>
        </section>
        <details>
          <summary>
            Fuentes oficiales consultadas para preparar el aviso
          </summary>
          <p>
            Se consultaron la{" "}
            <a href="https://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/L/2010-2019/2010-2014/2011/1153F/DCEF7.HTML">
              Ley 8968 de Costa Rica
            </a>
            , las{" "}
            <a href="https://www.prodhab.go.cr/preguntasfrecuentes.aspx">
              orientaciones de PRODHAB
            </a>{" "}
            y la{" "}
            <a href="https://www.pgrweb.go.cr/DOCS/NORMAS/1/VIGENTE/L/2020-2029/2020-2024/2022/17CE2/151A54.HTML">
              Ley 10238 sobre imagen, voz y datos personales de menores
            </a>
            . Las decisiones pendientes no se convierten en reglas del torneo
            por incluir estas referencias.
          </p>
        </details>
      </main>
      <SiteFooter />
    </>
  );
}
