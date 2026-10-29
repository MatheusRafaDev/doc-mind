import { GoogleGenerativeAI } from '@google/generative-ai';
import { IProvedorLLM } from './types.js';
import { ambiente } from '../../config/env.js';

export class ProvedorLLMGemini implements IProvedorLLM {
  readonly nome = 'gemini';
  private clienteIa: GoogleGenerativeAI;

  constructor() {
    if (!ambiente.CHAVE_GEMINI) {
      throw new Error('CHAVE_GEMINI não configurada no arquivo .env.');
    }
    this.clienteIa = new GoogleGenerativeAI(ambiente.CHAVE_GEMINI);
  }

  async gerar(comando: string, instrucaoSistema?: string): Promise<string> {
    const modelo = this.clienteIa.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: instrucaoSistema || undefined,
    });

    const resposta = await modelo.generateContent(comando);
    return resposta.response.text();
  }
}

