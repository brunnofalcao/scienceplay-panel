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
        {/* Largura de leitura confortável — o conteúdo respira, não sprawla
            de ponta a ponta em telas largas (percepção premium). */}
        <main className="flex-1 overflow-x-auto px-6 py-7 md:px-10">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
