import type { PublicMatch } from "./public-matches";
export type NowData = {
  event: { id: string; name: string } | null;
  match: PublicMatch | null;
  open: boolean;
  free: number;
  called: boolean;
};
