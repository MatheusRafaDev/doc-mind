/**
 * ============================================================================
 * ⚙️ CONFIGURAÇÃO DE AMBIENTE (backend/src/configuracao/ambiente.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Este arquivo é a ÚNICA fonte de verdade para variáveis de ambiente no backend.
 * Ele carrega o arquivo `.env` e valida os tipos usando o Zod.
 * 
 * 🔄 QUEM CHAMA ESTE ARQUIVO:
 * - `backend/src/server.ts` (para saber em qual porta/host escutar)
 * - `backend/src/banco/index.ts` (para saber a URL de conexão do PostgreSQL)
 * - `backend/src/provedores/vetores/index.ts` (para saber qual modelo de embedding usar)
 * - `backend/src/provedores/llm/index.ts` (para saber qual modelo de LLM usar)
 * - `backend/src/modulos/documentos/servico.documentos.ts` (para saber a pasta de upload)
 * 
 * 🛡️ SEGURANÇA:
 * Se alguma variável obrigatória estiver inválida ou ausente, a aplicação
 * interrompe a inicialização imediatamente com uma mensagem clara no terminal.
 * ============================================================================
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Carrega o arquivo .env localizado na raiz da pasta backend/
dotenv.config();

// Esquema de validação com tipagem estrita do Zod
const esquemaAmbiente = z.object({
  // Porta em que a API Fastify irá rodar (padrão: 3000)
  PORTA: z.coerce.number().default(Number(process.env.PORT) || 3000),

  // Interface de rede (0.0.0.0 permite acesso local e via containers)
  HOST: z.string().default(process.env.HOST || '0.0.0.0'),

  // String de conexão com o PostgreSQL contendo pgvector
  URL_BANCO_DADOS: z
    .string()
    .default(process.env.DATABASE_URL || 'postgres://docmind:docmind123@localhost:5432/docmind'),

  // Provedor de Embeddings: 'simulado' (offline/grátis), 'gemini' ou 'openai'
  PROVEDOR_VETOR: z
    .enum(['simulado', 'gemini', 'openai'])
    .default(
      (process.env.EMBEDDING_PROVIDER as any) === 'gemini'
        ? 'gemini'
        : (process.env.EMBEDDING_PROVIDER as any) === 'openai'
        ? 'openai'
        : 'simulado'
    ),

  // Provedor de Geração LLM: 'simulado' (offline/grátis), 'gemini' ou 'openai'
  PROVEDOR_LLM: z
    .enum(['simulado', 'gemini', 'openai'])
    .default(
      (process.env.LLM_PROVIDER as any) === 'gemini'
        ? 'gemini'
        : (process.env.LLM_PROVIDER as any) === 'openai'
        ? 'openai'
        : 'simulado'
    ),

  // Quantidade de dimensões dos vetores no pgvector (768 para Gemini/Simulado, 1536 para OpenAI)
  DIMENSAO_VETOR: z.coerce.number().default(Number(process.env.VECTOR_DIMENSION) || 768),

  // Chaves de API externas (opcionais quando PROVEDOR = 'simulado')
  CHAVE_GEMINI: z.string().optional().default(process.env.GEMINI_API_KEY || ''),
  CHAVE_OPENAI: z.string().optional().default(process.env.OPENAI_API_KEY || ''),

  // Diretório onde os arquivos originais (PDFs, TXT, MD) enviados são salvos no disco
  DIRETORIO_UPLOADS: z.string().default(process.env.UPLOAD_DIR || './uploads'),
});

// Executa a validação
const _ambiente = esquemaAmbiente.safeParse(process.env);

if (!_ambiente.success) {
  console.error('❌ Erro na validação das variáveis de ambiente:', _ambiente.error.format());
  process.exit(1);
}

// Objeto imutável e fortemente tipado exportado para o restante do backend
export const ambiente = _ambiente.data;
