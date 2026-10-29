import OpenAI from 'openai';
import { IProvedorLLM } from './types.js';
import { ambiente } from '../../config/env.js';

export class ProvedorLLMOpenAI implements IProvedorLLM {
  readonly nome = 'openai';
  private clienteOpenAi: OpenAI;

  constructor() {
    if (!ambiente.CHAVE_OPENAI) {
      throw new Error('CHAVE_OPENAI não configurada no arquivo .env.');
    }
    this.clienteOpenAi = new OpenAI({ apiKey: ambiente.CHAVE_OPENAI });
  }

  async gerar(comando: string, instrucaoSistema?: string): Promise<string> {
    const mensagens: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (instrucaoSistema) {
      mensagens.push({ role: 'system', content: instrucaoSistema });
    }
    mensagens.push({ role: 'user', content: comando });

    const resposta = await this.clienteOpenAi.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: mensagens,
      temperature: 0.2,
    });

    return resposta.choices[0]?.message?.content || '';
  }
}

