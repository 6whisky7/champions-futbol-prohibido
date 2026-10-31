"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Minus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCrest } from "@/lib/crests";
import { unresolved } from "@/lib/public-matches";
import { knockoutLabels } from "@/lib/knockout";
import {
  mergeLive,
  liveTime,
  type LiveDocument,
  type LiveAdmin,
  type LiveMatch,
} from "@/lib/live";
import { saveLive, saveLiveOfficial } from "@/app/live/actions";
import { LiveOwnerTools } from "@/components/live-owner-tools";

export function LiveWorkspace({
  initial,
  admin,
}: {
  initial: LiveDocument;
  admin?: LiveAdmin;
}) {
  const [doc, setDoc] = useState(initial),
    [selected, setSelected] = useState(
      initial.matches.find(
        (m) => m.active && m.home && m.away && unresolved(m.kind),
      )?.id ??
        initial.matches[0]?.id ??
        "",
    ),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [network, setNetwork] = useState(""),
    [denied, setDenied] = useState(false);
  const e = initial.event.id;
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined,
      controller: AbortController | undefined,
      generation = 0,
      stopped = false;
    async function poll(g: number) {
      if (stopped || document.hidden || g !== generation) return;
      controller = new AbortController();
      try {
        const r = await fetch(`/api/live/${e}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (r.status === 401 || r.status === 403) {
          setDenied(true);
          return;
        }
        if (!r.ok) throw Error();
        const next = (await r.json()) as LiveDocument;
        if (!stopped && g === generation) {
          setDoc((old) => mergeLive(old, next));
          setNetwork("");
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError")
          setNetwork(
            "No se pudo actualizar. Se conserva la última lectura; comprueba la conexión antes de actuar.",
          );
      } finally {
        if (!stopped && g === generation && !document.hidden)
          timer = setTimeout(() => void poll(g), 5000);
      }
    }
    const visibility = () => {
      generation++;
      clearTimeout(timer);
      controller?.abort();
      if (!document.hidden) void poll(generation);
    };
    void poll(generation);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [e]);
  const m =
    doc.matches.find((x) => x.id === selected) ?? doc.matches[0] ?? null;
  const apply = (next: LiveDocument) => setDoc((old) => mergeLive(old, next));
  async function act(
    action: string,
    p: Record<string, unknown>,
  ): Promise<boolean> {
    if (!m || busy || denied) return false;
    setBusy(true);
    setMessage("");
    try {
      const r = await saveLive(
        e,
        m.id,
        action,
        {
          reason:
            action === "score"
              ? "Operador actualizó el marcador de trabajo"
              : action === "call"
                ? "Convocatoria y sala disponible confirmadas por el propietario"
                : "Propietario reinició trabajo y espera",
          ...p,
        },
        m.working?.revision ?? 0,
      );
      if (r.error) {
        setMessage(r.error);
        return false;
      }
      if (r.data) apply(r.data);
      setMessage(
        action === "score"
          ? "Marcador de trabajo guardado. El resultado oficial no cambió."
          : "Preparación de trabajo guardada. El resultado oficial no cambió.",
      );
      return true;
    } catch {
      setMessage(
        "No se pudo guardar. Actualiza y comprueba el marcador antes de repetir.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function official(
    kind: string,
    absent: string | null,
    reason: string,
    confirmed: boolean,
  ) {
    if (!m || busy || denied) return;
    setBusy(true);
    setMessage("");
    try {
      const r = await saveLiveOfficial(
        e,
        m.id,
        kind,
        absent,
        m.official_revision,
        m.working?.revision ?? 0,
        reason,
        confirmed,
      );
      if (r.error) setMessage(r.error);
      else {
        if (r.data) apply(r.data);
        setMessage(
          "Resultado oficial confirmado. Consulta su clasificación y resolución.",
        );
        router.refresh();
      }
    } catch {
      setMessage(
        "No se pudo confirmar. Actualiza y comprueba el resultado antes de repetir.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (denied)
    return (
      <section className="admin-surface live-panel">
        <h2>Acceso no disponible</h2>
        <p>
          Tu sesión terminó o se revocó el permiso de este evento. No se
          permiten nuevas operaciones.
        </p>
        <Link href="/live/acceso">Volver al acceso LIVE</Link>
      </section>
    );
  if (!m)
    return (
      <section className="admin-surface live-panel">
        <h2>Partidos por preparar</h2>
        <p>
          El evento todavía no tiene un calendario o cuadro confirmado. LIVE no
          sortea ni incorpora participantes.
        </p>
        {doc.role === "owner" && (
          <Link href={`/admin/calendario?evento=${e}`}>
            Preparar calendario
          </Link>
        )}
      </section>
    );
  const editable = m.active && Boolean(m.home && m.away) && unresolved(m.kind),
    canScore = editable && !m.working?.needs_reset,
    hg = m.working?.hg ?? 0,
    ag = m.working?.ag ?? 0;
  return (
    <div className="live-workspace">
      <p className="admin-note">
        {doc.role === "owner"
          ? "Propietario · los resultados oficiales requieren una confirmación separada."
          : "Ayudante de este evento · solo puedes editar el marcador de trabajo."}
      </p>
      <nav className="admin-tabs" aria-label="Herramientas de LIVE">
        <a href="#live-score">Marcador</a>
        <a href="#live-wait">Espera</a>
        {doc.role === "owner" && (
          <>
            <a href="#live-presentation">OBS y exportación</a>
            <a href="#live-helpers">Ayudantes</a>
            <a href="#live-evidence">Clip</a>
          </>
        )}
      </nav>
      <label className="live-match-selector" htmlFor="live-match">
        Partido
        <select
          id="live-match"
          value={m.id}
          disabled={busy}
          onChange={(event) => {
            setSelected(event.target.value);
            setMessage("");
          }}
        >
          {doc.matches.map((x) => (
            <option key={x.id} value={x.id}>
              {x.phase_label} · {x.home_name ?? "Por definir"} contra{" "}
              {x.away_name ?? "Por definir"}
              {!unresolved(x.kind) ? " · Oficial" : ""}
            </option>
          ))}
        </select>
      </label>
      <section
        id="live-score"
        tabIndex={-1}
        className="admin-surface live-panel"
      >
        <h2>
          {unresolved(m.kind) ? "Marcador de trabajo" : "Resultado oficial"}
        </h2>
        <p>
          {m.phase_label} ·{" "}
          {unresolved(m.kind)
            ? "Provisional de LIVE; no suma puntos ni concede avances"
            : (knockoutLabels[m.kind] ?? "Resolución oficial")}
        </p>
        <div className="live-score-grid">
          {[0, 1].map((i) => (
            <div className="live-score-team" key={i}>
              {(i === 0 ? m.home_crest : m.away_crest) && (
                <Image
                  src={getCrest((i === 0 ? m.home_crest : m.away_crest)!).src}
                  alt=""
                  width={88}
                  height={88}
                />
              )}
              <h3>
                {(i === 0 ? m.home_name : m.away_name) ??
                  "Participante por definir"}
              </h3>
              <strong>
                {unresolved(m.kind)
                  ? i === 0
                    ? hg
                    : ag
                  : ((i === 0 ? m.hg : m.ag) ?? "—")}
              </strong>
              <div className="live-goal-controls">
                <Button
                  variant="outline"
                  aria-label={`Quitar gol a ${(i === 0 ? m.home_name : m.away_name) ?? "equipo"}`}
                  disabled={busy || !canScore || (i === 0 ? hg : ag) === 0}
                  onClick={() =>
                    void act("score", {
                      hg: i === 0 ? hg - 1 : hg,
                      ag: i === 1 ? ag - 1 : ag,
                    })
                  }
                >
                  <Minus />
                </Button>
                <Button
                  aria-label={`Añadir gol a ${(i === 0 ? m.home_name : m.away_name) ?? "equipo"}`}
                  disabled={busy || !canScore || (i === 0 ? hg : ag) >= 99}
                  onClick={() =>
                    void act("score", {
                      hg: i === 0 ? hg + 1 : hg,
                      ag: i === 1 ? ag + 1 : ag,
                    })
                  }
                >
                  <Plus />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {editable && (
          <Button
            variant="outline"
            disabled={busy || !canScore}
            onClick={() => void act("score", { hg: 0, ag: 0 })}
          >
            Poner trabajo en 0–0
          </Button>
        )}
        {editable && Math.abs(hg - ag) >= 4 && (
          <p className="live-goal-warning" role="status">
            {Math.abs(hg - ag) === 4
              ? "Ventaja de cuatro goles. Comprueba si terminó el partido y confirma el resultado oficial."
              : "La diferencia supera cuatro. Corrige el marcador antes de registrar el resultado deportivo."}{" "}
            Este aviso no guarda un resultado.
          </p>
        )}
        {m.working?.needs_reset && editable && (
          <p role="alert">
            El partido oficial cambió. El propietario debe preparar de nuevo el
            trabajo; la convocatoria anterior quedó invalidada.
          </p>
        )}
        <p role="status">{message}</p>
        <p role="alert">{network}</p>
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => {
            try {
              const r = await fetch(`/api/live/${e}`, { cache: "no-store" });
              if (!r.ok) throw Error();
              apply(await r.json());
              setNetwork("");
            } catch {
              setNetwork("No se pudo actualizar. Revisa la conexión.");
            }
          }}
        >
          <RefreshCw /> Actualizar lectura
        </Button>
      </section>
      <WaitControls
        key={m.id}
        now={doc.now}
        match={m}
        owner={doc.role === "owner"}
        busy={busy}
        editable={editable}
        act={act}
        official={official}
      />
      {doc.role === "owner" && (
        <section
          id="live-presentation"
          tabIndex={-1}
          className="admin-surface live-panel"
        >
          <h2>Presentación pública</h2>
          <p>
            OBS recibe solo datos públicos. El marcador provisional se
            identifica como trabajo; no muestra cuentas de ayudantes ni notas.
          </p>
          <div className="live-obs-links">
            {["marcador", "clasificacion", "cuadro"].map((view) => (
              <CopyObsLink
                key={view}
                href={`/obs/${e}/${view}${view === "marcador" ? `?partido=${m.id}` : ""}`}
                label={
                  view === "marcador"
                    ? "Marcador"
                    : view === "clasificacion"
                      ? "Clasificación"
                      : "Cuadro"
                }
              />
            ))}
          </div>
          <p className="admin-note">
            Clasificación muestra doce equipos por página: añade ?pagina=2 al
            enlace para la siguiente. Para mostrar solo una ronda del cuadro
            añade ?ronda=1; repesca es ronda 0. Ajusta el tamaño de la fuente de
            navegador en OBS a tu composición.
          </p>
          <div className="admin-tabs">
            <Link href={`/eventos/${e}/revelacion`}>
              Revelación pública del calendario guardado
            </Link>
            <Link href={`/eventos/${e}/exportar`}>
              Exportar clasificación y resultados
            </Link>
            <Link href={`/admin/resultados?evento=${e}`}>
              Ausencias dobles, repeticiones y correcciones oficiales
            </Link>
          </div>
        </section>
      )}
      {doc.role === "owner" && admin && (
        <LiveOwnerTools eventId={e} admin={admin} match={m} />
      )}
    </div>
  );
}
function CopyObsLink({ href, label }: { href: string; label: string }) {
  const [message, setMessage] = useState("");
  return (
    <div>
      <Link href={href} target="_blank" rel="noopener noreferrer">
        Abrir {label} para OBS
      </Link>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(location.origin + href);
            setMessage("Enlace copiado");
          } catch {
            setMessage(
              "Abre el enlace y copia la dirección desde el navegador.",
            );
          }
        }}
      >
        Copiar enlace de {label}
      </Button>
      <p role="status">{message}</p>
    </div>
  );
}
function WaitControls({
  now,
  match: m,
  owner,
  busy,
  editable,
  act,
  official,
}: {
  now: string;
  match: LiveMatch;
  owner: boolean;
  busy: boolean;
  editable: boolean;
  act: (action: string, p: Record<string, unknown>) => Promise<boolean>;
  official: (
    kind: string,
    absent: string | null,
    reason: string,
    confirmed: boolean,
  ) => Promise<void>;
}) {
  const [clock, setClock] = useState<number | null>(() => Date.parse(now)),
    [room, setRoom] = useState(false),
    [kind, setKind] = useState("sport"),
    [absent, setAbsent] = useState(""),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const offset = useRef(0);
  useEffect(() => {
    offset.current = Date.parse(now) - Date.now();
    const tick = () => {
      if (!document.hidden) setClock(Date.now() + offset.current);
    };
    tick();
    if (!m.working?.called_at) return;
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [now, m.working?.called_at]);
  const remaining =
      clock === null ? null : liveTime(m.working?.called_at, clock),
    timer =
      remaining === null
        ? m.working?.called_at
          ? "Preparando reloj de espera…"
          : "Sin convocatoria activa"
        : `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  return (
    <section id="live-wait" tabIndex={-1} className="admin-surface live-panel">
      <h2>Espera desde la convocatoria</h2>
      <p
        className={`live-wait-clock${m.working?.called_at ? "" : " is-inactive"}`}
        aria-live="off"
      >
        {timer}
      </p>
      <p>
        Son cinco minutos de espera al convocar con sala disponible. No es el
        tiempo de juego y no se inicia al abrir esta página.
      </p>
      {owner && editable && (
        <>
          <label className="live-confirm">
            <input
              type="checkbox"
              checked={room}
              onChange={(e) => setRoom(e.target.checked)}
              disabled={busy}
            />{" "}
            He convocado este partido con la sala disponible.
          </label>
          <div className="admin-tabs">
            <Button
              disabled={busy || !room}
              onClick={async () => {
                if (await act("call", { room_ready: true })) setRoom(false);
              }}
            >
              Convocar e iniciar espera de 5:00
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void act("reset", {})}
            >
              Reiniciar trabajo y espera
            </Button>
          </div>
          <p className="admin-note">
            Convocar o reiniciar pone el trabajo en 0–0. No cambia el resultado
            oficial.
          </p>
          <h3>Confirmar una resolución oficial</h3>
          <form
            className="event-form"
            onSubmit={(e) => {
              e.preventDefault();
              void official(
                kind,
                kind === "absence" ? absent : null,
                reason,
                confirmed,
              );
            }}
          >
            <label htmlFor="live-resolution">Decisión</label>
            <select
              id="live-resolution"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setConfirmed(false);
              }}
            >
              <option value="sport">
                Resultado deportivo del marcador de trabajo
              </option>
              <option value="absence">Ausencia individual · derrota 3–0</option>
            </select>
            {kind === "absence" && (
              <>
                <label htmlFor="live-absent">Equipo ausente</label>
                <select
                  id="live-absent"
                  required
                  value={absent}
                  onChange={(e) => setAbsent(e.target.value)}
                >
                  <option value="">Selecciona expresamente el equipo</option>
                  <option value={m.home!}>{m.home_name}</option>
                  <option value={m.away!}>{m.away_name}</option>
                </select>
                <p>
                  {remaining === 0
                    ? "La espera terminó. Comprueba que el equipo sigue sin reunir dos jugadores y no hay posposición autorizada."
                    : "La base impide registrar esta ausencia hasta cumplir cinco minutos desde una convocatoria válida."}
                </p>
              </>
            )}
            <label htmlFor="live-official-reason">
              Motivo de la decisión (privado)
            </label>
            <textarea
              id="live-official-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={3}
              maxLength={1000}
              required
            />
            <label className="live-confirm">
              <input
                type="checkbox"
                required
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />{" "}
              He comprobado el desenlace y quiero guardar esta resolución
              oficial.
            </label>
            <button
              className="action-link"
              disabled={
                busy ||
                !confirmed ||
                reason.trim().length < 3 ||
                !m.working ||
                m.working.needs_reset ||
                (kind === "absence" && (remaining !== 0 || !absent))
              }
            >
              {kind === "absence"
                ? "Confirmar ausencia y guardar 3–0"
                : "Confirmar resultado deportivo oficial"}
            </button>
          </form>
        </>
      )}
      {!owner && (
        <p>
          El propietario controla convocatoria, temporizador y resoluciones
          oficiales.
        </p>
      )}
      {!editable && (
        <p>
          Este partido no admite cambios de trabajo. Las correcciones oficiales
          requieren las operaciones administrativas correspondientes.
        </p>
      )}
    </section>
  );
}
