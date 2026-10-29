import catalog from "../../public/escudos/catalogo.json";

export type Crest = {
  id: string;
  club: string;
  league: string;
  src: string;
};

// Only these display fields are passed to the interactive gallery.
export const crests: Crest[] = catalog.escudos.map(({ id, club, league, file }) => ({
  id,
  club,
  league,
  src: `/escudos/${file}`,
}));

export const crestCategories = [...new Set(crests.map((crest) => crest.league))];

export function getCrest(id: string) {
  const crest = crests.find((item) => item.id === id);
  if (!crest) throw new Error(`El catálogo no contiene el escudo ${id}.`);
  return crest;
}

export const featuredCrestIds = ["45", "46", "47", "48", "11", "12", "36", "37", "41", "43", "17", "31"];
