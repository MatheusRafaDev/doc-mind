/**
 * ============================================================================
 * 🔄 SCRIPT DE MIGRAÇÃO SQL (backend/src/banco/migrar.ts)
 * ============================================================================
 * 
 * 📍 PAPEL NO SISTEMA:
 * Executa comandos DDL no PostgreSQL para:
 * 1. Ativar a extensão nativa `vector` (`CREATE EXTENSION IF NOT EXISTS vector;`).
 * 2. Criar todas as 6 tabelas relacionais caso não existam.
 * 3. Criar índices para acelerar a busca vetorial e buscas por sistema/módulo.
 * 
 * 🔄 COMO É EXECUTADO:
 * - Automaticamente na inicialização do servidor em `src/server.ts`.
 * - Ou manualmente via terminal: `npm run db:migrate`.
 * ============================================================================
 */

import pg from 'pg';
import { ambiente } from '../config/env.js';

const { Pool } = pg;

export async function executarMigracoes() {
  const pool = new Pool({
    connectionString: ambiente.URL_BANCO_DADOS,
  });

  const cliente = await pool.connect();
  console.log('🔄 Executando migrações no PostgreSQL (DocMind)...');

  try {
    await cliente.query('BEGIN');

    // 1. Habilita a extensão pgvector para permitir o tipo vector(N) e operador <=>
    await cliente.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ Extensão pgvector habilitada com sucesso.');

    // 2. Tabela de documentos / manuais
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS documentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titulo VARCHAR(255) NOT NULL,
        sistema VARCHAR(100) NOT NULL,
        modulo VARCHAR(100) NOT NULL,
        versao VARCHAR(50) NOT NULL DEFAULT 'padrao',
        tipo_documento VARCHAR(50) NOT NULL DEFAULT 'manual',
        nome_arquivo VARCHAR(255) NOT NULL,
        tipo_mime VARCHAR(100) NOT NULL,
        caminho_arquivo TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pendente',
        mensagem_erro TEXT,
        quantidade_fragmentos INTEGER DEFAULT 0,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Tabela de fragmentos com coluna vetorial vector(768)
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS fragmentos_documentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        documento_id UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
        indice_fragmento INTEGER NOT NULL,
        conteudo TEXT NOT NULL,
        numero_pagina INTEGER,
        titulo_capitulo VARCHAR(255),
        vetor vector(${ambiente.DIMENSAO_VETOR}),
        metadados JSONB DEFAULT '{}',
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Índices para acelerar queries por documento e filtros por ERP
    await cliente.query(`
      CREATE INDEX IF NOT EXISTS idx_fragmentos_doc_id ON fragmentos_documentos(documento_id);
      CREATE INDEX IF NOT EXISTS idx_documentos_sistema_modulo ON documentos(sistema, modulo, versao);
    `);

    // 5. Tabela de conversas
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS conversas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        titulo VARCHAR(255) NOT NULL,
        sistema VARCHAR(100),
        modulo VARCHAR(100),
        versao VARCHAR(50),
        criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 6. Tabela de mensagens
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS mensagens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
        papel VARCHAR(20) NOT NULL,
        conteudo TEXT NOT NULL,
        fontes JSONB DEFAULT '[]',
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 7. Tabela de diagnósticos
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS diagnosticos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sistema VARCHAR(100) NOT NULL,
        modulo VARCHAR(100) NOT NULL,
        codigo_erro VARCHAR(100),
        log_erro TEXT NOT NULL,
        dados_enviados TEXT,
        fatos_documentados JSONB DEFAULT '[]',
        hipoteses_tecnicas JSONB DEFAULT '[]',
        passos_investigacao JSONB DEFAULT '[]',
        confianca VARCHAR(50) NOT NULL,
        fontes JSONB DEFAULT '[]',
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 8. Tabela de lacunas de conhecimento
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS lacunas_conhecimento (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pergunta TEXT NOT NULL,
        sistema VARCHAR(100),
        modulo VARCHAR(100),
        motivo TEXT NOT NULL,
        resolvido INTEGER NOT NULL DEFAULT 0,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await cliente.query('COMMIT');
    console.log('✅ Todas as tabelas do DocMind foram criadas e atualizadas com sucesso!');
  } catch (erro) {
    await cliente.query('ROLLBACK');
    console.error('❌ Erro ao executar migrações:', erro);
    throw erro;
  } finally {
    cliente.release();
    await pool.end();
  }
}

// Execução direta via CLI (quando chamado com `npm run db:migrate`)
if (process.argv[1]?.endsWith('migrar.ts') || process.argv[1]?.endsWith('migrar.js')) {
  executarMigracoes().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
