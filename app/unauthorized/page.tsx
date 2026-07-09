import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/lib/auth/actions";

export const metadata: Metadata = { title: "Acesso não autorizado" };

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-8 text-center">
        <h1 className="text-xl font-semibold text-danger">
          Acesso não autorizado.
        </h1>
        <p className="mt-2 text-sm text-muted">
          Este painel é restrito a administradores da Science Play.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg border border-line bg-panel-2 px-4 py-2 text-sm hover:border-accent"
            >
              Sair e trocar de conta
            </button>
          </form>
          <Link
            href="/login"
            className="text-sm text-accent hover:underline"
          >
            Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
