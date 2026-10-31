"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const links = [
  ["/", "Inicio"],
  ["/eventos", "Eventos"],
  ["/#torneo", "El torneo"],
  ["/#escudos", "Escudos"],
  ["/como-se-juega", "Cómo se juega"],
  ["/campeones", "Campeones"],
  ["/#comunidad", "Comunidad"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [section, setSection] = useState("inicio");
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = ["inicio", "escudos", "torneo", "comunidad"];
    const update = () => {
      const line = window.scrollY + Math.max(130,window.innerHeight*.35);
      const active =
        ids
          .filter((id) => {
            const el = document.getElementById(id);
            return el && el.offsetTop <= line;
          })
          .at(-1) ?? "inicio";
      setSection(active);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", update);
    window.addEventListener('resize',update);
    const observer=new ResizeObserver(update);
    const main=document.querySelector('main');if(main)observer.observe(main);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener('resize',update);observer.disconnect();
    };
  }, [pathname]);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <div className="page-width header-inner">
        <Brand />
        <Button
          ref={trigger}
          className="menu-trigger"
          variant="ghost"
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <X aria-hidden="true" data-icon="inline-start" />
          ) : (
            <Menu aria-hidden="true" data-icon="inline-start" />
          )}
          {open ? "Cerrar" : "Menú"}
        </Button>
        <nav
          id="main-navigation"
          aria-label="Navegación principal"
          className={cn("main-nav", open && "is-open")}
        >
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              aria-current={
                href.includes("#")
                  ? pathname === "/" && section === href.split("#")[1]
                    ? "location"
                    : undefined
                  : href === "/"
                    ? pathname === "/" && section === "inicio"
                      ? "page"
                      : undefined
                    : pathname === href || pathname.startsWith(href + "/")
                      ? "page"
                      : undefined
              }
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
