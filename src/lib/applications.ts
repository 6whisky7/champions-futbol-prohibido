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
  member_checks?: {follow:boolean;group:boolean;friend:boolean}[];
  accepted_privacy_version?: string | null;
  accepted_privacy_at?: string | null;
  history: {
    at: string;
    actor?: string | null;
    action: string;
    reason: string;
    before_payload?: ApplicationPayload;
    after_payload?: ApplicationPayload;
    before_checks?: {follow:boolean;group:boolean;friend:boolean}[];
    after_checks?: {follow:boolean;group:boolean;friend:boolean}[];
  }[];
};
export const stateLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  waiting: "En espera",
  rejected: "Rechazado",
  expired: "Vencido",
};
