import type { UserRole } from "@/types/database";

export interface SessionProfile {
  id: string;
  authId: string;
  email: string;
  name: string;
  role: UserRole;
  planId: string | null;
  raw: Record<string, unknown>;
}

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export interface UserStats {
  userId: string;
  newsSubmitted: number;
  newsSaved: number;
  e2aUsed: number;
  studioUsed: number;
  limitsHit: number;
  possibleDuplicates: number;
  eventsTotal: number;
  lastActivity: string | null;
}

export interface CommercialSignal {
  label: string;
  detail: string;
}
