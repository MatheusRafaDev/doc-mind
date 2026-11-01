/**
 * ============================================================================
 * 🏢 SERVIÇO MULTI-AGENTE CORPORATIVO (backend/src/modules/multiagent/multiagent.service.ts)
 * ============================================================================
 * Ponto central de orquestração empresarial:
 * 1. Passa pelo Input Guardrail (Anti-Jailbreak e Mascaramento PII com Presidio).
 * 2. Invoca o Grafo de Estados (LangGraph Supervisor & Workers Concorrentes).
 * 3. Registra Spans de Telemetria e FinOps (OpenTelemetry/Langfuse).
 * 4. Passa pelo Output Guardrail (Prevenção de Alucinação e DLP).
 * 5. Persiste a execução no PostgreSQL e na fila de aprovações HITL.
 */

import { eq, desc } from 'drizzle-orm';
import { banco } from '../../database/index.js';
import { execucoesMultiagente } from '../../database/schema.js';
import { ServicoGuardrails } from '../guardrails/guardrails.service.js';
import { ServicoHitl } from '../hitl/hitl.service.js';
import { RastreadorTelemetria, RelatorioTelemetria } from '../observability/telemetry.service.js';
import { construirGrafoMultiagente } from './supervisorGraph.js';

export interface EntradaExecucaoMultiagente {
  solicitacao: string;
  solicitante?: string;
  departamento?: string;
}

export interface RespostaExecucaoMultiagente {
  id: string;
  solicitacaoOriginal: string;
  solicitacaoSanitizada: string;
  status: 'concluido' | 'aguardando_aprovacao' | 'rejeitado' | 'erro';
  guardrails: {
    seguro: boolean;
    piiDetectados: Array<{ tipo: string; original: string; mascarado: string }>;
    scoreGroundedness: number;
    dlpSeguro: boolean;
  };
  plano: Array<{ id: string; agente: string; descricao: string; status: string }>;
  resultadosAgentes: {
    comercial: any;
    financeiro: any;
    juridico: any;
  };
  decisao: {
    viavel: boolean;
    motivo: string;
    descontoSolicitado: number;
    margemFinalPercentual: number;
    necessitaAprovacaoAlcada: boolean;
  };
  propostaGerada: any;
  aprovacaoHitl: any;
  respostaSintetizada: string;
  telemetria: RelatorioTelemetria;
}

export class ServicoMultiagente {
  private guardrails = new ServicoGuardrails();
  private servicoHitl = new ServicoHitl();
  // Fallback em memória para execuções quando o PostgreSQL estiver em manutenção
  private static memoriaExecucoes = new Map<string, any>();

  async executar(entrada: EntradaExecucaoMultiagente): Promise<RespostaExecucaoMultiagente> {
    const solicitante = entrada.solicitante || 'Colaborador';
    const departamento = entrada.departamento || 'Comercial';
    const telemetria = new RastreadorTelemetria();
    const idExecucao = `exec-${Date.now()}`;

    // 1. INPUT GUARDRAIL (Sanitização e PII Masking)
    const spanGuardrail = telemetria.iniciarSpan('Input Guardrail: PII & Anti-Jailbreak', 'guardrail', 'Segurança');
    const checagemInput = this.guardrails.processarInput(entrada.solicitacao, departamento);
    spanGuardrail(50, 10, { seguro: checagemInput.seguro, piiCount: checagemInput.piiDetectados.length });

    if (!checagemInput.seguro) {
      throw new Error(checagemInput.motivoBloqueio || 'Entrada bloqueada pelas políticas de segurança corporativas.');
    }

    // 2. COMPILAÇÃO E INVOCAÇÃO DO GRAFO LANGGRAPH
    const appGrafo = construirGrafoMultiagente(telemetria, this.servicoHitl);

    const estadoFinal = await appGrafo.invoke({
      solicitacao: checagemInput.textoSanitizado,
      solicitante,
      departamento,
      cliente: 'XPTO',
      descontoSolicitado: 10,
      planoExecucao: [],
      resultadoComercial: null,
      resultadoFinanceiro: null,
      resultadoJuridico: null,
      analiseViabilidade: { viavel: false, motivo: '', margemFinalPercentual: 0, necessitaAprovacaoAlcada: true },
      propostaGerada: null,
      aprovacaoHitl: null,
      statusFinal: 'em_andamento',
      respostaSintetizada: '',
    });

    // 3. OUTPUT GUARDRAIL (Groundedness & DLP)
    const spanOutputGuard = telemetria.iniciarSpan('Output Guardrail: Groundedness & DLP', 'guardrail', 'Segurança');
    const evidenciasColetadas = [
      JSON.stringify(estadoFinal.resultadoComercial || {}),
      JSON.stringify(estadoFinal.resultadoFinanceiro || {}),
      JSON.stringify(estadoFinal.resultadoJuridico || {}),
    ];
    const checagemOutput = this.guardrails.processarOutput(estadoFinal.respostaSintetizada, evidenciasColetadas);
    spanOutputGuard(120, 20, { groundedness: checagemOutput.scoreGroundedness, dlp: checagemOutput.dlpSeguro });

    const relatorioTelemetria = telemetria.gerarRelatorio(idExecucao);

    const respostaFinal: RespostaExecucaoMultiagente = {
      id: idExecucao,
      solicitacaoOriginal: entrada.solicitacao,
      solicitacaoSanitizada: checagemInput.textoSanitizado,
      status: estadoFinal.statusFinal as any,
      guardrails: {
        seguro: checagemInput.seguro,
        piiDetectados: checagemInput.piiDetectados,
        scoreGroundedness: checagemOutput.scoreGroundedness,
        dlpSeguro: checagemOutput.dlpSeguro,
      },
      plano: estadoFinal.planoExecucao,
      resultadosAgentes: {
        comercial: estadoFinal.resultadoComercial,
        financeiro: estadoFinal.resultadoFinanceiro,
        juridico: estadoFinal.resultadoJuridico,
      },
      decisao: {
        ...estadoFinal.analiseViabilidade,
        descontoSolicitado: estadoFinal.descontoSolicitado,
      },
      propostaGerada: estadoFinal.propostaGerada,
      aprovacaoHitl: estadoFinal.aprovacaoHitl,
      respostaSintetizada: checagemOutput.textoFinal,
      telemetria: relatorioTelemetria,
    };

    // 4. PERSISTÊNCIA NO BANCO (com fallback resiliente)
    try {
      const [registro] = await banco
        .insert(execucoesMultiagente)
        .values({
          solicitacao: entrada.solicitacao,
          solicitante,
          departamento,
          status: respostaFinal.status,
          plano: respostaFinal.plano,
          resultados: respostaFinal.resultadosAgentes,
          decisao: respostaFinal.decisao,
          aprovacaoId: estadoFinal.aprovacaoHitl?.id || null,
          telemetria: relatorioTelemetria,
        })
        .returning();

      if (registro) {
        respostaFinal.id = registro.id;
      }
    } catch {
      ServicoMultiagente.memoriaExecucoes.set(idExecucao, respostaFinal);
    }

    return respostaFinal;
  }

  async listarExecucoes() {
    try {
      return await banco.select().from(execucoesMultiagente).orderBy(desc(execucoesMultiagente.criadoEm)).limit(20);
    } catch {
      return Array.from(ServicoMultiagente.memoriaExecucoes.values());
    }
  }

  async obterExecucaoPorId(id: string) {
    try {
      const [item] = await banco.select().from(execucoesMultiagente).where(eq(execucoesMultiagente.id, id));
      return item || null;
    } catch {
      return ServicoMultiagente.memoriaExecucoes.get(id) || null;
    }
  }
}
