/** Tabelas de taxonomia que o ADMIN gerencia (whitelist — nada fora dela). */
// Vive fora de taxonomy-actions.ts porque arquivos "use server" só podem
// exportar funções async — exportar uma constante quebra em runtime ao
// invocar a action (visto em produção; regressão coberta pelo e2e mock).
export const TAXONOMY_TABLES = [
  "professions",
  "specialties",
  "categories",
  "tags",
] as const;
export type TaxonomyTable = (typeof TAXONOMY_TABLES)[number];
