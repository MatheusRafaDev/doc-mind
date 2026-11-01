/**
 * ============================================================================
 * 📊 OBSERVABILIDADE & FINOPS (backend/src/modules/observability/telemetry.service.ts)
 * ============================================================================
 * Implementa o rastreamento distribuído (OpenTelemetry / Langfuse padrão),
 * monitorando latência de spans, consumo de tokens e rateio de custos por departamento.
 */

export interface SpanTelemetria {
  id: string;
  nome: string;
  agente?: string;
  departamento: string;
  tipo: 'guardrail' | 'supervisor' | 'worker' | 'mcp_tool' | 'hitl' | 'sintese';
  inicioMs: number;
  duracaoMs: number;
  tokensEntrada: number;
  tokensSaida: number;
  custoUsd: number;
  detalhes?: any;
}

export interface RelatorioTelemetria {
  execucaoId: string;
  duracaoTotalMs: number;
  totalTokens: number;
  totalCustoUsd: number;
  totalCustoBrl: number;
  spans: SpanTelemetria[];
  custoPorDepartamento: Record<string, { tokens: number; custoUsd: number; custoBrl: number }>;
}

export class RastreadorTelemetria {
  private spans: SpanTelemetria[] = [];
  private inicioGeral = Date.now();
  private readonly VALOR_DOLAR_BRL = 5.75;
  // Preço médio ponderado por 1M de tokens: $0.15 entrada, $0.60 saída
  private readonly CUSTO_POR_TOKEN_ENTRADA = 0.00000015;
  private readonly CUSTO_POR_TOKEN_SAIDA = 0.0000006;

  iniciarSpan(
    nome: string,
    tipo: SpanTelemetria['tipo'],
    departamento: string,
    agente?: string
  ): (tokensEntrada?: number, tokensSaida?: number, detalhes?: any) => SpanTelemetria {
    const inicio = Date.now();
    const id = `span-${Math.random().toString(36).substring(2, 9)}`;

    return (tokensEntrada = 100, tokensSaida = 50, detalhes = {}) => {
      const duracao = Date.now() - inicio;
      const custo =
        tokensEntrada * this.CUSTO_POR_TOKEN_ENTRADA + tokensSaida * this.CUSTO_POR_TOKEN_SAIDA;

      const span: SpanTelemetria = {
        id,
        nome,
        agente,
        departamento,
        tipo,
        inicioMs: inicio,
        duracaoMs: duracao,
        tokensEntrada,
        tokensSaida,
        custoUsd: Number(custo.toFixed(6)),
        detalhes,
      };

      this.spans.push(span);
      return span;
    };
  }

  gerarRelatorio(execucaoId: string): RelatorioTelemetria {
    const duracaoTotalMs = Date.now() - this.inicioGeral;
    let totalTokens = 0;
    let totalCustoUsd = 0;
    const custoPorDepartamento: Record<string, { tokens: number; custoUsd: number; custoBrl: number }> = {};

    for (const span of this.spans) {
      const tokens = span.tokensEntrada + span.tokensSaida;
      totalTokens += tokens;
      totalCustoUsd += span.custoUsd;

      if (!custoPorDepartamento[span.departamento]) {
        custoPorDepartamento[span.departamento] = { tokens: 0, custoUsd: 0, custoBrl: 0 };
      }
      custoPorDepartamento[span.departamento].tokens += tokens;
      custoPorDepartamento[span.departamento].custoUsd += span.custoUsd;
      custoPorDepartamento[span.departamento].custoBrl += span.custoUsd * this.VALOR_DOLAR_BRL;
    }

    // Arredonda valores
    for (const d of Object.keys(custoPorDepartamento)) {
      custoPorDepartamento[d].custoUsd = Number(custoPorDepartamento[d].custoUsd.toFixed(6));
      custoPorDepartamento[d].custoBrl = Number(custoPorDepartamento[d].custoBrl.toFixed(4));
    }

    return {
      execucaoId,
      duracaoTotalMs,
      totalTokens,
      totalCustoUsd: Number(totalCustoUsd.toFixed(6)),
      totalCustoBrl: Number((totalCustoUsd * this.VALOR_DOLAR_BRL).toFixed(4)),
      spans: this.spans,
      custoPorDepartamento,
    };
  }
}
