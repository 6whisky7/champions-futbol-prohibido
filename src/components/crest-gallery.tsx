"use client";

import Image from "next/image";
import {
  useDeferredValue,
  useRef,
  useSyncExternalStore,
  ViewTransition,
} from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import type { Crest } from "@/lib/crests";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { NativeSelect, NativeSelectOption } from "./ui/native-select";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import { CrestDetail } from "./crest-detail";

type Props = { crests: Crest[]; categories: string[]; featuredIds: string[] };
const eventName = "crest-filters-change";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(eventName, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(eventName, onChange);
  };
}

function updateFilters(values: Record<string, string | null>, replace = false) {
  const url = new URL(window.location.href);
  Object.entries(values).forEach(([name, value]) =>
    value ? url.searchParams.set(name, value) : url.searchParams.delete(name),
  );
  window.history[replace ? "replaceState" : "pushState"](null, "", url);
  window.dispatchEvent(new Event(eventName));
}

export function CrestGallery({ crests, categories, featuredIds }: Props) {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const deferredSnapshot = useDeferredValue(snapshot);
  const controls = new URLSearchParams(snapshot);
  const results = new URLSearchParams(deferredSnapshot);
  const selectedLeague = categories.includes(controls.get("liga") ?? "")
    ? controls.get("liga")!
    : "Todos";
  const league = categories.includes(results.get("liga") ?? "")
    ? results.get("liga")
    : "Todos";
  const search = controls.get("buscar") ?? "";
  const query = normalize(results.get("buscar") ?? "");
  const requestedLimit = Number(results.get("mostrar") ?? 12);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(12, Math.min(48, requestedLimit))
    : 12;
  const ordered = [
    ...featuredIds.flatMap((id) => crests.filter((crest) => crest.id === id)),
    ...crests.filter((crest) => !featuredIds.includes(crest.id)),
  ];
  const filtered = ordered.filter(
    (crest) =>
      (league === "Todos" || crest.league === league) &&
      normalize(`${crest.club} ${crest.league} diseño ${crest.id}`).includes(
        query,
      ),
  );
  const visible = filtered.slice(0, limit);
  const searchInput = useRef<HTMLInputElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const chosen = crests.find((c) => c.id === controls.get("escudo"));
  const hasFilters = selectedLeague !== "Todos" || search.length > 0;

  function clearFilters() {
    updateFilters({ liga: null, buscar: null, mostrar: null });
    searchInput.current?.focus();
  }

  return (
    <div className="gallery" id="filtros">
      <FieldGroup className="gallery-controls">
        <Field>
          <FieldLabel htmlFor="crest-search">Buscar un escudo</FieldLabel>
          <Input
            ref={searchInput}
            id="crest-search"
            type="search"
            name="buscar"
            placeholder="Ejemplo: Saprissa o 45…"
            autoComplete="off"
            spellCheck={false}
            value={search}
            onChange={(event) =>
              updateFilters(
                { buscar: event.target.value || null, mostrar: null },
                true,
              )
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="crest-league">
            País o liga de inspiración
          </FieldLabel>
          <NativeSelect
            id="crest-league"
            name="liga"
            value={selectedLeague}
            onChange={(event) =>
              updateFilters({
                liga:
                  event.target.value === "Todos" ? null : event.target.value,
                mostrar: null,
              })
            }
          >
            <NativeSelectOption value="Todos">
              Todos los escudos
            </NativeSelectOption>
            {categories.map((item) => (
              <NativeSelectOption key={item} value={item}>
                {item}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {hasFilters ? (
          <Button
            variant="ghost"
            className="clear-filters"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        ) : null}
      </FieldGroup>
      <p
        className="gallery-count"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Mostrando{" "}
        <strong>
          {visible.length} de {filtered.length}
        </strong>{" "}
        escudos{league !== "Todos" ? ` · ${league}` : ""}
      </p>
      <div
        id="crest-grid"
        className="crest-grid"
        aria-busy={snapshot !== deferredSnapshot}
      >
        {visible.map((crest) => (
          <ViewTransition
            key={crest.id}
            default="none"
            enter="crest-enter"
            exit="crest-exit"
            update="crest-move"
          >
            <button
              type="button"
              onClick={(e) => {
                detailTrigger.current = e.currentTarget;
                updateFilters({ escudo: crest.id });
              }}
              className="crest-link"
              aria-label={`Ver diseño ${crest.id}, inspirado en ${crest.club}`}
            >
              <figure className="crest-tile">
                <div className="crest-art">
                  <Image
                    src={crest.src}
                    alt={`Escudo ${crest.id} inspirado en ${crest.club}`}
                    width={260}
                    height={260}
                    sizes="(max-width: 767px) 40vw, (max-width: 1023px) 26vw, 220px"
                  />
                </div>
                <figcaption>
                  <span className="crest-meta">
                    Diseño {crest.id} <ArrowUpRight aria-hidden="true" />
                  </span>
                  <span className="crest-reference">{crest.club}</span>
                  <span className="crest-league">{crest.league}</span>
                </figcaption>
              </figure>
            </button>
          </ViewTransition>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No encontramos ese escudo</EmptyTitle>
            <EmptyDescription>
              Prueba con otro club o número de diseño.
            </EmptyDescription>
          </EmptyHeader>
          <Button onClick={clearFilters}>Ver todos los escudos</Button>
        </Empty>
      ) : null}
      <ViewTransition default="none" update="crest-move">
        <div className="gallery-more">
          {visible.length < filtered.length ||
          (limit > 12 && filtered.length > 0) ? (
            <Button
              variant="secondary"
              aria-controls="crest-grid"
              aria-disabled={visible.length >= filtered.length}
              onClick={() => {
                if (visible.length < filtered.length)
                  updateFilters({ mostrar: String(limit + 12) });
              }}
            >
              {visible.length >= filtered.length
                ? "Colección completa"
                : `Mostrar ${Math.min(12, filtered.length - limit)} más`}{" "}
              <ArrowDown aria-hidden="true" data-icon="inline-end" />
            </Button>
          ) : null}
          {limit > 12 ? (
            <a href="#filtros" className="plain-link">
              Volver a los filtros
            </a>
          ) : null}
        </div>
      </ViewTransition>
      <CrestDetail
        crest={chosen}
        eventId={controls.get("evento") ?? ""}
        changeEvent={(id) => updateFilters({ evento: id || null }, true)}
        close={() => updateFilters({ escudo: null }, true)}
        returnFocus={detailTrigger}
      />
    </div>
  );
}
