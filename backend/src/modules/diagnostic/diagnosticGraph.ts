import { StateGraph, Annotation, END, START } from '@langchain/langgraph';
import { ServicoBusca, ResultadoFragmentoBusca } from '../search/search.service.js';
import { obterProvedorLLM } from '../../providers/llm/index.js';

/**
 * ============================================================================
 * 🧭 [CONCEITO: LANGGRAPH — ESTADO DO GRAFO (State Annotation)]
 * ============================================================================
 * No LangGraph, todo o fluxo compartilha um "Estado" (State).
 * Conforme o fluxo passa de um nó para o outro, os nós podem ler e atualizar
 * esse estado de forma imutável e rastreável.
 */
export const EstadoDiagnostico = Annotation.Root({
  // Dados de entrada fornecidos pelo usuário
  sistema: Annotation<string>(),
  modulo: Annotation<string>(),
  codigoErro: Annotation<string | undefined>(),
  logErro: Annotation<string>(),
  dadosEnviados: Annotation<string | undefined>(),
  operacao: Annotation<string | undefined>(),

  // Dados que o grafo vai preenchendo ao longo da execução
  tentativasBusca: Annotation<number>({
    reducer: (atual, proximo) => (proximo !== undefined ? proximo : atual),
    default: () => 0,
  }),
  fragmentosRecuperados: Annotation<ResultadoFragmentoBusca[]>({
    reducer: (_, novo) => novo,
    default: () => [],
  }),
  evidenciasSuficientes: Annotation<boolean>({
    reducer: (_, novo) => novo,
    default: () => false,
  }),
  resultadoFinal: Annotation<{
    fatosDocumentados: string[];
    hipotesesTecnicas: string[];
    passosInvestigacao: string[];
    confianca: 'alta' | 'media' | 'baixa' | 'insuficiente';
  }>({
    reducer: (_, novo) => novo,
    default: () => ({
      fatosDocumentados: [],
      hipotesesTecnicas: [],
      passosInvestigacao: [],
      confianca: 'insuficiente',
    }),
  }),
});

export type TipoEstadoDiagnostico = typeof EstadoDiagnostico.State;

/**
 * ============================================================================
 * 🧩 [CONCEITO: LANGGRAPH — NÓS DO GRAFO (Nodes)]
 * ============================================================================
 * Cada nó é uma função assíncrona que recebe o estado atual e retorna
 * apenas os campos que deseja atualizar.
 */

const servicoBusca = new ServicoBusca();
const provedorLlm = obterProvedorLLM();

// NÓ 1: Busca Inicial de Documentação (RAG Retrieval)
async function noBuscarDocumentacao(estado: TipoEstadoDiagnostico) {
  const consulta = `${estado.codigoErro || ''} ${estado.operacao || ''} ${estado.logErro}`.substring(0, 300);

  const fragmentos = await servicoBusca.buscaHibrida({
    termoBusca: consulta,
    sistema: estado.sistema,
    modulo: estado.modulo,
    limite: 4,
  });

  return {
    fragmentosRecuperados: fragmentos,
    tentativasBusca: estado.tentativasBusca + 1,
  };
}

// NÓ 2: Avaliação de Qualidade das Evidências (Guardrail / Decisão)
function noAvaliarEvidencias(estado: TipoEstadoDiagnostico) {
  const melhorPontuacao = estado.fragmentosRecuperados[0]?.pontuacao ?? 0;
  // Se a pontuação for razoável (>= 0.25), temos evidências para diagnosticar
  const suficientes = estado.fragmentosRecuperados.length > 0 && melhorPontuacao >= 0.25;

  return {
    evidenciasSuficientes: suficientes,
  };
}

// NÓ 3: Reformulação de Busca (Loop de Auto-Correção)
// Se a primeira busca falhou, tenta buscar apenas pelo código do erro e termos curtos
async function noReformularBusca(estado: TipoEstadoDiagnostico) {
  const consultaSimplificada = `${estado.codigoErro || estado.modulo}`.trim();

  const fragmentos = await servicoBusca.buscaHibrida({
    termoBusca: consultaSimplificada,
    sistema: estado.sistema,
    modulo: estado.modulo,
    limite: 3,
  });

  const melhorPontuacao = fragmentos[0]?.pontuacao ?? 0;

  return {
    fragmentosRecuperados: fragmentos,
    evidenciasSuficientes: fragmentos.length > 0 && melhorPontuacao >= 0.2,
    tentativasBusca: estado.tentativasBusca + 1,
  };
}

// NÓ 4: Geração do Diagnóstico com LLM
async function noGerarDiagnostico(estado: TipoEstadoDiagnostico) {
  const textoContexto =
    estado.fragmentosRecuperados.length > 0
      ? estado.fragmentosRecuperados
          .map(
            (f, idx) =>
              `[DOCUMENTO ${idx + 1} - ${f.tituloDocumento} | Módulo: ${f.modulo} | Página: ${f.numeroPagina || 'N/A'}]:\n${f.conteudo}`
          )
          .join('\n\n---\n\n')
      : 'Nenhuma evidência documental localizada.';

  const instrucaoSistema = `Você é um Engenheiro Especialista em Diagnóstico de ERP.
Responda ESTRITAMENTE em formato JSON puro sem crases:
{
  "fatosDocumentados": ["Fato 1", "Fato 2"],
  "hipotesesTecnicas": ["Hipótese 1"],
  "passosInvestigacao": ["Passo 1"],
  "confianca": "alta" | "media" | "baixa" | "insuficiente"
}`;

  const comando = `EVIDÊNCIAS ENCONTRADAS:\n${textoContexto}\n\nERRO:\n- Sistema: ${estado.sistema}\n- Módulo: ${estado.modulo}\n- Código: ${estado.codigoErro || 'N/D'}\n- Log: ${estado.logErro}\n- Payload: ${estado.dadosEnviados || 'N/D'}\n\nGere o diagnóstico estruturado:`;

  const resposta = await provedorLlm.gerar(comando, instrucaoSistema);

  let resultado;
  try {
    const limpo = resposta.replace(/```json/g, '').replace(/```/g, '').trim();
    resultado = JSON.parse(limpo);
  } catch {
    resultado = {
      fatosDocumentados: ['Evidências documentais analisadas.'],
      hipotesesTecnicas: [resposta.substring(0, 300)],
      passosInvestigacao: ['Conferir logs do ERP e parâmetros informados.'],
      confianca: estado.evidenciasSuficientes ? 'media' : 'baixa',
    };
  }

  return {
    resultadoFinal: resultado,
  };
}

/**
 * ============================================================================
 * 🔄 [CONCEITO: LANGGRAPH — ARESTAS CONDICIONAIS (Conditional Edges)]
 * ============================================================================
 * O LangGraph permite bifurcações com base no estado.
 * Se as evidências forem insuficientes e for a 1ª tentativa -> Tenta reformular.
 * Se já tentou ou se as evidências forem boas -> Segue para gerar diagnóstico.
 */
function decidirProximoPasso(estado: TipoEstadoDiagnostico): 'reformular' | 'gerar' {
  if (!estado.evidenciasSuficientes && estado.tentativasBusca < 2) {
    return 'reformular';
  }
  return 'gerar';
}

/**
 * ============================================================================
 * 🏗️ [CONCEITO: LANGGRAPH — MONTAGEM E COMPILAÇÃO DO GRAFO]
 * ============================================================================
 * Conecta os nós com START e END criando o workflow executável.
 */
export function construirGrafoDiagnostico() {
  const grafo = new StateGraph(EstadoDiagnostico)
    .addNode('buscarDocumentacao', noBuscarDocumentacao)
    .addNode('avaliarEvidencias', noAvaliarEvidencias)
    .addNode('reformularBusca', noReformularBusca)
    .addNode('gerarDiagnostico', noGerarDiagnostico)

    // Fluxo inicial: START -> Buscar Documentação -> Avaliar Evidências
    .addEdge(START, 'buscarDocumentacao')
    .addEdge('buscarDocumentacao', 'avaliarEvidencias')

    // Bifurcação condicional:
    .addConditionalEdges('avaliarEvidencias', decidirProximoPasso, {
      reformular: 'reformularBusca',
      gerar: 'gerarDiagnostico',
    })

    // Se reformulou, vai direto para gerar com o que conseguiu
    .addEdge('reformularBusca', 'gerarDiagnostico')

    // Conclusão: gerarDiagnostico -> END
    .addEdge('gerarDiagnostico', END);

  return grafo.compile();
}

