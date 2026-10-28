import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const esquemaAmbiente = z.object({
  PORTA: z.coerce.number().default(Number(process.env.PORT) || 3000),
  HOST: z.string().default(process.env.HOST || '0.0.0.0'),
  URL_BANCO_DADOS: z
    .string()
    .default(process.env.DATABASE_URL || 'postgres://docmind:docmind123@localhost:5432/docmind'),
  PROVEDOR_VETOR: z
    .enum(['simulado', 'gemini', 'openai'])
    .default((process.env.EMBEDDING_PROVIDER as any) === 'gemini' ? 'gemini' : (process.env.EMBEDDING_PROVIDER as any) === 'openai' ? 'openai' : 'simulado'),
  PROVEDOR_LLM: z
    .enum(['simulado', 'gemini', 'openai'])
    .default((process.env.LLM_PROVIDER as any) === 'gemini' ? 'gemini' : (process.env.LLM_PROVIDER as any) === 'openai' ? 'openai' : 'simulado'),
  DIMENSAO_VETOR: z.coerce.number().default(Number(process.env.VECTOR_DIMENSION) || 768),
  CHAVE_GEMINI: z.string().optional().default(process.env.GEMINI_API_KEY || ''),
  CHAVE_OPENAI: z.string().optional().default(process.env.OPENAI_API_KEY || ''),
  DIRETORIO_UPLOADS: z.string().default(process.env.UPLOAD_DIR || './uploads'),
});

const _ambiente = esquemaAmbiente.safeParse(process.env);

if (!_ambiente.success) {
  console.error('❌ Erro na validação das variáveis de ambiente:', _ambiente.error.format());
  process.exit(1);
}

export const ambiente = _ambiente.data;

