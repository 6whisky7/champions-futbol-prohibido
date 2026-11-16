import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
export const metadata = {
  title: "Privacidad y contacto | Champions Fútbol Prohibido",
};
export default async function Privacy() {
  const client = await createClient();
  const { data: policy, error } = await client.rpc("cfp_registration_status");
  const enabled = !error && policy?.enabled === true;
  return (
    <>
      <SiteHeader />
      <main className="management-page page-width">
        <Link href="/eventos">Volver a los eventos</Link>
        <h1>Privacidad y contacto</h1>
        <p>
          Responsable indicado por el organizador: <strong>Whisky</strong>. Este
          aviso explica el uso previsto de los datos. {enabled ? `Versión activa ${policy.version}.` : "El propietario todavía no ha activado esta versión."} Su publicación no abre las inscripciones de ningún evento. La identificación legal completa del responsable y el canal formal de notificación todavía requieren revisión; esta página no afirma cumplimiento legal.
        </p>
        <section>
          <h2>Qué datos usamos</h2>
          <p>
            Nombre del equipo, escudo, número opcional de cada jugador, usuarios de Roblox y
            TikTok, integrantes, capitán, solicitud, estado, confirmaciones y
            verificaciones administrativas. Se usan para recibir y revisar la
            inscripción, organizar equipos y partidos, comunicarse sobre la
            solicitud y conservar el historial de la competición. El formulario
            no pide identificaciones oficiales ni fechas de nacimiento completas.
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
            Si un evento oficial está publicado: equipo, escudo y usuarios Roblox necesarios para identificar la plantilla,
            estado público de la solicitud, calendario, resultados,
            clasificación e historial del campeón. Los datos de TikTok,
            solicitudes privadas, notas, motivos y controles de revisión no se
            publican. Los marcadores de trabajo se identifican como
            provisionales. Un evento de prueba nunca aparece en las vistas
            públicas. Los clips solo aparecen como enlaces si el organizador
            elige publicarlos; el vídeo se abre en la plataforma externa.
          </p>
          <h2>Qué queda privado</h2>
          <p>
            TikTok y número opcional de los integrantes, notas, motivos e historial de revisión.
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
            Puedes solicitar acceso, corrección o eliminación. Indica el evento,
            el equipo y qué necesitas; el organizador verificará la solicitud
            con información proporcional al caso. Un participante menor puede
            pedir ayuda a su responsable legal. No envíes documentos de
            identidad ni tu fecha de nacimiento completa por iniciativa propia.
          </p>
          <p>
            Durante una competición, revisar una retirada de datos no equivale a
            sustituir equipos ni a cambiar automáticamente resultados oficiales.
          </p>
        </section>
        <section>
          <h2>Conservación y eliminación</h2>
          <p>
            El plazo operativo es de seis meses: desde el rechazo o vencimiento
            para esas solicitudes, y desde la finalización o cancelación de la
            edición para equipos aprobados, en espera y solicitudes que sigan
            activas. Al vencer se anonimizan los usuarios Roblox, TikTok y números de los jugadores de la
            solicitud y sus copias de historial. El nombre del equipo, escudo,
            partidos, resultados, clasificación y datos necesarios para mostrar
            al campeón se conservan sin esos identificadores. Las copias
            técnicas de proveedores pueden tener plazos separados.
          </p>
        </section>
        <section>
          <h2>Participación de menores</h2>
          <p>
            CFP no establece una edad mínima propia. Se deben respetar la ley y
            las condiciones de Roblox y TikTok. Se permite participación de
            menores con medidas proporcionadas y autorización de su responsable
            legal. El formulario no recopila documentos de identidad ni fecha
            de nacimiento completa.
          </p>
          <p>
            La aplicación todavía no registra una verificación individual del
            responsable legal. La declaración del capitán no acredita el
            consentimiento de los demás integrantes. Antes de aceptar una
            inscripción de un menor, el organizador debe comprobar y conservar
            de forma restringida la autorización por un medio proporcional; no
            debe presentarse una verificación externa como función de este sitio.
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
