export type LiveWorking = {
  revision: number;
  needs_reset: boolean;
  hg: number | null;
  ag: number | null;
  called_at: string | null;
  updated_at: string;
};
export type LiveMatch = {
  id: string;
  phase: "league" | "knockout";
  phase_label: string;
  home: string | null;
  away: string | null;
  home_name: string | null;
  away_name: string | null;
  home_crest: string | null;
  away_crest: string | null;
  kind: string;
  hg: number | null;
  ag: number | null;
  scheduled_at: string | null;
  attempt: number;
  active: boolean;
  official_revision: number;
  working: LiveWorking | null;
};
export type PublicLive = {
  event: { id: string; name: string };
  now: string;
  matches: LiveMatch[];
};
export type LiveDocument = PublicLive & { role: "owner" | "helper" };
export type LiveAdmin = {
  helpers: {
    user_id: string;
    email: string;
    active: boolean;
    updated_at: string;
  }[];
  evidence: {
    match_id: string;
    url: string;
    public_flag: boolean;
    updated_at: string;
  }[];
  history_total: number;
  history: {
    at: string;
    actor: string | null;
    match_id: string | null;
    action: string;
    reason: string;
    before_value: unknown;
    after_value: unknown;
  }[];
};
export function mergeLive(
  previous: LiveDocument,
  incoming: LiveDocument,
): LiveDocument {
  if (previous.event.id !== incoming.event.id) return incoming;
  return {
    ...incoming,
    matches: incoming.matches.map((m) => {
      const old = previous.matches.find((x) => x.id === m.id);
      return old &&
        (old.official_revision > m.official_revision ||
          (old.official_revision === m.official_revision &&
            (old.working?.revision ?? 0) > (m.working?.revision ?? 0)))
        ? old
        : m;
    }),
  };
}
export function liveTime(
  calledAt: string | null | undefined,
  serverNow: number,
) {
  if (!calledAt || !Number.isFinite(serverNow)) return null;
  return Math.max(
    0,
    Math.ceil((Date.parse(calledAt) + 300000 - serverNow) / 1000),
  );
}
