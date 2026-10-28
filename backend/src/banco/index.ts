import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as esquema from './esquema.js';
import { ambiente } from '../configuracao/ambiente.js';

const { Pool } = pg;

export const poolConexao = new Pool({
  connectionString: ambiente.URL_BANCO_DADOS,
});

export const banco = drizzle(poolConexao, { schema: esquema });

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

