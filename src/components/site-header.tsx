"use client";

import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const links = [
  ["/#torneo", "El torneo"],
  ["/#escudos", "Escudos"],
  ["/#formato", "Cómo se juega"],
  ["/#comunidad", "Comunidad"],
] as const;

export function SiteHeader() {
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
            <a key={href} href={href} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
