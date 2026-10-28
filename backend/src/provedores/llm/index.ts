import { IProvedorLLM } from './tipos.js';
import { ProvedorLLMSimulado } from './simulado.js';
import { ProvedorLLMGemini } from './gemini.js';
import { ProvedorLLMOpenAI } from './openai.js';
import { ambiente } from '../../configuracao/ambiente.js';

let llmCache: IProvedorLLM | null = null;

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

export * from './tipos.js';

