"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

export interface TourStep {
  /** Seletor CSS do elemento real a destacar (ex.: '[data-tour="produzir"]'). */
  anchor?: string;
  /** Rótulo curto do elemento/CTA. */
  title: string;
  /** O que é / o que faz — linguagem direta. */
  what: string;
}

export interface TourSection {
  title: string;
  steps: TourStep[];
}

interface FlatStep extends TourStep {
  group: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8; // respiro do recorte em volta do elemento

/**
 * Tour guiado ANCORADO: destaca o elemento real na tela, rola até ele e mostra
 * um balão explicando o que aquele CTA/filtro faz — passo a passo. Nunca abre
 * sozinho; botão flutuante sempre disponível. Fecha com Esc, no X ou "Concluir".
 */
export function GuidedTour({
  screen,
  sections,
}: {
  screen: string;
  sections: TourSection[];
}) {
  const steps = useMemo<FlatStep[]>(
    () =>
      sections.flatMap((s) => s.steps.map((step) => ({ ...step, group: s.title }))),
    [sections],
  );

  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[index];

  const measure = useCallback(() => {
    if (!step?.anchor) {
      setRect(null);
      return;
    }
    const el = document.querySelector(step.anchor);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // Elemento oculto/colapsado (dentro de <details> fechado) → sem recorte,
    // cai no card central com a explicação.
    if (r.width === 0 || r.height === 0) {
      setRect(null);
      return;
    }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Ao trocar de passo: rola até o alvo e mede depois de assentar o scroll.
  useLayoutEffect(() => {
    if (!open || !step) return;
    if (step.anchor) {
      const el = document.querySelector(step.anchor);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = setTimeout(measure, 260);
    return () => clearTimeout(t);
  }, [open, step, measure]);

  // Re-mede em scroll/resize enquanto o tour está aberto.
  useEffect(() => {
    if (!open) return;
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, measure]);

  const close = useCallback(() => setOpen(false), []);
  const next = useCallback(
    () => setIndex((i) => Math.min(i + 1, steps.length - 1)),
    [steps.length],
  );
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  const start = () => {
    setIndex(0);
    setOpen(true);
  };

  if (steps.length === 0) return null;

  const isLast = index === steps.length - 1;

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-line-strong bg-panel/90 px-4 py-2.5 text-sm text-ink shadow-lg backdrop-blur hover:border-accent"
        aria-haspopup="dialog"
      >
        <span
          className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-white"
          aria-hidden
        >
          ?
        </span>
        Tour guiado
      </button>

      {open ? (
        <TourOverlay
          screen={screen}
          step={step}
          rect={rect}
          index={index}
          total={steps.length}
          isLast={isLast}
          onNext={next}
          onPrev={prev}
          onClose={close}
        />
      ) : null}
    </>
  );
}

function TourOverlay({
  screen,
  step,
  rect,
  index,
  total,
  isLast,
  onNext,
  onPrev,
  onClose,
}: {
  screen: string;
  step: FlatStep;
  rect: Rect | null;
  index: number;
  total: number;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  // Posição do balão: abaixo do alvo se couber, senão acima; centralizado quando
  // não há âncora (ou o elemento não foi encontrado).
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const CARD_W = 340;

  let cardStyle: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + 12;
    const placeBelow = below + 180 < vh;
    const top = placeBelow ? below : Math.max(12, rect.top - 12 - 180);
    let left = rect.left + rect.width / 2 - CARD_W / 2;
    left = Math.max(12, Math.min(left, vw - CARD_W - 12));
    cardStyle = { position: "fixed", top, left, width: CARD_W };
  } else {
    cardStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      width: CARD_W,
      transform: "translate(-50%, -50%)",
    };
  }

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={`Tour guiado — ${screen}`}>
      {/* Fundo escurecido. Sem âncora, um dim simples; com âncora, o recorte
          (box-shadow gigante) cria o holofote no elemento. */}
      {rect ? (
        <>
          <div className="absolute inset-0" onClick={onClose} />
          <div
            className="pointer-events-none absolute rounded-xl ring-2 ring-accent transition-all duration-200"
            style={{
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              boxShadow: "0 0 0 9999px rgba(6,4,10,0.72)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      )}

      <div
        style={cardStyle}
        className="z-50 rounded-2xl border border-line-strong bg-panel p-4 shadow-2xl"
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">
            {step.group}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-1.5 text-sm text-muted hover:text-ink"
            aria-label="Fechar tour"
          >
            ✕
          </button>
        </div>
        <h3 className="font-display text-base font-semibold text-ink">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{step.what}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs tabular-nums text-faint">
            {index + 1} / {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrev}
              disabled={index === 0}
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:border-line-strong hover:text-ink disabled:opacity-40"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={isLast ? onClose : onNext}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              {isLast ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
