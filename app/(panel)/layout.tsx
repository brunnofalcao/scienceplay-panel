import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/guard";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

// Rotas gated por sessão NUNCA podem ser pré-renderizadas estáticas
// (gotcha §9 do HANDOFF — 404 congelado em produção).
export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const guard = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header profile={guard.profile} />
        <main className="flex-1 space-y-4 overflow-x-auto p-6">{children}</main>
      </div>
    </div>
  );
}
