/**
 * ============================================================================
 * PROVEDOR DE MODELO DE LINGUAGEM (LLM FACTORY)
 * ============================================================================
 * 
 * Este módulo gerencia a fábrica e injeção do modelo de inteligência artificial (LLM)
 * utilizado para geração de respostas RAG e no Grafo de Diagnóstico Autônomo.
 * 
 * Provedores suportados via variável `PROVEDOR_LLM`:
 * 1. 'gemini': Google Gemini 1.5 Flash (rápido, analítico, contexto longo).
 * 2. 'openai': OpenAI GPT-4o-mini (baixo custo e alta acurácia).
 * 3. 'simulado' (default): Provedor sintético que responde com base nos fragmentos
 *    encontrados, garantindo execução de testes unitários e CI/CD sem custos.
 * ============================================================================
 */

import { IProvedorLLM } from './types.js';
import { ProvedorLLMSimulado } from './mock.js';
import { ProvedorLLMGemini } from './gemini.js';
import { ProvedorLLMOpenAI } from './openai.js';
import { ambiente } from '../../config/env.js';

let llmCache: IProvedorLLM | null = null;

/**
 * Retorna a instância ativa do modelo de linguagem (Singleton).
 */
export function obterProvedorLLM(): IProvedorLLM {
  if (llmCache) {
    return llmCache;
  }

  switch (ambiente.PROVEDOR_LLM) {
    case 'gemini':
      llmCache = new ProvedorLLMGemini();
      break;
    case 'openai':
      llmCache = new ProvedorLLMOpenAI();
      break;
    case 'simulado':
    default:
      llmCache = new ProvedorLLMSimulado();
      break;
  }

  return llmCache;
}

export * from './types.js';


