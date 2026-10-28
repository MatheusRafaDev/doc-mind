import OpenAI from 'openai';
import { IProvedorVetorial } from './tipos.js';
import { ambiente } from '../../configuracao/ambiente.js';

export class ProvedorVetorOpenAI implements IProvedorVetorial {
  readonly nome = 'openai';
  readonly dimensao = 1536;
  private clienteOpenAi: OpenAI;

  constructor() {
    if (!ambiente.CHAVE_OPENAI) {
      throw new Error('CHAVE_OPENAI não configurada no arquivo .env.');
    }
    this.clienteOpenAi = new OpenAI({ apiKey: ambiente.CHAVE_OPENAI });
  }

  async gerar(texto: string): Promise<number[]> {
    const resposta = await this.clienteOpenAi.embeddings.create({
      model: 'text-embedding-3-small',
      input: texto,
    });
    return resposta.data[0].embedding;
  }

  async gerarLote(textos: string[]): Promise<number[][]> {
    const resposta = await this.clienteOpenAi.embeddings.create({
      model: 'text-embedding-3-small',
      input: textos,
    });
    return resposta.data.map((d) => d.embedding);
  }
}

