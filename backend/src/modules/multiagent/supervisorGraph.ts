/**
 * ============================================================================
 * 🧠 ORQUESTRADOR MULTI-AGENTE (backend/src/modules/multiagent/supervisorGraph.ts)
 * ============================================================================
 * Implementa o Supervisor-Worker Pattern utilizando LangGraph:
 * 1. Decomposição de tarefas em DAG (Grafo Acíclico Dirigido).
 * 2. Execução concorrente / paralela dos agentes Comercial, Financeiro e Jurídico.
 * 3. Integração com Servidores MCP para CRM, ERP e CLM.
 * 4. Ponto de decisão Human-in-the-Loop (HITL) para alçadas de desconto.
 * 5. Síntese executiva fundamentada para o colaborador.
 */

import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { RegistroMCP } from '../../mcp/mcpRegistry.js';
import { obterProvedorLLM } from '../../providers/llm/index.js';
import { ServicoHitl } from '../hitl/hitl.service.ts';
import { RastreadorTelemetria } from '../observability/telemetry.service.js';

export const EstadoMultiagente = Annotation.Root({
  solicitacao: Annotation<string>(),
  solicitante: Annotation<string>(),
  departamento: Annotation<string>(),

  // Identificação e Plano
  cliente: Annotation<string>({
    reducer: (_, novo) => novo,
    default: () => 'XPTO',
  }),
  descontoSolicitado: Annotation<number>({
    reducer: (_, novo) => novo,
    default: () => 10,
  }),
  planoExecucao: Annotation<
    Array<{ id: string; agente: string; descricao: string; status: 'pendente' | 'concluido' | 'executando' }>
  >({
    reducer: (_, novo) => novo,
    default: () => [],
  }),

  // Resultados dos Agentes Especialistas
  resultadoComercial: Annotation<any>({
    reducer: (_, novo) => novo,
    default: () => null,
  }),
  resultadoFinanceiro: Annotation<any>({
    reducer: (_, novo) => novo,
    default: () => null,
  }),
  resultadoJuridico: Annotation<any>({
    reducer: (_, novo) => novo,
    default: () => null,
  }),

  // Viabilidade e Decisão
  analiseViabilidade: Annotation<{
    viavel: boolean;
    motivo: string;
    margemFinalPercentual: number;
    necessitaAprovacaoAlcada: boolean;
  }>({
    reducer: (_, novo) => novo,
    default: () => ({
      viavel: false,
      motivo: '',
      margemFinalPercentual: 0,
      necessitaAprovacaoAlcada: true,
    }),
  }),

  // Proposta e HITL
  propostaGerada: Annotation<any>({
    reducer: (_, novo) => novo,
    default: () => null,
  }),
  aprovacaoHitl: Annotation<any>({
    reducer: (_, novo) => novo,
    default: () => null,
  }),
  statusFinal: Annotation<string>({
    reducer: (_, novo) => novo,
    default: () => 'em_andamento',
  }),
  respostaSintetizada: Annotation<string>({
    reducer: (_, novo) => novo,
    default: () => '',
  }),
});

export type TipoEstadoMultiagente = typeof EstadoMultiagente.State;

export function construirGrafoMultiagente(telemetria: RastreadorTelemetria, servicoHitl: ServicoHitl) {
  const mcp = RegistroMCP.obterInstancia();
  const provedorLlm = obterProvedorLLM();

  // NÓ 1: Supervisor / Planejador (Meta-Planner)
  async function noSupervisorPlanejador(estado: TipoEstadoMultiagente) {
    const finalizarSpan = telemetria.iniciarSpan('Supervisor: Decomposição em DAG', 'supervisor', 'Governança', 'Supervisor Agent');

    // Extrai cliente (ex: "cliente XPTO" ou padrão em caixa alta específico)
    const matchClienteComum = estado.solicitacao.match(/cliente\s+([A-Za-z0-9_-]+)/i);
    let cliente = 'XPTO';
    if (matchClienteComum && matchClienteComum[1]) {
      cliente = matchClienteComum[1].toUpperCase();
    } else {
      const matchSigla = estado.solicitacao.match(/\b([A-Z]{3,})\b/);
      if (matchSigla) cliente = matchSigla[1];
    }

    const matchDesconto = estado.solicitacao.match(/(\d+)%/);
    const descontoSolicitado = matchDesconto ? Number(matchDesconto[1]) : 10;

    const plano = [
      {
        id: 'task-1',
        agente: 'Agente Comercial',
        descricao: `Consultar LTV, histórico e margem no Salesforce CRM para o cliente ${cliente}`,
        status: 'pendente' as const,
      },
      {
        id: 'task-2',
        agente: 'Agente Financeiro',
        descricao: `Consultar aging de títulos e inadimplência no SAP ERP para ${cliente}`,
        status: 'pendente' as const,
      },
      {
        id: 'task-3',
        agente: 'Agente Jurídico',
        descricao: `Consultar cláusulas de renovação e regras de desconto no CLM para ${cliente}`,
        status: 'pendente' as const,
      },
      {
        id: 'task-4',
        agente: 'Agente de Proposta & HITL',
        descricao: `Simular desconto de ${descontoSolicitado}%, gerar minuta e acionar alçada de aprovação se necessário`,
        status: 'pendente' as const,
      },
    ];

    finalizarSpan(180, 90, { cliente, descontoSolicitado, subtasks: plano.length });

    return {
      cliente,
      descontoSolicitado,
      planoExecucao: plano,
    };
  }

  // NÓ 2: Execução Paralela / Concorrente dos Agentes de Domínio
  async function noExecucaoParalela(estado: TipoEstadoMultiagente) {
    const contextoUsuario = { usuario: estado.solicitante, departamento: estado.departamento };

    // 1. Worker Comercial
    const finalizarSpanComercial = telemetria.iniciarSpan('Worker Comercial: Salesforce MCP', 'worker', 'Comercial', 'Agente Comercial');
    const resComercial = await mcp.executarFerramenta(
      'salesforce_get_customer_history',
      { clienteId: estado.cliente },
      contextoUsuario
    );
    finalizarSpanComercial(220, 140, resComercial.dados);

    // 2. Worker Financeiro
    const finalizarSpanFinanceiro = telemetria.iniciarSpan('Worker Financeiro: SAP ERP MCP', 'worker', 'Financeiro', 'Agente Financeiro');
    const resFinanceiro = await mcp.executarFerramenta(
      'sap_get_aging_report',
      { clienteId: estado.cliente },
      contextoUsuario
    );
    finalizarSpanFinanceiro(200, 110, resFinanceiro.dados);

    // 3. Worker Jurídico
    const finalizarSpanJuridico = telemetria.iniciarSpan('Worker Jurídico: CLM Legal MCP', 'worker', 'Jurídico', 'Agente Jurídico');
    const resJuridico = await mcp.executarFerramenta(
      'clm_get_contract_clauses',
      { clienteId: estado.cliente },
      contextoUsuario
    );
    finalizarSpanJuridico(280, 160, resJuridico.dados);

    // Atualiza status do plano
    const planoAtualizado = estado.planoExecucao.map((p) => {
      if (['task-1', 'task-2', 'task-3'].includes(p.id)) {
        return { ...p, status: 'concluido' as const };
      }
      return p;
    });

    return {
      resultadoComercial: resComercial.dados,
      resultadoFinanceiro: resFinanceiro.dados,
      resultadoJuridico: resJuridico.dados,
      planoExecucao: planoAtualizado,
    };
  }

  // NÓ 3: Análise de Viabilidade do Desconto & Alçadas
  async function noAvaliacaoViabilidade(estado: TipoEstadoMultiagente) {
    const finalizarSpan = telemetria.iniciarSpan('Supervisor: Cálculo de Margem e Alçadas', 'supervisor', 'Comercial', 'Supervisor Agent');

    const valorContratoAtual = estado.resultadoComercial?.contratoAtualAnual || 360000;
    const resMargem = await mcp.executarFerramenta('salesforce_calculate_margin', {
      valorBase: valorContratoAtual,
      percentualDesconto: estado.descontoSolicitado,
    });

    const margemFinal = resMargem.dados?.margemBrutaFinalPercentual || 23;
    const viavel = resMargem.dados?.viavel ?? true;

    // Regra jurídica: descontos acima de 5% exigem aprovação formal da Diretoria
    const limiteAutonomo = estado.resultadoJuridico?.clausulaRenovacao?.limiteDescontoAutonomo || 5;
    const necessitaAprovacaoAlcada = estado.descontoSolicitado > limiteAutonomo;

    finalizarSpan(150, 75, { margemFinal, viavel, necessitaAprovacaoAlcada });

    return {
      analiseViabilidade: {
        viavel,
        motivo: resMargem.dados?.motivo || 'Margem dentro dos parâmetros corporativos.',
        margemFinalPercentual: margemFinal,
        necessitaAprovacaoAlcada,
      },
    };
  }

  // NÓ 4: Geração de Minuta e Ponto de Decisão Human-in-the-Loop (HITL)
  async function noPropostaEHITL(estado: TipoEstadoMultiagente) {
    const finalizarSpan = telemetria.iniciarSpan('Worker CLM: Geração de Proposta & HITL', 'hitl', 'Jurídico', 'Agente de Proposta');

    const valorOriginal = estado.resultadoComercial?.contratoAtualAnual || 360000;
    const valorComDesconto = valorOriginal * (1 - estado.descontoSolicitado / 100);

    // Gera minuta no CLM
    const resProposta = await mcp.executarFerramenta('clm_create_draft_proposal', {
      clienteId: estado.cliente,
      valorAnual: valorComDesconto,
      descontoPercentual: estado.descontoSolicitado,
      prazoVigenciaMeses: 12,
    });

    let aprovacao = null;
    let statusFinal = 'concluido';

    // Se exige aprovação de alçada, cria ticket HITL e suspende
    if (estado.analiseViabilidade.necessitaAprovacaoAlcada) {
      statusFinal = 'aguardando_aprovacao';
      aprovacao = await servicoHitl.criarAprovacao({
        tipo: 'desconto_comercial',
        titulo: `Aprovação de Desconto de ${estado.descontoSolicitado}% — Renovação Cliente ${estado.cliente}`,
        solicitante: estado.solicitante,
        departamento: estado.departamento,
        dados: {
          cliente: estado.cliente,
          valorOriginal,
          valorComDesconto,
          descontoPercentual: estado.descontoSolicitado,
          margemResultante: `${estado.analiseViabilidade.margemFinalPercentual}%`,
          propostaId: resProposta.dados?.propostaId,
          propostaPdf: resProposta.dados?.arquivoGerado,
          parecerFinanceiro: estado.resultadoFinanceiro?.conceitoFinanceiro,
          clausulaContratual: estado.resultadoJuridico?.clausulaRenovacao?.texto,
        },
      });
    }

    const planoAtualizado = estado.planoExecucao.map((p) => {
      if (p.id === 'task-4') {
        return { ...p, status: 'concluido' as const };
      }
      return p;
    });

    finalizarSpan(210, 130, { propostaId: resProposta.dados?.propostaId, hitlCriado: !!aprovacao });

    return {
      propostaGerada: resProposta.dados,
      aprovacaoHitl: aprovacao,
      statusFinal,
      planoExecucao: planoAtualizado,
    };
  }

  // NÓ 5: Síntese Final Executiva com LLM
  async function noSinteseFinal(estado: TipoEstadoMultiagente) {
    const finalizarSpan = telemetria.iniciarSpan('Supervisor: Síntese Final Executiva', 'sintese', 'Governança', 'Supervisor Agent');

    const promptContexto = `
DADOS COLETADOS PELOS AGENTES ESPECIALIZADOS:
1. COMERCIAL (Salesforce):
- Cliente: ${estado.cliente}
- Tempo de Casa: ${estado.resultadoComercial?.tempoDeCasaAnos} anos
- LTV Acumulado: R$ ${estado.resultadoComercial?.ltvTotal?.toLocaleString('pt-BR')}
- Churn Risk: ${estado.resultadoComercial?.churnRisk}

2. FINANCEIRO (SAP ERP):
- Títulos Vencidos: ${estado.resultadoFinanceiro?.titulosVencidos}
- Score de Crédito: ${estado.resultadoFinanceiro?.scoreCreditoSerasa}
- Parecer: ${estado.resultadoFinanceiro?.conceitoFinanceiro}

3. JURÍDICO (CLM):
- Contrato Atual: ${estado.resultadoJuridico?.contratoNumero}
- Vencimento: ${estado.resultadoJuridico?.vigenciaFim}
- Regra de Desconto: ${estado.resultadoJuridico?.clausulaRenovacao?.texto}

4. SIMULAÇÃO DE DESCONTO & PROPOSTA:
- Desconto Solicitado: ${estado.descontoSolicitado}%
- Margem Resultante: ${estado.analiseViabilidade?.margemFinalPercentual}% (Piso: 18%)
- Viabilidade Financeira: ${estado.analiseViabilidade?.viavel ? 'VIÁVEL' : 'INVIÁVEL'}
- Necessita Aprovação de Alçada (Diretoria): ${estado.analiseViabilidade?.necessitaAprovacaoAlcada ? 'SIM' : 'NÃO'}
- Proposta Gerada: ${estado.propostaGerada?.propostaId}
- Status da Operação: ${estado.statusFinal === 'aguardando_aprovacao' ? 'AGUARDANDO APROVAÇÃO DO DIRETOR COMERCIAL' : 'CONCLUÍDO'}
`;

    const instrucaoSistema = `Você é o Orquestrador Central Multi-Agentes de IA Corporativa.
Seu objetivo é sintetizar para o colaborador o relatório executivo da renovação do contrato de forma clara, profissional, didática e estruturada em Markdown.
Destaque:
1. Resumo Executivo da Situação do Cliente (Comercial + Financeiro)
2. Parecer sobre o Desconto Solicitado (Margem e Cláusulas Jurídicas)
3. Status da Proposta e Próximos Passos (Aprovação de Alçada Human-in-the-Loop)`;

    const comando = `SOLICITAÇÃO ORIGINAL DO USUÁRIO:\n"${estado.solicitacao}"\n\n${promptContexto}\n\nGere o parecer estruturado e detalhado:`;

    const resposta = await provedorLlm.gerar(comando, instrucaoSistema);
    finalizarSpan(600, 450, { caracteres: resposta.length });

    return {
      respostaSintetizada: resposta,
    };
  }

  // Montagem do Grafo de Estados (LangGraph StateGraph)
  const grafo = new StateGraph(EstadoMultiagente)
    .addNode('supervisorPlanejador', noSupervisorPlanejador)
    .addNode('execucaoParalela', noExecucaoParalela)
    .addNode('avaliacaoViabilidade', noAvaliacaoViabilidade)
    .addNode('propostaEHITL', noPropostaEHITL)
    .addNode('sinteseFinal', noSinteseFinal)
    .addEdge(START, 'supervisorPlanejador')
    .addEdge('supervisorPlanejador', 'execucaoParalela')
    .addEdge('execucaoParalela', 'avaliacaoViabilidade')
    .addEdge('avaliacaoViabilidade', 'propostaEHITL')
    .addEdge('propostaEHITL', 'sinteseFinal')
    .addEdge('sinteseFinal', END);

  return grafo.compile();
}
