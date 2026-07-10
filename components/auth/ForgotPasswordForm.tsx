"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/lib/auth/actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ResetRequestState, FormData>(
    requestPasswordReset,
    null,
  );

  if (state?.sent) {
    return (
      <p className="mt-6 rounded-lg border border-ok/40 bg-ok/10 p-4 text-sm text-ok">
        Se este e-mail estiver cadastrado, o link de redefinição foi enviado.
        Confira a caixa de entrada (e o spam) — o link abre a tela de senha
        nova aqui no painel.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm text-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      {state?.error ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviar link de redefinição"}
      </button>
    </form>
  );
}
