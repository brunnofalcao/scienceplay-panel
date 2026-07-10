"use client";

import { useEffect, useState } from "react";

export interface TourStep {
  /** o elemento na tela: um CTA, filtro, card ou bloco */
  target: string;
  /** o que é / o que faz — linguagem direta */
  what: string;
}

export interface TourSection {
  title: string;
  steps: TourStep[];
}

/**
 * Tour guiado sob demanda: explica cada CTA/filtro/bloco da tela atual.
 * Nunca abre sozinho — botão flutuante discreto que abre um drawer lateral.
 * Fecha com Esc, clique fora ou no X.
 */
export function GuidedTour({
  screen,
  sections,
}: {
  screen: string;
  sections: TourSection[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
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
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label={`Tour guiado — ${screen}`}
          onClick={() => setOpen(false)}
        >
          <aside
            className="flex h-full w-full max-w-md flex-col border-l border-line bg-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                  Tour guiado
                </p>
                <h2 className="font-display text-lg font-semibold">{screen}</h2>
                <p className="mt-0.5 text-xs text-muted">
                  O que cada elemento desta tela faz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-line px-2.5 py-1 text-sm text-muted hover:border-line-strong hover:text-ink"
                aria-label="Fechar tour"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {sections.map((section) => (
                <section key={section.title}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-faint">
                    {section.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {section.steps.map((step, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-line bg-panel-2/50 px-3.5 py-2.5"
                      >
                        <p className="text-sm font-medium text-ink">
                          {step.target}
                        </p>
                        <p className="mt-0.5 text-sm leading-relaxed text-muted">
                          {step.what}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <footer className="border-t border-line px-5 py-3 text-xs text-faint">
              Disponível em toda tela — reabra pelo botão “Tour guiado”.
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
