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
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import { signOut } from "@/app/admin/actions";
import type { TournamentEvent } from "@/lib/events";
const sections = [
  { label: "Torneo", path: "/admin", icon: LayoutDashboard, group: "Resumen" },
  {
    label: "Eventos",
    path: "/admin/eventos",
    icon: CalendarDays,
    group: "Preparar",
  },
  {
    label: "Inscripciones y equipos",
    path: "/admin/solicitudes",
    icon: Inbox,
    group: "Preparar",
    counter: "pending",
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
    group: "Herramientas",
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
  { label: "LIVE", path: "/admin/live", icon: Radio, group: "Herramientas" },
  { label: "Privacidad y conservación", path: "/admin/privacidad", icon: ShieldCheck, group: "Herramientas" },
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
  const requested = params.getAll("evento");
  const event =
    events.find(
      (e) =>
        e.id ===
        (path.startsWith("/admin/eventos/")
          ? path.split("/")[3]
          : requested.length === 1 ? requested[0] : undefined),
    );
  const [counts, setCounts] = useState<{
    evento: string;
    values: Record<string, number>;
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
            setCounts({ evento: values.evento, values });
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
  const current = sections.find((s) => s.path === path);
  const title = path.endsWith("/nuevo")
    ? "Crear evento"
    : path.startsWith("/admin/eventos/")
      ? event?.name ?? "Evento"
      : current?.label ?? "Eventos";
  function href(p: string) {
    if (p === "/admin" && event) return "/admin/eventos/" + event.id;
    const q = new URLSearchParams();
    if (event) q.set("evento", event.id);
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
        <Link className="admin-brand" href={href("/admin")}>
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
                      href={href(s.path)}
                      aria-current={
                        current?.label === s.label || (s.path === "/admin" && Boolean(event) && path === "/admin/eventos/" + event?.id) ? "page" : undefined
                      }
                      onClick={() => setMenu(false)}
                    >
                      <s.icon size={21} />
                      <span>{s.label}</span>
                      {s.counter && counts && event && counts.evento === event.id && (
                        <span className="admin-nav-count">
                          <span className="sr-only">
                            Cantidad:
                          </span>
                          {counts.values[s.counter]}
                        </span>
                      )}
                    </Link>
                  ))}
              </div>
            ))}
            <details className="guided-secondary-nav">
              <summary>Herramientas</summary>
              <div className="admin-nav-group">
                {sections.filter((item) => item.group === "Herramientas").map((item) => (
                  <Link key={item.path} href={href(item.path)} aria-current={path === item.path ? "page" : undefined}
                    onClick={() => setMenu(false)}><item.icon size={21} />{item.label}</Link>
                ))}
              </div>
            </details>
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
              const id = e.target.value;
              if (!id) return;
              if (path === "/admin" || path.startsWith("/admin/eventos") || path === "/admin/privacidad") {
                router.push("/admin/eventos/" + id);
                return;
              }
              q.set("evento", id);
              ["partido", "jornada", "solicitud"].forEach((k) => q.delete(k));
              router.push(
                (path.startsWith("/admin/eventos/") ? "/admin/eventos" : path) +
                  "?" +
                  q,
              );
            }}
          >
            <option value="" disabled>{events.length ? "Selecciona un evento" : "Sin eventos todavía"}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.is_test === null ? "ANTERIOR · " : e.is_test ? "PRUEBA · " : ""}{e.name}
              </option>
            ))}
          </select>
          {event && (
            <div className="event-status-chips">
              <Badge variant="outline">
                {event.status === "draft" ? "Borrador" : event.status === "published" ? "Publicado" : event.status === "finished" ? "Finalizado" : "Cancelado"}
              </Badge>
              <Badge variant="outline">
                Inscripciones{" "}
                {event.registration_status === "open" ? "abiertas" : "cerradas"}
              </Badge>
            </div>
          )}
        </section>
        <header className="admin-page-heading">
          <div>
            <h1>{title}</h1>
            {event && title !== event.name && <p className="guided-event-name">{event.name}</p>}
          </div>
          {path === "/admin/eventos" && (
            <Link className="action-link" href="/admin/eventos/nuevo"><Plus size={20} />Crear evento</Link>
          )}
        </header>
        <div id="admin-content" tabIndex={-1}>
          {children}
        </div>
      </div>
    </div>
  );
}
