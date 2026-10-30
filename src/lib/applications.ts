export type Member = { roblox: string; tiktok: string };
export type ApplicationPayload = {
  name: string;
  crest: string;
  number: string;
  captain: string;
  members: Member[];
};
export type Application = {
  id: string;
  payload: ApplicationPayload;
  state: string;
  expires_at: string | null;
  captain_confirmed: boolean;
  requirements_checked: boolean;
  history: {
    at: string;
    action: string;
    reason: string;
    before_payload?: ApplicationPayload;
    after_payload?: ApplicationPayload;
  }[];
};
export const stateLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  waiting: "En espera",
  rejected: "Rechazado",
  expired: "Vencido",
};
