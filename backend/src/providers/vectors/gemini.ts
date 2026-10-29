import { GoogleGenerativeAI } from '@google/generative-ai';
import { IProvedorVetorial } from './types.js';
import { ambiente } from '../../config/env.js';

export class ProvedorVetorGemini implements IProvedorVetorial {
  readonly nome = 'gemini';
  readonly dimensao = 768;
  private clienteIa: GoogleGenerativeAI;

  constructor() {
    if (!ambiente.CHAVE_GEMINI) {
      throw new Error('CHAVE_GEMINI não configurada no arquivo .env.');
    }
    this.clienteIa = new GoogleGenerativeAI(ambiente.CHAVE_GEMINI);
  }

  async gerar(texto: string): Promise<number[]> {
    const modelo = this.clienteIa.getGenerativeModel({ model: 'text-embedding-004' });
    const resultado = await modelo.embedContent(texto);
    return resultado.embedding.values;
  }

  async gerarLote(textos: string[]): Promise<number[][]> {
    const modelo = this.clienteIa.getGenerativeModel({ model: 'text-embedding-004' });
    const resultado = await modelo.batchEmbedContents({
      requests: textos.map((t) => ({
        content: { parts: [{ text: t }], role: 'user' },
      })),
    });
    return resultado.embeddings.map((e) => e.values);
  }
}

