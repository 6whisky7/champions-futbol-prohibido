"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { TeamIdentity } from "./team-identity";
import { matchChoiceStatus, type MatchChoice } from "@/lib/admin-match-choices";

const stages = [["all", "Todos"], ["league", "Liguilla"], ["knockout", "Eliminatorias"]] as const;
const statuses = [["pending", "Pendientes"], ["live", "En vivo"], ["finished", "Finalizados"]] as const;
const hour = new Intl.DateTimeFormat("es-CR", { timeStyle: "short", timeZone: "America/Costa_Rica" });
const searchKey = (input: string) => input.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es-CR");

export function AdminMatchPicker({
  matches, selected, disabled, onSelect,
}: {
  matches: MatchChoice[];
  selected?: string | null;
  disabled: boolean;
  onSelect: (match: MatchChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<(typeof stages)[number][0]>("all");
  const [status, setStatus] = useState<(typeof statuses)[number][0]>("pending");
  const [openedAt, setOpenedAt] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const pending = matches.filter((match) => matchChoiceStatus(match) === "pending" && match.home && match.away);
  const upcoming = pending.filter((match) => match.scheduled_at && Date.parse(match.scheduled_at) >= openedAt)
    .sort((a, b) => Date.parse(a.scheduled_at!) - Date.parse(b.scheduled_at!));
  const next = upcoming[0] ?? pending[0];

  const terms = searchKey(query.trim()).split(/\s+/).filter(Boolean);
  const groups = new Map<string, MatchChoice[]>();
  if (open) for (const match of matches) {
    if ((stage !== "all" && match.stage !== stage) || matchChoiceStatus(match) !== status) continue;
    const searchable = searchKey(match.homeName + " " + match.awayName + " " + match.group);
    if (!terms.every((term) => searchable.includes(term))) continue;
    const group = groups.get(match.group) ?? [];
    group.push(match);
    groups.set(match.group, group);
  }
  const highlight = status === "pending" && stage === "all" && !query.trim() ? next?.id : selected;
  useEffect(() => {
    if (!open || !list.current) return;
    const active = list.current.querySelector('[data-current="true"]');
    if (active) active.scrollIntoView({ block: "nearest" });
  }, [open, highlight]);

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (value) {
        setOpenedAt(Date.now());
        setQuery("");
        setStage("all");
        setStatus(matches.some((match) => matchChoiceStatus(match) === "pending") ? "pending"
          : matches.some((match) => matchChoiceStatus(match) === "live") ? "live" : "finished");
      }
      setOpen(value);
    }}>
      <DialogTrigger render={<button className="trophy-button match-picker-trigger" disabled={disabled} />}>
        <Search size={17} aria-hidden="true" /> Buscar partido
      </DialogTrigger>
      <DialogContent className="match-picker" initialFocus={search}>
        <DialogTitle>Buscar partido</DialogTitle>
        <div className="match-picker-controls">
          <label className="sr-only" htmlFor="match-picker-search">Buscar por equipo o jornada</label>
          <input ref={search} id="match-picker-search" type="search" value={query}
            placeholder="Equipo o jornada" onChange={(event) => setQuery(event.target.value)} />
          <div className="match-picker-filters" role="group" aria-label="Fase">
            {stages.map(([key, label]) => (
              <button type="button" key={key} aria-pressed={stage === key} onClick={() => setStage(key)}>{label}</button>
            ))}
          </div>
          <div className="match-picker-filters" role="group" aria-label="Estado">
            {statuses.map(([key, label]) => (
              <button type="button" key={key} aria-pressed={status === key} onClick={() => setStatus(key)}>{label}</button>
            ))}
          </div>
        </div>
        <div ref={list} className="match-picker-scroll" role="region" aria-label="Partidos encontrados" tabIndex={0}>
          {groups.size ? Array.from(groups, ([name, group]) => (
            <section className="match-picker-group" key={name} aria-label={name}>
              <h3>{name}</h3>
              <ul>
                {group.map((match) => {
                  const live = matchChoiceStatus(match) === "live";
                  const played = matchChoiceStatus(match) === "finished";
                  return (
                    <li key={match.id}>
                      <button type="button" className="match-picker-row" data-current={match.id === highlight || undefined}
                        aria-current={match.id === highlight || undefined} disabled={disabled}
                        onClick={() => { setOpen(false); onSelect(match); }}>
                        <span className="match-picker-teams">
                          <TeamIdentity name={match.homeName} crest={match.homeCrest} />
                          <span className="match-picker-versus">vs</span>
                          <TeamIdentity name={match.awayName} crest={match.awayCrest} />
                        </span>
                        <span className="match-picker-state">
                          {live ? <span className="match-picker-live" title="Marcador de trabajo activo">En vivo</span>
                            : played ? (match.hg === null || match.ag === null ? match.decision ?? "Finalizado" : <strong>{match.hg} – {match.ag}</strong>)
                              : match.scheduled_at ? hour.format(new Date(match.scheduled_at)) : match.decision ?? "Sin horario"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )) : <p role="status" className="match-picker-empty">
            {query.trim() ? "No encontramos partidos con esta búsqueda." :
              status === "live" ? "No hay partidos con marcador de trabajo activo." : "No hay partidos con estos filtros."}
          </p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
