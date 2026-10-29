/**
 * ============================================================================
 * CAMADA DE COMUNICAÇÃO HTTP COM O BACKEND (API CLIENT)
 * ============================================================================
 * 
 * Este arquivo centraliza todas as requisições HTTP efetuadas pela interface Next.js 14
 * para a API Fastify backend.
 * 
 * Configuração:
 * - A URL base é obtida de `process.env.NEXT_PUBLIC_URL_API` (definida em .env.local).
 * - Se não definida, utiliza o padrão 'http://localhost:3000'.
 * - Cada método mapeia exatamente um endpoint REST da API v1 documentada em Swagger.
 * ============================================================================
 */

import {
  Documento,
  DocumentoDetalhado,
  MensagemChat,
  RespostaDiagnostico,
  FragmentoBusca,
  VisaoGeralMetricas,
  LacunaConhecimento,
} from './types';

const URL_API = process.env.NEXT_PUBLIC_URL_API || 'http://localhost:3000';

/**
 * Verifica se o servidor backend está online e saudável (GET /saude).
 */
export async function checarSaudeApi(): Promise<{ online: boolean; dados?: any }> {
  try {
    const res = await fetch(`${URL_API}/saude`, { cache: 'no-store' });
    if (!res.ok) return { online: false };
    const dados = await res.json();
    return { online: true, dados };
  } catch {
    return { online: false };
  }
}

/**
 * Lista os manuais e documentos técnicos catalogados (GET /api/v1/documentos).
 */
export async function listarDocumentos(filtros?: {
  sistema?: string;
  modulo?: string;
  versao?: string;
}): Promise<Documento[]> {
  const params = new URLSearchParams();
  if (filtros?.sistema) params.append('sistema', filtros.sistema);
  if (filtros?.modulo) params.append('modulo', filtros.modulo);
  if (filtros?.versao) params.append('versao', filtros.versao);

  const res = await fetch(`${URL_API}/api/v1/documentos?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Falha ao listar documentos.');
  return res.json();
}

/**
 * Obtém os detalhes completos de um documento, incluindo todos os seus fragmentos e vetores (GET /api/v1/documentos/:id).
 */
export async function obterDocumentoPorId(id: string): Promise<DocumentoDetalhado> {
  const res = await fetch(`${URL_API}/api/v1/documentos/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Falha ao carregar detalhes e chunks do documento.');
  return res.json();
}

/**
 * Envia um arquivo PDF com seus metadados para indexação vetorial (POST /api/v1/documentos/upload).
 */
export async function uploadDocumento(formData: FormData): Promise<any> {
  const res = await fetch(`${URL_API}/api/v1/documentos/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || 'Falha no upload do manual.');
  }
  return res.json();
}

/**
 * Cria um documento e seus fragmentos diretamente colando texto ou Markdown (Ctrl+V) (POST /api/v1/documentos/texto).
 */
export async function criarDocumentoTexto(dados: {
  titulo: string;
  sistema: string;
  modulo: string;
  versao?: string;
  tipoDocumento?: string;
  conteudo: string;
}): Promise<any> {
  const res = await fetch(`${URL_API}/api/v1/documentos/texto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.erro || 'Falha ao salvar e indexar o Markdown colado.');
  }
  return res.json();
}

/**
 * Remove um documento e todos os seus fragmentos vetoriais (DELETE /api/v1/documentos/:id).
 */
export async function excluirDocumento(id: string): Promise<boolean> {
  const res = await fetch(`${URL_API}/api/v1/documentos/${id}`, {
    method: 'DELETE',
  });
  return res.ok;
}

/**
 * Envia uma pergunta ao Assistente RAG Conversacional (POST /api/v1/chat).
 * Retorna a resposta fundamentada com citações exatas de página e documento.
 */
export async function enviarPerguntaChat(dados: {
  pergunta: string;
  conversaId?: string;
  sistema?: string;
  modulo?: string;
  versao?: string;
}): Promise<{ conversaId: string; resposta: string; fontes: any[] }> {
  const res = await fetch(`${URL_API}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Falha ao enviar mensagem no chat.');
  return res.json();
}

/**
 * Executa pesquisa híbrida técnica (vetorial + palavras-chave) nos manuais (POST /api/v1/busca/hibrida).
 */
export async function executarBuscaHibrida(dados: {
  termoBusca: string;
  sistema?: string;
  modulo?: string;
  versao?: string;
  limite?: number;
}): Promise<FragmentoBusca[]> {
  const res = await fetch(`${URL_API}/api/v1/busca/hibrida`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Falha na busca técnica.');
  return res.json();
}

/**
 * Executa o fluxo de análise e diagnóstico autônomo com LangGraph (POST /api/v1/diagnostico).
 */
export async function diagnosticarErro(dados: {
  sistema: string;
  modulo: string;
  codigoErro?: string;
  logErro: string;
  dadosEnviados?: string;
  operacao?: string;
}): Promise<RespostaDiagnostico> {
  const res = await fetch(`${URL_API}/api/v1/diagnostico`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Falha ao processar diagnóstico de erro.');
  return res.json();
}

/**
 * Retorna os indicadores de precisão, lacunas e volume de consultas (GET /api/v1/metricas/visao-geral).
 */
export async function obterVisaoGeralMetricas(): Promise<VisaoGeralMetricas> {
  const res = await fetch(`${URL_API}/api/v1/metricas/visao-geral`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Falha ao obter visão geral de métricas.');
  return res.json();
}

/**
 * Lista as perguntas não respondidas ou tópicos sem cobertura (GET /api/v1/metricas/lacunas).
 */
export async function obterLacunasConhecimento(resolvido?: boolean): Promise<LacunaConhecimento[]> {
  const params = resolvido !== undefined ? `?resolvido=${resolvido}` : '';
  const res = await fetch(`${URL_API}/api/v1/metricas/lacunas${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Falha ao obter lacunas de conhecimento.');
  return res.json();
}

/**
 * Marca uma lacuna de conhecimento como resolvida após novo manual ser enviado (PATCH /api/v1/metricas/lacunas/:id/resolver).
 */
export async function resolverLacuna(id: string): Promise<boolean> {
  const res = await fetch(`${URL_API}/api/v1/metricas/lacunas/${id}/resolver`, {
    method: 'PATCH',
  });
  return res.ok;
}


