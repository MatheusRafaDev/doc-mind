import { IProvedorVetorial } from './tipos.js';
import { ProvedorVetorSimulado } from './simulado.js';
import { ProvedorVetorGemini } from './gemini.js';
import { ProvedorVetorOpenAI } from './openai.js';
import { ambiente } from '../../configuracao/ambiente.js';

let provedorCache: IProvedorVetorial | null = null;

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

