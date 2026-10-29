import { banco } from '../../database/index.js';
import { diagnosticos } from '../../database/schema.js';
import { construirGrafoDiagnostico } from './diagnosticGraph.js';

export interface EntradaDiagnostico {
  sistema: string;
  modulo: string;
  codigoErro?: string;
  logErro: string;
  dadosEnviados?: string; // Payload
  operacao?: string;
}

export interface ResultadoDiagnostico {
  id: string;
  sistema: string;
  modulo: string;
  codigoErro?: string;
  confianca: 'alta' | 'media' | 'baixa' | 'insuficiente';
  fatosDocumentados: string[];
  hipotesesTecnicas: string[];
  passosInvestigacao: string[];
  fontes: Array<{
    tituloDocumento: string;
    sistema: string;
    modulo: string;
    numeroPagina: number | null;
    tituloCapitulo: string | null;
  }>;
}

export class ServicoDiagnostico {
  // Instância do Grafo de Estados compilado pelo LangGraph
  private appGrafo = construirGrafoDiagnostico();

  async diagnosticar(entrada: EntradaDiagnostico): Promise<ResultadoDiagnostico> {
    const { sistema, modulo, codigoErro, logErro, dadosEnviados, operacao } = entrada;

    /**
     * ========================================================================
     * 🚀 [CONCEITO: LANGGRAPH EXECUTION]
     * Invocamos o Grafo passando o estado inicial. O LangGraph gerencia:
     * 1. Execução do nó 'buscarDocumentacao'
     * 2. Roteamento condicional no nó 'avaliarEvidencias'
     * 3. Loop de auto-correção 'reformularBusca' (se necessário)
     * 4. Geração final estruturada no nó 'gerarDiagnostico'
     * ========================================================================
     */
    const estadoFinal = await this.appGrafo.invoke({
      sistema,
      modulo,
      codigoErro,
      logErro,
      dadosEnviados,
      operacao,
      tentativasBusca: 0,
      fragmentosRecuperados: [],
      evidenciasSuficientes: false,
      resultadoFinal: {
        fatosDocumentados: [],
        hipotesesTecnicas: [],
        passosInvestigacao: [],
        confianca: 'insuficiente',
      },
    });

    const fontes = estadoFinal.fragmentosRecuperados.map((f) => ({
      tituloDocumento: f.tituloDocumento,
      sistema: f.sistema,
      modulo: f.modulo,
      numeroPagina: f.numeroPagina,
      tituloCapitulo: f.tituloCapitulo,
    }));

    const resultado = estadoFinal.resultadoFinal;

    // Persiste o diagnóstico e fontes no PostgreSQL
    const [registro] = await banco
      .insert(diagnosticos)
      .values({
        sistema,
        modulo,
        codigoErro,
        logErro,
        dadosEnviados,
        fatosDocumentados: resultado.fatosDocumentados || [],
        hipotesesTecnicas: resultado.hipotesesTecnicas || [],
        passosInvestigacao: resultado.passosInvestigacao || [],
        confianca: resultado.confianca || 'baixa',
        fontes,
      })
      .returning();

    return {
      id: registro.id,
      sistema: registro.sistema,
      modulo: registro.modulo,
      codigoErro: registro.codigoErro || undefined,
      confianca: (registro.confianca as any) || 'media',
      fatosDocumentados: registro.fatosDocumentados as string[],
      hipotesesTecnicas: registro.hipotesesTecnicas as string[],
      passosInvestigacao: registro.passosInvestigacao as string[],
      fontes,
    };
  }
}
