/**
 * ============================================================================
 * 🐘 CONEXÃO COM O BANCO DE DADOS (backend/src/banco/index.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Inicializa o pool de conexões com o PostgreSQL usando o driver oficial `pg`
 * e instancia o Drizzle ORM vinculado aos schemas tipados de `src/banco/esquema.ts`.
 * 
 * 🔄 QUEM USA:
 * - Todos os serviços (`ServicoDocumentos`, `ServicoBusca`, `ServicoChat`,
 *   `ServicoDiagnostico`, `ServicoMetricas`) utilizam a constante `banco` ou
 *   o `poolConexao` para realizar queries, inserções e buscas vetoriais.
 * ============================================================================
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as esquema from './schema.js';
import { ambiente } from '../config/env.js';

const { Pool } = pg;

// Pool de conexões reutilizáveis gerenciado pelo driver pg
export const poolConexao = new Pool({
  connectionString: ambiente.URL_BANCO_DADOS,
});

// Instância tipada do Drizzle ORM contendo todas as tabelas
export const banco = drizzle(poolConexao, { schema: esquema });

/**
 * Função utilitária para testar a conectividade no endpoint `/saude`
 */
export async function verificarConexaoBanco(): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    const cliente = await poolConexao.connect();
    await cliente.query('SELECT 1');
    cliente.release();
    return { sucesso: true, mensagem: 'Conectado ao PostgreSQL com sucesso.' };
  } catch (erro) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    return { sucesso: false, mensagem: `Falha na conexão com o banco de dados: ${msg}` };
  }
}
