import type { TourSection } from "@/components/ui/GuidedTour";

/**
 * Conteúdo do Tour Guiado por tela. Linguagem direta: o que cada CTA, filtro
 * e bloco faz. Mantido centralizado para consistência.
 */
export const TOURS: Record<string, TourSection[]> = {
  "Visão geral": [
    {
      title: "Precisa de atenção",
      steps: [
        { target: "Faixa no topo", what: "Lista só o que exige ação agora: NEWS aguardando revisão, possíveis duplicados e erros de IA. Clique no item para ir direto onde se resolve." },
      ],
    },
    {
      title: "Blocos de métrica",
      steps: [
        { target: "Usuários", what: "Base total, novos em 7/30 dias e ativos (com evento de uso no período)." },
        { target: "Content Factory", what: "Produção de NEWS (hoje/mês), auto-publicadas, fila de duplicados e custo de IA." },
        { target: "Custo médio por NEWS", what: "Exato quando o motor grava a atribuição; senão mostra 'aguardando dados' (sem fingir)." },
      ],
    },
    {
      title: "Ações rápidas",
      steps: [
        { target: "Produzir NEWS", what: "Abre a Produção de NEWS: capturar estudos e gerar por grau, tema ou lote." },
        { target: "Fila / Diária / Custos", what: "Atalhos para a fila editorial, a visão do motor diário e a análise de custos." },
        { target: "Ver detalhes", what: "As seções secundárias (origem, produto & IA, rankings) ficam recolhidas — expanda quando precisar." },
      ],
    },
  ],

  "Produção de NEWS": [
    {
      title: "Capturar estudos novos",
      steps: [
        { target: "Janela / Fonte", what: "Período de busca no PubMed e a fonte. Sem gastar IA — só descobre e enfileira candidatos." },
        { target: "Tema/eixo e Área", what: "Opcionais. Tema livre (em inglês) busca por assunto; senão usa as trilhas do tema central." },
        { target: "Capturar", what: "Enfileira os estudos em 'Fila de Produção' com status 'capturado'." },
      ],
    },
    {
      title: "Gerar NEWS",
      steps: [
        { target: "Por grau de evidência", what: "Gera e publica só o que atinge o grau escolhido (D nunca auto-publica). Consome IA." },
        { target: "Gerar lote", what: "Processa os candidatos capturados. Dedup e piso de qualidade continuam valendo." },
        { target: "Por tema", what: "Descobre e gera por assunto. Digite em inglês (a literatura é indexada em inglês)." },
        { target: "Publicar automaticamente", what: "'Não' deixa em revisão para você aprovar; 'Sim' publica direto o que passar no piso." },
      ],
    },
  ],

  "Custos de IA": [
    {
      title: "Cartões de topo",
      steps: [
        { target: "Custo hoje / mês / total", what: "Somatório de ai_logs em horário de Brasília. 'Total' é sobre a amostra carregada." },
        { target: "Custo E2A / Studio", what: "Estimado por nome de feature (heurística), não exato." },
      ],
    },
    {
      title: "Filtros",
      steps: [
        { target: "Datas / Feature / Plano / Provider / Modelo / Status", what: "Recortam a amostra. 'Só erros' isola chamadas que falharam." },
        { target: "Filtrar", what: "Aplica os filtros a todos os gráficos e à tabela abaixo." },
      ],
    },
    {
      title: "Quebras",
      steps: [
        { target: "Custo por NEWS (exato)", what: "Aparece quando há gerações com atribuição (entity_id). Custo real por artigo." },
        { target: "Por usuário / plano / feature / provider / modelo / dia", what: "Barras ordenadas por custo, com o valor à direita." },
      ],
    },
  ],

  "NEWS": [
    {
      title: "Cartões de topo",
      steps: [
        { target: "Publicadas / A+B / C / D / Duplicadas", what: "Distribuição do acervo por status e grau de evidência." },
        { target: "Geradas no mês / Custo IA", what: "Ritmo de produção e custo de IA do mês corrente." },
      ],
    },
    {
      title: "Filtros e ações",
      steps: [
        { target: "Busca / Status / Origem / Tipo / GRADE / DOI / PMID / Área / Tag / Usuário", what: "Combine para achar exatamente a NEWS. Data e 'auto-publicado' também filtram." },
        { target: "Ações por linha", what: "Publicar, rejeitar ou marcar duplicado — toda ação grava em admin_audit_logs." },
      ],
    },
  ],

  "Usuários": [
    {
      title: "Lista",
      steps: [
        { target: "Busca / Profissão / Especialidade / Plano / Role / Atividade", what: "Filtram a base. 'Atividade' separa ativos de inativos." },
        { target: "Ordenar", what: "Por mais ativos, recentes, mais NEWS, mais E2A/Studio ou mais limites atingidos." },
        { target: "Abrir um usuário", what: "Perfil completo: consumo, produção, E2A, Studio, custo de IA e sinais de intenção." },
      ],
    },
  ],

  "Fila de Produção": [
    {
      title: "Blocos",
      steps: [
        { target: "Candidatos capturados", what: "Estudos enfileirados pela captura, aguardando geração." },
        { target: "Fila editorial", what: "NEWS em geradas/revisão/duplicado/rascunho. Aja por linha — tudo auditado." },
      ],
    },
  ],

  "Produção Diária": [
    {
      title: "Motor diário",
      steps: [
        { target: "Rodar motor diário agora", what: "Dispara a geração no SITE (publica NEWS reais). Pode levar minutos; é auditado." },
        { target: "Histórico de execuções", what: "Cada rodada do cron das 06:30 com publicadas/descobertas/dedup/não resolvidas/erros." },
      ],
    },
  ],

  "AI Logs": [
    {
      title: "Uso",
      steps: [
        { target: "Filtros (provider/modelo/status/feature)", what: "Recortam os logs técnicos. 'Só erros' e 'só failover' isolam problemas." },
        { target: "Exportar CSV", what: "Baixa a amostra filtrada (sem prompt bruto, sem chaves)." },
        { target: "Agrupamentos", what: "Por dia, feature e provider/modelo — chamadas e custo lado a lado." },
      ],
    },
  ],

  "Usage": [
    {
      title: "Eventos",
      steps: [
        { target: "Cartões por evento", what: "Só os eventos REAIS emitidos hoje (e2a_used, studio_used, etc.)." },
        { target: "Filtros e quebras", what: "Por usuário, evento e data; e visões por plano, profissão e formato." },
      ],
    },
  ],
};
