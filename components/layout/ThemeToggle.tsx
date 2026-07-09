"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sp-panel-theme";

/** Alterna tema escuro (padrão do brandbook) ↔ claro, persistindo a escolha. */
export function ThemeToggle() {
  const [light, setLight] = useState<boolean | null>(null);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // storage indisponível (modo privado) — o tema vale só para a sessão
    }
    setLight(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Alternar tema claro/escuro"
      className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-muted hover:border-accent hover:text-ink"
    >
      <span aria-hidden>{light ? "🌙" : "☀️"}</span>
      {light === null ? "Tema" : light ? "Tela escura" : "Tela clara"}
    </button>
  );
}
