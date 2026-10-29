import { GoogleGenerativeAI } from '@google/generative-ai';
import { IProvedorLLM } from './types.js';
import { ambiente } from '../../config/env.js';

export class ProvedorLLMGemini implements IProvedorLLM {
  readonly nome = 'gemini';
  private clienteIa: GoogleGenerativeAI;
  private modeloNome: string = 'gemini-3.5-flash';

  constructor() {
    if (!ambiente.CHAVE_GEMINI) {
      throw new Error('CHAVE_GEMINI não configurada no arquivo .env.');
    }
    this.clienteIa = new GoogleGenerativeAI(ambiente.CHAVE_GEMINI);
  }

  async gerar(comando: string, instrucaoSistema?: string): Promise<string> {
    const modelosParaTentar = [this.modeloNome, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
    let ultimoErro: any = null;

    for (const nomeModelo of modelosParaTentar) {
      try {
        const modelo = this.clienteIa.getGenerativeModel({
          model: nomeModelo,
          systemInstruction: instrucaoSistema || undefined,
        });
        const resposta = await modelo.generateContent(comando);
        this.modeloNome = nomeModelo;
        return resposta.response.text();
      } catch (err: any) {
        ultimoErro = err;
      }
    }

    throw ultimoErro || new Error('Não foi possível gerar resposta com o modelo Gemini.');
  }
}
