import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ambiente } from '../configuracao/ambiente.js';

// Tipo customizado para a coluna vector do pgvector
export const tipoVetorPg = customType<{
  data: number[];
  driverData: string;
  config: { dimensoes?: number };
}>({
  dataType(configuracao) {
    const dim = configuracao?.dimensoes ?? ambiente.DIMENSAO_VETOR;
    return `vector(${dim})`;
  },
  toDriver(valor: number[]): string {
    return `[${valor.join(',')}]`;
  },
  fromDriver(valor: string): number[] {
    if (!valor) return [];
    if (Array.isArray(valor)) return valor;
    return valor.replace(/[\[\]]/g, '').split(',').map(Number);
  },
});

export const documentos = pgTable('documentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  sistema: varchar('sistema', { length: 100 }).notNull(), // Ex: 'Volpe', 'SAP', 'Protheus'
  modulo: varchar('modulo', { length: 100 }).notNull(),   // Ex: 'Financeiro', 'Fiscal', 'APIs'
  versao: varchar('versao', { length: 50 }).notNull().default('padrao'), // Ex: '2026.1'
  tipoDocumento: varchar('tipo_documento', { length: 50 }).notNull().default('manual'), // 'manual', 'api', 'banco_dados', 'catalogo_erros'
  nomeArquivo: varchar('nome_arquivo', { length: 255 }).notNull(),
  tipoMime: varchar('tipo_mime', { length: 100 }).notNull(),
  caminhoArquivo: text('caminho_arquivo').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('pendente'), // 'pendente', 'processando', 'indexado', 'falha'
  mensagemErro: text('mensagem_erro'),
  quantidadeFragmentos: integer('quantidade_fragmentos').default(0),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export const fragmentosDocumentos = pgTable('fragmentos_documentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentoId: uuid('documento_id')
    .notNull()
    .references(() => documentos.id, { onDelete: 'cascade' }),
  indiceFragmento: integer('indice_fragmento').notNull(),
  conteudo: text('conteudo').notNull(),
  numeroPagina: integer('numero_pagina'), // Página de onde o fragmento foi extraído
  tituloCapitulo: varchar('titulo_capitulo', { length: 255 }),
  vetor: tipoVetorPg('vetor', { dimensoes: ambiente.DIMENSAO_VETOR }),
  metadados: jsonb('metadados').default({}),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
});

export const conversas = pgTable('conversas', {
  id: uuid('id').primaryKey().defaultRandom(),
  titulo: varchar('titulo', { length: 255 }).notNull(),
  sistema: varchar('sistema', { length: 100 }),
  modulo: varchar('modulo', { length: 100 }),
  versao: varchar('versao', { length: 50 }),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em').defaultNow().notNull(),
});

export const mensagens = pgTable('mensagens', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversaId: uuid('conversa_id')
    .notNull()
    .references(() => conversas.id, { onDelete: 'cascade' }),
  papel: varchar('papel', { length: 20 }).notNull(), // 'usuario', 'assistente', 'sistema'
  conteudo: text('conteudo').notNull(),
  fontes: jsonb('fontes').default([]), // Lista de fontes consultadas com páginas e trechos
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
});

export const diagnosticos = pgTable('diagnosticos', {
  id: uuid('id').primaryKey().defaultRandom(),
  sistema: varchar('sistema', { length: 100 }).notNull(),
  modulo: varchar('modulo', { length: 100 }).notNull(),
  codigoErro: varchar('codigo_erro', { length: 100 }),
  logErro: text('log_erro').notNull(),
  dadosEnviados: text('dados_enviados'), // Payload enviado
  fatosDocumentados: jsonb('fatos_documentados').default([]),
  hipotesesTecnicas: jsonb('hipoteses_tecnicas').default([]),
  passosInvestigacao: jsonb('passos_investigacao').default([]),
  confianca: varchar('confianca', { length: 50 }).notNull(), // 'alta', 'media', 'baixa', 'insuficiente'
  fontes: jsonb('fontes').default([]),
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
});

export const lacunasConhecimento = pgTable('lacunas_conhecimento', {
  id: uuid('id').primaryKey().defaultRandom(),
  pergunta: text('pergunta').notNull(),
  sistema: varchar('sistema', { length: 100 }),
  modulo: varchar('modulo', { length: 100 }),
  motivo: text('motivo').notNull(),
  resolvido: integer('resolvido').default(0).notNull(), // 0 = Não resolvido, 1 = Resolvido
  criadoEm: timestamp('criado_em').defaultNow().notNull(),
});

// Relações entre tabelas
export const relacoesDocumentos = relations(documentos, ({ many }) => ({
  fragmentos: many(fragmentosDocumentos),
}));

export const relacoesFragmentosDocumentos = relations(fragmentosDocumentos, ({ one }) => ({
  documento: one(documentos, {
    fields: [fragmentosDocumentos.documentoId],
    references: [documentos.id],
  }),
}));

export const relacoesConversas = relations(conversas, ({ many }) => ({
  mensagens: many(mensagens),
}));

export const relacoesMensagens = relations(mensagens, ({ one }) => ({
  conversa: one(conversas, {
    fields: [mensagens.conversaId],
    references: [conversas.id],
  }),
}));

