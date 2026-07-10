import type { TourSection } from "@/components/ui/GuidedTour";

/**
 * Conteúdo do Tour Guiado por tela. Cada passo aponta (anchor) para um elemento
 * real via [data-tour="..."]; o tour destaca esse elemento na tela e explica o
 * que ele faz. Passos sem anchor caem num card central (fallback).
 */
export const TOURS: Record<string, TourSection[]> = {
  "Visão geral": [
    {
      title: "Onde agir primeiro",
      steps: [
        {
          anchor: '[data-tour="attention"]',
          title: "Precisa de atenção",
          what: "A faixa do topo lista só o que exige ação agora: NEWS aguardando revisão, possíveis duplicados e erros de IA. Clique no item para ir direto onde se resolve.",
        },
      ],
    },
    {
      title: "Métricas",
      steps: [
        {
          anchor: '[data-tour="users-metrics"]',
          title: "Usuários",
          what: "Base total, novos em 7 e 30 dias, e ativos (com evento de uso no período).",
        },
        {
          anchor: '[data-tour="content-factory"]',
          title: "Content Factory",
          what: "Produção de NEWS hoje e no mês, auto-publicadas e fila de duplicados.",
        },
        {
          anchor: '[data-tour="cost"]',
          title: "Custo de IA",
          what: "Custo hoje/mês e o custo médio por NEWS — exato quando o motor grava a atribuição; senão mostra 'aguardando dados' (sem fingir).",
        },
      ],
    },
    {
      title: "Ações rápidas",
      steps: [
        {
          anchor: '[data-tour="produzir"]',
          title: "Produzir NEWS",
          what: "Abre a Produção de NEWS: capturar estudos e gerar por grau, tema ou lote.",
        },
        {
          anchor: '[data-tour="collapsibles"]',
          title: "Seções secundárias",
          what: "Origem, produto & IA e rankings ficam recolhidos aqui — clique em 'Ver detalhes' para expandir quando precisar.",
        },
      ],
    },
  ],

  "Produção de NEWS": [
    {
      title: "Capturar",
      steps: [
        {
          anchor: '[data-tour="capturar"]',
          title: "Capturar estudos novos",
          what: "Busca no PubMed/CrossRef pela janela e fonte escolhidas e enfileira candidatos. Não gasta IA — só descobre e enfileira.",
        },
      ],
    },
    {
      title: "Gerar",
      steps: [
        {
          anchor: '[data-tour="grade"]',
          title: "Gerar por grau de evidência",
          what: "Gera e publica só o que atinge o grau escolhido (D nunca auto-publica). 'Publicar automaticamente = Não' deixa em revisão. Consome IA.",
        },
        {
          anchor: '[data-tour="batch"]',
          title: "Gerar lote",
          what: "Processa os candidatos já capturados. Dedup e piso de qualidade continuam valendo.",
        },
        {
          anchor: '[data-tour="theme"]',
          title: "Gerar por tema",
          what: "Descobre e gera por assunto. Digite em inglês (a literatura é indexada em inglês).",
        },
      ],
    },
  ],

  "Custos de IA": [
    {
      title: "Leitura rápida",
      steps: [
        {
          anchor: '[data-tour="cost-totals"]',
          title: "Cartões de topo",
          what: "Custo hoje, no mês, total da amostra e médio por chamada — em horário de Brasília.",
        },
        {
          anchor: '[data-tour="cost-filters"]',
          title: "Filtros",
          what: "Recortam a amostra por data, feature, plano, provider, modelo, status. 'Só erros' isola chamadas que falharam. Aplica a todos os gráficos e à tabela.",
        },
        {
          anchor: '[data-tour="cost-breakdowns"]',
          title: "Quebras de custo",
          what: "Custo por NEWS (exato, quando há atribuição), por usuário, plano, feature, provider, modelo e dia — barra proporcional ao custo, valor à direita.",
        },
      ],
    },
  ],

  "NEWS": [
    {
      title: "Acervo",
      steps: [
        {
          anchor: '[data-tour="news-stats"]',
          title: "Cartões de topo",
          what: "Distribuição do acervo por status e grau, mais ritmo de produção e custo de IA do mês.",
        },
        {
          anchor: '[data-tour="news-filters"]',
          title: "Filtros",
          what: "Combine busca, status, origem, tipo, GRADE, DOI/PMID, área, tag, usuário e data para achar exatamente a NEWS.",
        },
        {
          anchor: '[data-tour="news-table"]',
          title: "Ações por linha",
          what: "Publicar, rejeitar, arquivar ou marcar duplicado — toda ação grava em admin_audit_logs. Conteúdo mock não pode ser publicado.",
        },
      ],
    },
  ],

  "Usuários": [
    {
      title: "Base de usuários",
      steps: [
        {
          anchor: '[data-tour="users-filters"]',
          title: "Filtros e ordenação",
          what: "Filtre por profissão, especialidade, plano, role e atividade; ordene por mais ativos, recentes, mais NEWS, E2A/Studio ou limites atingidos.",
        },
        {
          anchor: '[data-tour="users-table"]',
          title: "Abrir um usuário",
          what: "Clique no nome para o perfil completo: consumo, produção, E2A, Studio, custo de IA e sinais de intenção.",
        },
      ],
    },
  ],

  "Fila de Produção": [
    {
      title: "Fila",
      steps: [
        {
          anchor: '[data-tour="queue-candidates"]',
          title: "Candidatos capturados",
          what: "Estudos enfileirados pela captura, aguardando geração.",
        },
        {
          anchor: '[data-tour="queue-editorial"]',
          title: "Fila editorial",
          what: "NEWS em geradas/revisão/duplicado/rascunho. Aja por linha — tudo auditado.",
        },
      ],
    },
  ],

  "Produção Diária": [
    {
      title: "Motor diário",
      steps: [
        {
          anchor: '[data-tour="daily-engine"]',
          title: "Rodar motor diário agora",
          what: "Dispara a geração no SITE (publica NEWS reais). Roda sozinho às 06:30 BRT; o disparo manual é auditado e pode levar minutos.",
        },
        {
          anchor: '[data-tour="daily-history"]',
          title: "Histórico de execuções",
          what: "Cada rodada com publicadas/descobertas/dedup/revisão/não resolvidas/erros.",
        },
      ],
    },
  ],

  "AI Logs": [
    {
      title: "Telemetria",
      steps: [
        {
          anchor: '[data-tour="ailogs-filters"]',
          title: "Filtros",
          what: "Recortam os logs por provider, modelo, status e feature. 'Só erros' e 'só failover' isolam problemas.",
        },
        {
          anchor: '[data-tour="ailogs-export"]',
          title: "Exportar CSV",
          what: "Baixa a amostra filtrada — sem prompt bruto, sem chaves.",
        },
        {
          anchor: '[data-tour="ailogs-groups"]',
          title: "Agrupamentos",
          what: "Por dia, feature e provider/modelo — chamadas e custo lado a lado.",
        },
      ],
    },
  ],

  "Usage": [
    {
      title: "Eventos",
      steps: [
        {
          anchor: '[data-tour="usage-cards"]',
          title: "Cartões por evento",
          what: "Só os eventos REAIS emitidos hoje (e2a_used, studio_used, etc.).",
        },
        {
          anchor: '[data-tour="usage-charts"]',
          title: "Filtros e quebras",
          what: "Por usuário, evento e data; e visões por plano, profissão e formato.",
        },
      ],
    },
  ],
};
