const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const numberFmt = new Intl.NumberFormat("pt-BR");

export function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFmt.format(d);
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function formatNumber(value: number): string {
  return numberFmt.format(value);
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatMs(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

/** Lê a primeira coluna existente entre `keys` como string. */
export function pickString(
  row: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

/** Lê a primeira coluna existente entre `keys` como número. */
export function pickNumber(
  row: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

export function pickBoolean(
  row: Record<string, unknown>,
  keys: string[],
): boolean | null {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "boolean") return v;
  }
  return null;
}

export function truncate(value: string, max = 90): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
