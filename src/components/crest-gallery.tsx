"use client";

import Image from "next/image";
import { useState } from "react";
import type { Crest } from "@/lib/crests";
import { ArrowIcon } from "./arrow-icon";

type Props = { crests: Crest[]; categories: string[]; featuredIds: string[] };

export function CrestGallery({ crests, categories, featuredIds }: Props) {
  const [category, setCategory] = useState("Todos");
  const [expanded, setExpanded] = useState(false);
  const filtered = category === "Todos" ? crests : crests.filter((crest) => crest.league === category);
  const featured = featuredIds.flatMap((id) => {
    const crest = crests.find((item) => item.id === id);
    return crest ? [crest] : [];
  });
  const visible = category === "Todos" && !expanded ? featured : filtered;

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    setExpanded(false);
  }

  return (
    <div>
      <div className="gallery-filters" role="group" aria-label="Filtrar escudos por país o liga">
        {["Todos", ...categories].map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => selectCategory(item)}
            className="filter-button"
          >
            {item}
          </button>
        ))}
      </div>
      <p className="gallery-count" aria-live="polite" aria-atomic="true">
        {visible.length} de {crests.length} diseños · {category === "Todos" ? "Toda la colección" : category}
      </p>
      <div id="crest-grid" className="crest-grid">
        {visible.map((crest) => (
          <figure className="crest-card" key={crest.id}>
            <div className="crest-image">
              <span className="crest-id">Diseño {crest.id}</span>
              <Image
                src={crest.src}
                alt={`Escudo original inspirado en ${crest.club}`}
                width={220}
                height={220}
                sizes="(max-width: 540px) 42vw, (max-width: 900px) 27vw, 200px"
              />
            </div>
            <figcaption>
              <span className="crest-league">{crest.league}</span>
              <span className="crest-reference">{crest.club}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      {category === "Todos" ? (
        <div className="gallery-more">
          <button
            type="button"
            className="button button-outline"
            aria-expanded={expanded}
            aria-controls="crest-grid"
            onClick={() => setExpanded((previous) => !previous)}
          >
            {expanded ? "Ver una muestra" : "Ver los 48 escudos"}
            <ArrowIcon />
          </button>
        </div>
      ) : null}
    </div>
  );
}
