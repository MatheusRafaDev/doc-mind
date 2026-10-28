/**
 * ============================================================================
 * PROVEDOR VETORIAL (FACTORY PATTERN)
 * ============================================================================
 * 
 * Este arquivo atua como uma fábrica (Factory) para geração de embeddings vetoriais.
 * Dependendo da variável de ambiente `PROVEDOR_VETOR` (definida no .env):
 * 
 * 1. 'gemini': Utiliza o modelo text-embedding-004 do Google Gemini via API.
 * 2. 'openai': Utiliza o modelo text-embedding-3-small da OpenAI.
 * 3. 'simulado' (default): Gera vetores sintéticos normalizados determinísticos,
 *    permitindo testar a busca e todo o fluxo RAG sem custo de API e sem internet.
 * 
 * O resultado é armazenado em cache singleton para reutilização em todo o backend.
 * ============================================================================
 */

import { IProvedorVetorial } from './tipos.js';
import { ProvedorVetorSimulado } from './simulado.js';
import { ProvedorVetorGemini } from './gemini.js';
import { ProvedorVetorOpenAI } from './openai.js';
import { ambiente } from '../../configuracao/ambiente.js';

let provedorCache: IProvedorVetorial | null = null;

/**
 * Retorna a instância configurada do provedor vetorial (Singleton).
 */
export function obterProvedorVetorial(): IProvedorVetorial {
  if (provedorCache) {
    return provedorCache;
  }

  switch (ambiente.PROVEDOR_VETOR) {
    case 'gemini':
      provedorCache = new ProvedorVetorGemini();
      break;
    case 'openai':
      provedorCache = new ProvedorVetorOpenAI();
      break;
    case 'simulado':
    default:
      provedorCache = new ProvedorVetorSimulado();
      break;
  }

  return provedorCache;
}

export * from './tipos.js';


