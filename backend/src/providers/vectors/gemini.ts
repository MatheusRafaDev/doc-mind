import { GoogleGenerativeAI } from '@google/generative-ai';
import { IProvedorVetorial } from './types.js';
import { ambiente } from '../../config/env.js';

export class ProvedorVetorGemini implements IProvedorVetorial {
  readonly nome = 'gemini';
  readonly dimensao = 768;
  private clienteIa: GoogleGenerativeAI;
  private modeloNome: string = 'gemini-embedding-001';

  constructor() {
    if (!ambiente.CHAVE_GEMINI) {
      throw new Error('CHAVE_GEMINI não configurada no arquivo .env.');
    }
    this.clienteIa = new GoogleGenerativeAI(ambiente.CHAVE_GEMINI);
  }

  async gerar(texto: string): Promise<number[]> {
    const modelosParaTentar = [this.modeloNome, 'gemini-embedding-2', 'text-embedding-004'];
    let ultimoErro: any = null;

    for (const nomeModelo of modelosParaTentar) {
      try {
        const modelo = this.clienteIa.getGenerativeModel({ model: nomeModelo });
        const resultado = await (modelo as any).embedContent({
          content: { parts: [{ text: texto }], role: 'user' },
          outputDimensionality: this.dimensao,
        });
        this.modeloNome = nomeModelo;
        return resultado.embedding.values;
      } catch (err: any) {
        ultimoErro = err;
      }
    }

    throw ultimoErro || new Error('Não foi possível gerar embedding com o provedor Gemini.');
  }

  async gerarLote(textos: string[]): Promise<number[][]> {
    if (textos.length === 0) return [];

    const modelosParaTentar = [this.modeloNome, 'gemini-embedding-2', 'text-embedding-004'];
    let ultimoErro: any = null;

    for (const nomeModelo of modelosParaTentar) {
      try {
        const modelo = this.clienteIa.getGenerativeModel({ model: nomeModelo });
        const resultado = await (modelo as any).batchEmbedContents({
          requests: textos.map((t) => ({
            content: { parts: [{ text: t }], role: 'user' },
            outputDimensionality: this.dimensao,
          })),
        });
        this.modeloNome = nomeModelo;
        return resultado.embeddings.map((e: any) => e.values);
      } catch (err: any) {
        ultimoErro = err;
      }
    }

    // Se o batch nativo falhar em todos os modelos, faz chamadas individuais concorrentes
    try {
      return await Promise.all(textos.map((t) => this.gerar(t)));
    } catch {
      throw ultimoErro || new Error('Não foi possível gerar lote de embeddings com o provedor Gemini.');
    }
  }
}
