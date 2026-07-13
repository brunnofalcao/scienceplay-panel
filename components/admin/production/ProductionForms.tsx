"use client";

import { useActionState, type ReactNode } from "react";
import {
  captureSources,
  generateBatch,
  generateByGrade,
  generateByTheme,
  triggerDailyNews,
} from "@/lib/admin/production-actions";
import type { ActionResult } from "@/types/admin";
import { ActionFeedback } from "@/components/admin/ActionFeedback";

const inputClass =
  "w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-sm outline-none focus:border-accent disabled:opacity-50";
const selectClass = inputClass;
const buttonClass =
  "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-40";

function EndpointPending() {
  return (
    <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
      Endpoint do SITE ainda não configurado — especificação em{" "}
      <code className="font-mono">docs/SITE-INTERNAL-ENDPOINTS-NEEDED.md</code>.
      Configure também <code className="font-mono">SITE_INTERNAL_API_SECRET</code>.
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

const WINDOWS = [
  ["24h", "Últimas 24h"],
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["90d", "90 dias"],
  ["1y", "1 ano"],
] as const;

const SOURCES = [
  ["pubmed", "PubMed"],
  ["crossref", "CrossRef"],
  ["all", "Todas"],
] as const;

export function CaptureForm({ ready }: { ready: boolean }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    captureSources,
    null,
  );
  return (
    <div className="space-y-3">
      {!ready ? <EndpointPending /> : null}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <Field label="Janela">
          <select name="window" defaultValue="30d" disabled={!ready} className={selectClass}>
            {WINDOWS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Fonte">
          <select name="source" defaultValue="all" disabled={!ready} className={selectClass}>
            {SOURCES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Tema/eixo (opcional)">
          <input name="theme" placeholder="ex.: gut-brain axis" disabled={!ready} className={inputClass} />
        </Field>
        <Field label="Área (opcional)">
          <input name="area" placeholder="ex.: Gastroenterologia" disabled={!ready} className={inputClass} />
        </Field>
        <Field label="Quantidade máxima">
          <input name="limit" type="number" min={1} max={100} defaultValue={20} disabled={!ready} className={inputClass} />
        </Field>
        <div className="flex items-end">
          <button type="submit" disabled={!ready || pending} className={buttonClass}>
            {pending ? "Capturando…" : "Capturar"}
          </button>
        </div>
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

export function GradeForm({ ready }: { ready: boolean }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    generateByGrade,
    null,
  );
  return (
    <div className="space-y-3">
      {!ready ? <EndpointPending /> : null}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <Field label="Grau de evidência">
          <select name="grade" defaultValue="A" disabled={!ready} className={selectClass}>
            {["A", "B", "C", "D"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Quantidade">
          <input name="limit" type="number" min={1} max={20} defaultValue={3} disabled={!ready} className={inputClass} />
        </Field>
        <Field label="Área (opcional)">
          <input name="area" disabled={!ready} className={inputClass} />
        </Field>
        <Field label="Publicar automaticamente">
          <select name="publish" defaultValue="false" disabled={!ready} className={selectClass}>
            <option value="false">Não — deixar em revisão</option>
            <option value="true">Sim — publicar direto</option>
          </select>
        </Field>
        <div className="flex items-end">
          <button type="submit" disabled={!ready || pending} className={buttonClass}>
            {pending ? "Gerando…" : "Gerar NEWS"}
          </button>
        </div>
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

const CONTENT_TYPES = [
  ["science_news", "Science News"],
  ["clinical_analysis", "Análise clínica"],
  ["article_summary", "Resumo de artigo"],
  ["evidence_update", "Atualização de evidência"],
  ["guideline_update", "Guideline update"],
] as const;

export function BatchForm({ ready }: { ready: boolean }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    generateBatch,
    null,
  );
  return (
    <div className="space-y-3">
      {!ready ? <EndpointPending /> : null}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <Field label="Quantidade">
          <input name="limit" type="number" min={1} max={20} defaultValue={5} disabled={!ready} className={inputClass} />
        </Field>
        <Field label="Tipo de conteúdo">
          <select name="contentType" defaultValue="science_news" disabled={!ready} className={selectClass}>
            {CONTENT_TYPES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Origem da fila">
          <select name="queueSource" defaultValue="captured" disabled={!ready} className={selectClass}>
            <option value="captured">Candidatos capturados</option>
            <option value="sources">Fontes sem NEWS</option>
            <option value="any">Qualquer</option>
          </select>
        </Field>
        <Field label="Status de publicação">
          <select name="publish" defaultValue="false" disabled={!ready} className={selectClass}>
            <option value="false">Gerar em revisão</option>
            <option value="true">Publicar automaticamente</option>
          </select>
        </Field>
        <div className="flex items-end">
          <button type="submit" disabled={!ready || pending} className={buttonClass}>
            {pending ? "Gerando…" : "Gerar agora"}
          </button>
        </div>
      </form>
      <p className="text-xs text-muted">
        Dedup do motor continua valendo: duplicata exata não gasta IA; possível
        duplicata vai para /duplicates.
      </p>
      <ActionFeedback state={state} />
    </div>
  );
}

const THEME_EXAMPLES = [
  "gut-brain axis",
  "GLP-1",
  "muscle protein synthesis",
  "sleep and metabolic health",
  "microbiota and obesity",
  "vitamin D respiratory infection",
];

export function ThemeForm({ ready }: { ready: boolean }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    generateByTheme,
    null,
  );
  return (
    <div className="space-y-3">
      {!ready ? <EndpointPending /> : null}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Tema/eixo">
            <input
              name="theme"
              required
              minLength={3}
              placeholder="ex.: gut-brain axis"
              disabled={!ready}
              className={inputClass}
            />
          </Field>
          <p className="mt-1 text-xs text-muted">
            Digite preferencialmente em inglês, porque a literatura científica é
            indexada majoritariamente em inglês. Exemplos:{" "}
            {THEME_EXAMPLES.join(" · ")}
          </p>
        </div>
        <Field label="Fonte">
          <select name="source" defaultValue="all" disabled={!ready} className={selectClass}>
            {SOURCES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Janela">
          <select name="window" defaultValue="1y" disabled={!ready} className={selectClass}>
            {WINDOWS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Quantidade">
          <input name="limit" type="number" min={1} max={20} defaultValue={3} disabled={!ready} className={inputClass} />
        </Field>
        <Field label="Área (opcional)">
          <input name="area" disabled={!ready} className={inputClass} />
        </Field>
        <Field label="Modo de evidência (grau mínimo)">
          <select name="minGrade" defaultValue="A" disabled={!ready} className={selectClass}>
            <option value="A">Evidência forte — só A (revisões, meta-análises, guidelines)</option>
            <option value="B">Alta/moderada — A ou B (+ ensaios randomizados)</option>
            <option value="C">Exploratório — A, B ou C (+ observacional; C não autopublica)</option>
            <option value="D">Qualquer desenho — A a D</option>
            <option value="any">Sem porta de corte (fila editorial)</option>
          </select>
        </Field>
        <div className="sm:col-span-2 -mt-1">
          <p className="rounded-lg border border-line bg-panel-2/50 px-3 py-2 text-xs leading-relaxed text-muted">
            <span className="font-medium text-ink">Grau é porta de corte, não preferência.</span>{" "}
            Escolhendo A, o motor busca só evidência forte, amplia a janela
            automaticamente (até 5 anos) e <span className="text-ink">descarta</span> o
            que sair abaixo de A — nunca completa a cota nem publica B/C no lugar. Se
            não achar A suficiente, avisa em vez de baixar a régua.{" "}
            <span className="text-faint">Você não precisa digitar sintaxe do PubMed.</span>
          </p>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={!ready || pending} className={buttonClass}>
            {pending ? "Gerando…" : "Gerar por tema"}
          </button>
        </div>
      </form>
      <ActionFeedback state={state} />
    </div>
  );
}

export function DailyTriggerForm({ ready }: { ready: boolean }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    triggerDailyNews,
    null,
  );
  return (
    <div className="space-y-3">
      {!ready ? (
        <p className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
          Defina <code className="font-mono">SITE_INTERNAL_API_SECRET</code> com o
          MESMO valor do <code className="font-mono">CRON_SECRET</code> do SITE
          para habilitar o disparo manual.
        </p>
      ) : null}
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm("Rodar o motor diário agora? Ele publica NEWS reais e pode levar alguns minutos.")) {
            event.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={!ready || pending} className={buttonClass}>
          {pending ? "Rodando… (pode levar minutos)" : "Rodar motor diário agora"}
        </button>
      </form>
      <p className="text-xs text-muted">
        Quantidade por execução definida no SITE (DAILY_NEWS_COUNT, padrão 6).
        Piso de qualidade e dedup do motor continuam valendo.
      </p>
      <ActionFeedback state={state} />
    </div>
  );
}
