"use client";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Inbox,
  Users,
  ListOrdered,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Plus,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhaseBar } from "./phase-bar";
import { Badge } from "./ui/badge";
import type { PhaseState } from "@/lib/event-phase";
import { signOut } from "@/app/admin/actions";
import type { TournamentEvent } from "@/lib/events";
const sections = [
  { label: "Resumen", path: "/admin", icon: LayoutDashboard, group: "Resumen" },
  {
    label: "Eventos",
    path: "/admin/eventos",
    icon: CalendarDays,
    group: "Preparar",
  },
  {
    label: "Solicitudes",
    path: "/admin/solicitudes",
    view: "pending",
    icon: Inbox,
    group: "Preparar",
    counter: "pending",
  },
  {
    label: "Equipos",
    path: "/admin/solicitudes",
    view: "approved",
    icon: Users,
    group: "Preparar",
    counter: "approved",
  },
  {
    label: "Lista de espera",
    path: "/admin/solicitudes",
    view: "waiting",
    icon: ListOrdered,
    group: "Preparar",
    counter: "waiting",
  },
  {
    label: "Calendario",
    path: "/admin/calendario",
    icon: CalendarDays,
    group: "Competición",
  },
  {
    label: "Resultados",
    path: "/admin/resultados",
    icon: ListOrdered,
    group: "Competición",
    counter: "results",
  },
  {
    label: "Clasificación",
    path: "/admin/clasificacion",
    icon: Users,
    group: "Competición",
  },
  {
    label: "Eliminatorias",
    path: "/admin/eliminatorias",
    icon: ListOrdered,
    group: "Competición",
  },
  { label: "LIVE", path: "/admin/live", icon: Radio, group: "Competición" },
];
export function AdminShell({
  events,
  children,
}: {
  events: TournamentEvent[];
  children: React.ReactNode;
}) {
  const path = usePathname(),
    params = useSearchParams(),
    router = useRouter();
  const [menu, setMenu] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const event =
    events.find(
      (e) =>
        e.id ===
        (path.startsWith("/admin/eventos/")
          ? path.split("/").at(-1)
          : params.get("evento")),
    ) ?? events[0];
  const [counts, setCounts] = useState<{
    evento: string;
    values: Record<string, number>;
    phase: PhaseState;
  } | null>(null);
  useEffect(() => {
    if (!event) return;
    let controller: AbortController;
    const load = () => {
      controller?.abort();
      controller = new AbortController();
      const requestController = controller;
      fetch(`/api/admin/contadores?evento=${event.id}`, {
        signal: controller.signal,
        cache: "no-store",
      })
        .then(async (r) => {
          if (!r.ok) throw Error();
          return r.json();
        })
        .then((values) => {
          if (!requestController.signal.aborted)
            setCounts({ evento: values.evento, values, phase: values.phase });
        })
        .catch(() => {});
    };
    load();
    window.addEventListener("cfp-admin-refresh", load);
    return () => {
      controller?.abort();
      window.removeEventListener("cfp-admin-refresh", load);
    };
  }, [event]);
  const view = params.get("vista") ?? "pending";
  const current =
    sections.find((s) => s.path === path && (!s.view || s.view === view)) ??
    (path === "/admin/solicitudes"
      ? sections.find((s) => s.label === "Solicitudes")!
      : sections.find((s) => s.label === "Eventos")!);
  const title = path.endsWith("/nuevo")
    ? "Crear evento"
    : path.startsWith("/admin/eventos/")
      ? "Configurar evento"
      : current.label;
  function href(p: string, v?: string) {
    const q = new URLSearchParams();
    if (event) q.set("evento", event.id);
    if (v) q.set("vista", v);
    return p + (q.size ? "?" + q : "");
  }
  return (
    <div className="admin-workspace">
      <a className="admin-skip" href="#admin-content">
        Saltar al contenido
      </a>
      <aside
        className="admin-sidebar"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setMenu(false);
            trigger.current?.focus();
          }
        }}
      >
        <Link className="admin-brand" href="/admin">
          <span className="brand-pennant">CFP</span>
          <span>
            Champions<strong>Fútbol Prohibido</strong>
          </span>
        </Link>
        <Button
          ref={trigger}
          variant="outline"
          className="admin-menu-toggle"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-controls="admin-navigation"
        >
          {menu ? <X /> : <Menu />} Menú
        </Button>
        <div
          id="admin-navigation"
          className={menu ? "admin-navigation is-open" : "admin-navigation"}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setMenu(false);
              trigger.current?.focus();
            }
          }}
        >
          <nav aria-label="Administración">
            {["Resumen", "Preparar", "Competición"].map((group) => (
              <div
                className="admin-nav-group"
                role="group"
                aria-label={group}
                key={group}
              >
                {group !== "Resumen" && <p>{group}</p>}
                {sections
                  .filter((s) => s.group === group)
                  .map((s) => (
                    <Link
                      key={s.label}
                      href={href(s.path, s.view)}
                      aria-current={
                        current.label === s.label ? "page" : undefined
                      }
                      onClick={() => setMenu(false)}
                    >
                      <s.icon size={21} />
                      <span>{s.label}</span>
                      {s.counter && counts && event && counts.evento === event.id && (
                        <span className="admin-nav-count">
                          <span className="sr-only">
                            {s.counter === "results"
                              ? "Partidos por resolver: "
                              : "Cantidad: "}
                          </span>
                          {counts.values[s.counter]}
                        </span>
                      )}
                    </Link>
                  ))}
              </div>
            ))}
          </nav>
          <div className="admin-sidebar-bottom">
            <Link href="/" target="_blank">
              <ExternalLink size={19} /> Ver web pública
            </Link>
            <form action={signOut}>
              <Button variant="ghost" type="submit">
                <LogOut size={19} /> Cerrar sesión
              </Button>
            </form>
            <p>Administración del propietario</p>
          </div>
        </div>
      </aside>
      <div className="admin-body">
        <section
          className="admin-context"
          aria-label="Contexto del evento activo"
        >
          <label htmlFor="workspace-event">Evento activo</label>
          <select
            id="workspace-event"
            value={event?.id ?? ""}
            disabled={!events.length}
            onChange={(e) => {
              const q = new URLSearchParams(params);
              q.set("evento", e.target.value);
              ["partido", "jornada", "solicitud"].forEach((k) => q.delete(k));
              router.push(
                (path.startsWith("/admin/eventos/") ? "/admin/eventos" : path) +
                  "?" +
                  q,
              );
            }}
          >
            {!events.length && <option value="">Sin eventos todavía</option>}
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          {event && (
            <div className="event-status-chips">
              <Badge variant="outline">
                {event.status === "draft" ? "Borrador" : "Publicado"}
              </Badge>
              <Badge variant="outline">
                Inscripciones{" "}
                {event.registration_status === "open" ? "abiertas" : "cerradas"}
              </Badge>
            </div>
          )}
        </section>
        {counts?.evento === event?.id && counts?.phase && (
          <PhaseBar phase={counts.phase} />
        )}
        <header className="admin-page-heading">
          <div>
            <h1>{title}</h1>
            <p>
              {path === "/admin"
                ? "El estado de tu competición y lo que necesita atención."
                : path.startsWith("/admin/eventos")
                  ? "Fechas, formato y apertura. Publicar y abrir son decisiones distintas."
                  : [
                        "/admin/calendario",
                        "/admin/resultados",
                        "/admin/clasificacion",
                        "/admin/eliminatorias",
                        "/admin/live",
                      ].includes(path)
                    ? path === "/admin/live"
                      ? "Marcador de trabajo, espera, OBS y permisos limitados por evento."
                      : path === "/admin/eliminatorias"
                        ? "Cuadro fijo, avance de ganadores y cierre del evento."
                        : "Rivales, resultados oficiales y posiciones de la liguilla."
                    : "Revisa las plantillas y resuelve cada solicitud con sus requisitos."}
            </p>
          </div>
          {path === "/admin/eventos" ? (
            <Link className="action-link" href="/admin/eventos/nuevo">
              <Plus size={20} />
              Crear evento
            </Link>
          ) : (
            event &&
            path !== "/admin" &&
            !path.endsWith("/nuevo") && (
              <Link
                className="action-link"
                href={
                  path === "/admin/live"
                    ? href("/admin/resultados")
                    : path === "/admin/calendario"
                      ? "#league-calendar"
                      : path === "/admin/clasificacion"
                        ? "#league-table"
                        : path === "/admin/eliminatorias"
                          ? "#ko-final"
                          : path === "/admin/resultados"
                            ? href("/admin/live")
                            : path === "/admin/solicitudes"
                              ? "#application-list"
                              : href("/admin/eventos")
                }
              >
                {path === "/admin/live"
                  ? "Resultados oficiales"
                  : path === "/admin/calendario"
                    ? "Ver jornada"
                    : path === "/admin/clasificacion"
                      ? "Ver clasificación"
                      : path === "/admin/eliminatorias"
                        ? "Ir a la final"
                        : path === "/admin/resultados"
                          ? "Abrir LIVE"
                          : path === "/admin/solicitudes"
                            ? "Consultar equipos"
                            : "Ver eventos"}
              </Link>
            )
          )}
        </header>
        <div id="admin-content" tabIndex={-1}>
          {children}
        </div>
      </div>
    </div>
  );
}
